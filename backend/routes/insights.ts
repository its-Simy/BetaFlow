import express, { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { NewsService } from '../services/newsService';
import { RelevanceService } from '../services/relevanceService';
import { ContextCompressor } from '../services/contextCompressor';

const router = express.Router();
const geminiService = new GeminiService();
const newsService = new NewsService();
const relevanceService = new RelevanceService();
const contextCompressor = new ContextCompressor();

/**
 * Analyze a specific stock symbol
 */
router.get('/stock/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { lookbackDays = '7' } = req.query;

    console.log(`Analyzing stock: ${symbol}`);

    // Fetch relevant news
    const newsArticles = await newsService.searchStockNews(symbol, parseInt(lookbackDays as string));
    console.log(`Found ${newsArticles.length} news articles for ${symbol}`);

    // Filter for relevance
    const relevantArticles = relevanceService.getTopRelevantArticles(newsArticles, symbol, 10);
    console.log(`Filtered to ${relevantArticles.length} relevant articles`);

    // Compress context
    const compressedContext = contextCompressor.compressNewsContext(relevantArticles, symbol);
    console.log(`Compressed context: ${compressedContext.tokenCount} tokens`);

    // Get AI analysis
    const analysis = await geminiService.analyzeStock(symbol, compressedContext.summary);

    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      analysis,
      context: {
        articlesAnalyzed: compressedContext.articleCount,
        totalArticlesFound: newsArticles.length,
        tokenCount: compressedContext.tokenCount
      },
      recentNews: relevantArticles.slice(0, 5).map(article => ({
        title: article.title,
        source: article.source.name,
        publishedAt: article.publishedAt,
        url: article.url
      }))
    });

  } catch (error) {
    console.error('Stock analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze stock',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Analyze a free-text query
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string'
      });
    }

    console.log(`Analyzing query: "${query}"`);

    // Extract potential stock symbols from the query
    const symbols = relevanceService.extractSymbolsFromQuery(query);
    console.log(`Extracted symbols: ${symbols.join(', ')}`);

    let newsContext = '';
    let relevantNews: any[] = [];

    // If we found symbols, get news for them
    if (symbols.length > 0) {
      const allArticles: any[] = [];
      
      for (const symbol of symbols.slice(0, 3)) { // Limit to 3 symbols
        try {
          const articles = await newsService.searchStockNews(symbol, 7);
          allArticles.push(...articles);
        } catch (error) {
          console.warn(`Failed to get news for ${symbol}:`, error);
        }
      }

      // Filter for relevance to the query
      const relevantArticles = allArticles.filter(article => {
        const text = `${article.title} ${article.description}`.toLowerCase();
        return symbols.some(symbol => text.includes(symbol.toLowerCase()));
      });

      // Compress the context
      const compressedContext = contextCompressor.compressQueryContext(query, relevantArticles);
      newsContext = compressedContext.summary;
      relevantNews = relevantArticles.slice(0, 5);
    } else {
      // General market news
      try {
        const generalNews = await newsService.getTopHeadlines({ 
          category: 'business', 
          pageSize: 10 
        });
        const compressedContext = contextCompressor.compressQueryContext(query, generalNews);
        newsContext = compressedContext.summary;
        relevantNews = generalNews.slice(0, 5);
      } catch (error) {
        console.warn('Failed to get general news:', error);
        newsContext = `Query: "${query}"\n\nNo recent news context available.`;
      }
    }

    // Get AI analysis
    const analysis = await geminiService.analyzeQuery(query, newsContext);

    res.json({
      success: true,
      query,
      analysis,
      context: {
        symbolsExtracted: symbols,
        articlesAnalyzed: relevantNews.length,
        tokenCount: contextCompressor.estimateTokens(newsContext)
      },
      recentNews: relevantNews.map(article => ({
        title: article.title,
        source: article.source.name,
        publishedAt: article.publishedAt,
        url: article.url
      }))
    });

  } catch (error) {
    console.error('Query analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze query',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test Gemini service
    const geminiHealthy = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
    
    // Test news services
    const newsApiHealthy = !!process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'your_news_api_key_here';
    const worldNewsApiHealthy = !!process.env.WORLD_NEWS_API_KEY && process.env.WORLD_NEWS_API_KEY !== 'your_world_news_api_key_here';

    res.json({
      success: true,
      services: {
        gemini: {
          healthy: geminiHealthy,
          configured: !!process.env.GEMINI_API_KEY
        },
        newsApi: {
          healthy: newsApiHealthy,
          configured: !!process.env.NEWS_API_KEY
        },
        worldNewsApi: {
          healthy: worldNewsApiHealthy,
          configured: !!process.env.WORLD_NEWS_API_KEY
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Cache statistics (placeholder for future implementation)
 */
router.get('/cache/stats', async (req: Request, res: Response) => {
  res.json({
    success: true,
    cache: {
      enabled: false,
      hits: 0,
      misses: 0,
      size: 0
    },
    message: 'Caching not implemented yet'
  });
});

/**
 * Clear cache (placeholder for future implementation)
 */
router.delete('/cache', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Cache cleared (no cache implemented yet)'
  });
});

export default router;
