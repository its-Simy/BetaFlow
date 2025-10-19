import express, { Request, Response } from 'express';

const router = express.Router();

const THE_NEWS_API_KEY = process.env.THE_NEWS_API_KEY;
const TWELVE_API_KEY = process.env.TWELVE_API_KEY;

interface NewsItem {
  title?: string;
  headline?: string;
}

const safeFetch = async (url: string, timeout = 5000): Promise<any | null> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.error(`⚠️ Fetch failed for ${url}:`, err.message);
    return null;
  }
};

const extractHeadlines = (items: NewsItem[] = [], key: 'title' | 'headline') =>
  items
    .map(item => item[key] || '')
    .filter((text, i, arr) => text.length > 40 && arr.indexOf(text) === i)
    .slice(0, 5); // ⬅️ Increased to 5

router.get('/', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const fetchedAt = new Date().toISOString();
  let insights: string[] = [];
  let recommendation = '';
  let source = '';

  try {
    console.log(`🔍 [${fetchedAt}] Fetching from TheNewsAPI...`);
    const newsApiUrl = `https://api.thenewsapi.com/v1/news/top?api_token=${THE_NEWS_API_KEY}&language=en&category=business&limit=20`;
    const newsApiData = await safeFetch(newsApiUrl);

    console.log(`📰 Retrieved ${newsApiData?.data?.length || 0} articles from TheNewsAPI`);

    if (newsApiData?.data?.length > 0) {
      insights = extractHeadlines(newsApiData.data, 'title');
      recommendation = insights.some(i => i.toLowerCase().includes('inflation') || i.toLowerCase().includes('volatility'))
        ? 'Consider rebalancing towards defensive sectors. Market volatility expected to increase next week.'
        : 'Diversify across stable sectors. No major volatility signals detected.';
      source = 'TheNewsAPI';
    }

    if (insights.length < 4) {
      console.log(`🔍 [${fetchedAt}] Falling back to TwelveData...`);
      const twelveData = await safeFetch(`https://api.twelvedata.com/stocks?apikey=${TWELVE_API_KEY}`);
      if (twelveData?.data?.length > 0) {
        insights = extractHeadlines(twelveData.data, 'title');
        recommendation = 'TwelveData insights successfully fetched.';
        source = 'TwelveData';
      }
    }

    if (insights.length < 4) {
      console.log(`🧠 [${fetchedAt}] Using dummy dataset...`);
      insights = [
        "Tech stocks rally as AI sector drives growth in Q4 earnings.",
        "Energy markets stabilize amid global production adjustments.",
        "Investors eye interest rate cuts as inflation shows cooling signs.",
        "Crypto market gains momentum following new ETF approvals.",
        "Retail sector rebounds as consumer confidence improves."
      ];
      recommendation = "Dummy data used. Live sources unavailable.";
      source = 'Demo';
    }

    console.log(`✅ [${fetchedAt}] Responding with ${source} data`);
    res.json({ insights, recommendation, source, fetchedAt });
  } catch (err) {
    console.error(`❌ [${fetchedAt}] AI Insights route failed:`, err);
    res.status(500).json({
      insights: [],
      recommendation: 'Error fetching insights. Please try again later.',
      source: 'Error',
      fetchedAt
    });
  }
});

export default router;