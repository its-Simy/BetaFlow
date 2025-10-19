import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/insights', async (req, res) => {
  const now = new Date().toISOString();

  try {
    const response = await axios.get('https://api.thenewsapi.com/v1/news/all', {
      params: {
        api_token: process.env.THE_NEWS_API_KEY,
        categories: 'business',
        search: 'stock,crypto,money,trade',
        language: 'en',
        sort: 'published_at',
        limit: 5,
      },
    });

    if (Array.isArray(response.data.data)) {
      const insights = response.data.data.map((article: any) => ({
        title: article.title,
        content: article.description || article.snippet || 'No summary available.',
        source: article.source || 'TheNewsAPI',
        lastUpdated: article.published_at || now,
      }));
      return res.json(insights);
    }

    throw new Error('Unexpected response format from TheNewsAPI');
  } catch (error) {
    console.error('Error fetching AI insights:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

export default router;