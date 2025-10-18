import type { NextApiRequest, NextApiResponse } from 'next';

const STOCK_SERVICE_URL = process.env.STOCK_SERVICE_URL || 'http://localhost:5003';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const response = await fetch(`${STOCK_SERVICE_URL}/stocks/search?q=${encodeURIComponent(q)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Stock search error:', error);
    return res.status(500).json({ 
      error: 'Failed to search stocks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
