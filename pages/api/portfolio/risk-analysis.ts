import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/services/userService';

const FINANCE_OPTIMIZER_URL = process.env.FINANCE_OPTIMIZER_URL || 'http://localhost:5004';

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
    
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({ error: 'Holdings array is required and must not be empty' });
    }

    // Validate each holding
    for (const holding of holdings) {
      if (!holding.symbol || typeof holding.shares !== 'number' || typeof holding.value !== 'number') {
        return res.status(400).json({ 
          error: 'Each holding must have symbol (string), shares (number), and value (number)' 
        });
      }
    }

    // Call Python service
    const response = await fetch(`${FINANCE_OPTIMIZER_URL}/analyze-risk`, {
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
