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
    const summary = await getPortfolioSummary(userId);
    const holdings = await getUserStocks(userId);
    
    if (!summary) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Return the summary data directly with holdings array
    res.status(200).json({
      ...summary,
      holdings: holdings || []
    });

  } catch (error) {
    console.error('Portfolio summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
