import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/trending', async (req, res) => {
  const now = new Date().toISOString();

  try {
    const response = await axios.get('https://api.twelvedata.com/stocks', {
      params: {
        apikey: process.env.TWELVE_DATA_API_KEY,
        source: 'trending',
        format: 'JSON',
      },
    });

    if (Array.isArray(response.data.data)) {
      const trending = response.data.data.map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.name,
        price: parseFloat(stock.price),
        change: parseFloat(stock.percent_change),
        source: 'Twelve Data',
        lastUpdated: now,
      }));

      return res.json(trending.slice(0, 5));
    }

    throw new Error('Unexpected response format from Twelve Data');
  } catch (error) {
    console.error('❌ Twelve Data error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to fetch trending stocks from Twelve Data' });
  }
});

export default router;