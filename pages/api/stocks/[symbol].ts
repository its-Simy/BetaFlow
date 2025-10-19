import { NextApiRequest, NextApiResponse } from 'next';
import { getStockData } from '../../../lib/services/multiSourceStockService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Stock symbol is required' });
  }

  try {
    console.log(`📊 Multi-source data fetch for: ${symbol}`);
    
    // Use the new multi-source stock data service
    const data = await getStockData(symbol);
    
    console.log(`✅ Multi-source data returned for ${symbol} from ${data.source}`);
    
    res.status(200).json({
      symbol: data.symbol,
      current: data.current,
      historical: data.historical,
      timestamp: data.timestamp,
      source: data.source // Include source for debugging
    });

  } catch (error) {
    console.error('❌ Multi-source stock data error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stock data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
