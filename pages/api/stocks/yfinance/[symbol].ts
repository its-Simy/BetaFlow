import type { NextApiRequest, NextApiResponse } from 'next';

const STOCK_SERVICE_URL = process.env.STOCK_SERVICE_URL || 'http://localhost:5003';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query;
  const { method } = req;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Stock symbol is required' });
  }

  try {
    let response;
    let endpoint = '';

    switch (method) {
      case 'GET':
        // Check if it's a history request
        if (req.query.history === 'true') {
          endpoint = `/stocks/${symbol}/history`;
          const period = req.query.period || '1mo';
          const interval = req.query.interval || '1d';
          response = await fetch(`${STOCK_SERVICE_URL}${endpoint}?period=${period}&interval=${interval}`);
        }
        // Check if it's a quote request
        else if (req.query.quote === 'true') {
          endpoint = `/stocks/${symbol}/quote`;
          response = await fetch(`${STOCK_SERVICE_URL}${endpoint}`);
        }
        // Default to stock details
        else {
          endpoint = `/stocks/${symbol}`;
          response = await fetch(`${STOCK_SERVICE_URL}${endpoint}`);
        }
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Stock service error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch stock data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
