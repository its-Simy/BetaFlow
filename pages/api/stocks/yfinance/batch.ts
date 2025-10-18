import type { NextApiRequest, NextApiResponse } from 'next';

const STOCK_SERVICE_URL = process.env.STOCK_SERVICE_URL || 'http://localhost:5003';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbols } = req.body;

  if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({ error: 'Symbols array is required' });
  }

  try {
    const response = await fetch(`${STOCK_SERVICE_URL}/stocks/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbols }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Batch stocks error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch batch stock data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
