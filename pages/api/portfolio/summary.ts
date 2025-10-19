import { NextApiRequest, NextApiResponse } from 'next';
import { getPortfolioSummary, getUserStocks } from '../../../lib/services/stockService';
import { verifyToken } from '../../../lib/services/userService';

// Middleware to verify JWT token
async function authenticateRequest(req: NextApiRequest): Promise<number | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const user = await verifyToken(token);
  return user ? user.id : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user
  const userId = await authenticateRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const t0 = Date.now();
    const summary = await getPortfolioSummary(userId);
    const holdings = await getUserStocks(userId);
    const elapsed = Date.now() - t0;
    
    if (!summary) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Return the summary data directly with holdings array
    const payload = { ...summary, holdings: holdings || [] } as any;
    if (process.env.NODE_ENV !== 'production') {
      try {
        const counts = (keys: string[]) => keys.reduce((acc: any, k) => {
          acc[k] = (payload.holdings || []).reduce((c: number, h: any) => c + ((h[k] === null || h[k] === undefined || h[k] === '') ? 1 : 0), 0);
          return acc;
        }, {});
        console.log('[risk-debug] /api/portfolio/summary', {
          userId,
          elapsedMs: elapsed,
          holdingsCount: (payload.holdings || []).length,
          nullCounts: counts(['shares_owned','purchase_price','current_price','purchase_date']),
          sample: (payload.holdings || []).slice(0, 2)
        });
      } catch (e) {
        console.log('[risk-debug] summary logging failed', e);
      }
    }
    res.status(200).json(payload);

  } catch (error) {
    console.error('Portfolio summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
