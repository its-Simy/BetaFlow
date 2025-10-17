import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query;
  const apiKey = process.env.POLYGON_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Stock symbol is required' });
  }

  try {
    // Get real-time stock data
    const sanitizedKey = encodeURIComponent(apiKey.trim());
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/prev?adjusted=true&apiKey=${sanitizedKey}`
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Polygon API error: ${response.status} ${text}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Polygon API error: ${data.message || 'Unknown error'}`);
    }

    // Get historical data for charts (last 30 days)
    const historicalResponse = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/range/1/day/${getDate30DaysAgo()}/${getToday()}?adjusted=true&sort=asc&apiKey=${sanitizedKey}`
    );

    let historicalData = [];
    if (historicalResponse.ok) {
      const historical = await historicalResponse.json();
      historicalData = historical.results || [];
    }

    res.status(200).json({
      symbol: symbol.toUpperCase(),
      current: data.results?.[0] || null,
      historical: historicalData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stock data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getDate30DaysAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}
