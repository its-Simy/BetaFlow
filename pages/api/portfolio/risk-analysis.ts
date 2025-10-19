import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/services/userService';

const ENV_FINANCE_OPTIMIZER_URL = process.env.FINANCE_OPTIMIZER_URL || '';

let resolvedRiskBaseUrl: string | null = null;
let resolvedRiskBaseUrlExpiry = 0;

async function probeHealth(baseUrl: string, timeoutMs = 800): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${baseUrl}/health`, { method: 'GET', signal: controller.signal } as any);
    clearTimeout(id);
    return res.ok;
  } catch {
    return false;
  }
}

async function resolveRiskServiceBase(): Promise<{ url: string | null; attempted: string[] }> {
  const attempted: string[] = [];
  const now = Date.now();
  if (resolvedRiskBaseUrl && now < resolvedRiskBaseUrlExpiry) {
    return { url: resolvedRiskBaseUrl, attempted };
  }

  const candidates: string[] = [];
  if (ENV_FINANCE_OPTIMIZER_URL) candidates.push(ENV_FINANCE_OPTIMIZER_URL);
  candidates.push('http://localhost:5004');
  for (let p = 5005; p <= 5010; p++) candidates.push(`http://localhost:${p}`);
  for (let p = 8000; p <= 8010; p++) candidates.push(`http://localhost:${p}`);

  for (const base of candidates) {
    attempted.push(base);
    const ok = await probeHealth(base);
    if (ok) {
      resolvedRiskBaseUrl = base;
      resolvedRiskBaseUrlExpiry = now + 5 * 60 * 1000; // 5 minutes
      if (process.env.NODE_ENV !== 'production') {
        console.log('[risk-debug] resolved risk service base', { base });
      }
      return { url: base, attempted };
    }
  }
  return { url: null, attempted };
}

interface RiskAnalysisRequest {
  holdings: Array<{
    symbol: string;
    shares: number;
    value: number;
    sector?: string;
  }>;
}

interface RiskAnalysisResponse {
  beta?: number;
  volatility: number;
  sharpe_ratio?: number;
  max_drawdown: number;
  var_95: number;
  diversification_score: number;
  correlations?: Record<string, Record<string, number>>;
  num_holdings: number;
  total_value: number;
  holdings_breakdown: Array<{
    symbol: string;
    weight: number;
    sector: string;
  }>;
  cached?: boolean;
  error?: string;
  message?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<RiskAnalysisResponse | { error: string }>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await verifyToken(token);
    if (!user) {
      console.error('Token verification failed for token:', token.substring(0, 20) + '...');
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        message: 'Authentication failed. Please log in again.'
      });
    }

    const userId = user.id; // Extract userId from user object

    // Validate request body
    const { holdings }: RiskAnalysisRequest = req.body;
    if (process.env.NODE_ENV !== 'production') {
      try {
        const symbols = Array.isArray(holdings) ? holdings.map(h => h.symbol) : [];
        const numericIssues = (holdings || []).map(h => ({
          symbol: h.symbol,
          sharesIsNumber: typeof h.shares === 'number' && Number.isFinite(h.shares),
          valueIsNumber: typeof h.value === 'number' && Number.isFinite(h.value)
        })).filter(x => !x.sharesIsNumber || !x.valueIsNumber);
        console.log('[risk-debug] risk API received', {
          userId,
          count: Array.isArray(holdings) ? holdings.length : 0,
          symbols: symbols.slice(0, 50),
          numericIssuesCount: numericIssues.length,
          numericIssues: numericIssues.slice(0, 3)
        });
      } catch (e) {
        console.log('[risk-debug] risk API receive logging failed', e);
      }
    }
    
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({ error: 'Holdings array is required and must not be empty' });
    }

    // Validate each holding and compute coverage stats
    let invalidCount = 0;
    for (const holding of holdings) {
      if (!holding.symbol || typeof holding.shares !== 'number' || typeof holding.value !== 'number' || !Number.isFinite(holding.shares) || !Number.isFinite(holding.value)) {
        invalidCount++;
      }
    }
    if (invalidCount > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[risk-debug] coverage', { total: holdings.length, invalidCount });
      }
      // We still enforce structure strictly as before
      return res.status(400).json({ 
        error: 'Each holding must have symbol (string), shares (number), and value (number)'
      });
    }

    // Resolve service base URL (env first, then probe localhost ports)
    const { url: baseUrl, attempted } = await resolveRiskServiceBase();
    if (!baseUrl) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[risk-debug] risk service unreachable', { attempted });
      }
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Risk analysis service is not reachable',
      });
    }

    // Call Python service
    const response = await fetch(`${baseUrl}/analyze-risk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        holdings,
        user_id: userId  // Pass user ID for caching
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Finance optimizer service error:', errorData);
      
      return res.status(response.status).json({
        error: errorData.error || 'Risk analysis failed',
        message: errorData.message || 'Unable to analyze portfolio risk'
      });
    }

    const riskData = await response.json();
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[risk-debug] risk API success', {
          userId,
          hasBeta: riskData && typeof (riskData as any).beta !== 'undefined',
          num_holdings: (riskData as any)?.num_holdings,
          total_value: (riskData as any)?.total_value,
          cached: (riskData as any)?.cached
        });
      } catch {}
    }
    
    // Return the risk analysis results
    return res.status(200).json(riskData);

  } catch (error) {
    console.error('Risk analysis API error:', error);
    
    // Handle specific error types
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Risk analysis service is not running. Please try again later.'
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to analyze portfolio risk'
    });
  }
}
