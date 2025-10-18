"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const newsService_1 = require("../services/newsService");
const relevanceService_1 = require("../services/relevanceService");
const contextCompressor_1 = require("../services/contextCompressor");
const geminiService_1 = require("../services/geminiService");
const cacheService_1 = require("../services/cacheService");
const router = express_1.default.Router();
// Initialize services
const newsService = new newsService_1.NewsService();
const relevanceService = new relevanceService_1.RelevanceService();
const contextCompressor = new contextCompressor_1.ContextCompressor();
const geminiService = new geminiService_1.GeminiService();
const cacheService = new cacheService_1.CacheService();
/**
 * GET /api/insights/stock/:symbol
 * Analyze a specific stock symbol
 */
router.get('/stock/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { lookbackDays = 7, maxArticles = 5, forceRefresh = false } = req.query;
        // Generate cache key
        const cacheKey = cacheService.generateStockInsightKey(symbol, {
            lookbackDays: Number(lookbackDays),
            maxArticles: Number(maxArticles)
        });
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = cacheService.get(cacheKey);
            if (cached) {
                console.log(`Cache hit for ${symbol}`);
                return res.json({
                    ...cached,
                    cached: true,
                    cacheKey
                });
            }
        }
        console.log(`Cache miss for ${symbol}, fetching fresh data`);
        // Fetch news for the stock
        console.log('Fetching news for symbol:', symbol);
        const articles = await newsService.searchStockNews(symbol, Number(lookbackDays));
        console.log('Found articles:', articles.length);
        if (articles.length === 0) {
            return res.status(404).json({
                error: 'No recent news found',
                symbol,
                message: 'No recent news articles found for this stock symbol'
            });
        }
        // Score and filter relevant articles
        const relevantArticles = relevanceService.getTopRelevantArticles(articles, symbol, Number(maxArticles));
        if (relevantArticles.length === 0) {
            return res.status(404).json({
                error: 'No relevant news found',
                symbol,
                message: 'No relevant news articles found for this stock symbol'
            });
        }
        // Compress articles for Gemini
        const { compressed, totalLength, truncated } = contextCompressor.compressArticles(relevantArticles);
        const newsContext = contextCompressor.formatForPrompt(compressed);
        console.log(`Analyzing ${symbol} with ${compressed.length} articles (${totalLength} chars)`);
        // Analyze with Gemini
        console.log('Calling Gemini service for analysis...');
        const analysis = await geminiService.analyzeStock(symbol, newsContext);
        console.log('Gemini analysis completed');
        // Prepare response
        const response = {
            symbol: symbol.toUpperCase(),
            generatedAt: analysis.generatedAt,
            insight: analysis.insight,
            sources: compressed.map(article => ({
                title: article.title,
                url: article.url,
                publishedAt: article.date,
                source: article.source
            })),
            metadata: {
                articlesAnalyzed: compressed.length,
                totalArticlesFound: articles.length,
                contextLength: totalLength,
                truncated,
                compressionSummary: contextCompressor.getCompressionSummary(articles.length, compressed.length, totalLength)
            },
            cached: false,
            cacheKey
        };
        // Cache the result
        cacheService.set(cacheKey, response, 20); // 20 minutes TTL
        res.json(response);
    }
    catch (error) {
        console.error('Stock analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
/**
 * POST /api/insights/analyze
 * Analyze free-text query
 */
router.post('/analyze', async (req, res) => {
    try {
        const { query } = req.body;
        const { lookbackDays = 7, maxArticles = 5, forceRefresh = false } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                error: 'Invalid query',
                message: 'Query is required and must be a string'
            });
        }
        // Generate cache key
        const cacheKey = cacheService.generateQueryKey(query, {
            lookbackDays: Number(lookbackDays),
            maxArticles: Number(maxArticles)
        });
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = cacheService.get(cacheKey);
            if (cached) {
                console.log(`Cache hit for query: ${query.substring(0, 50)}...`);
                return res.json({
                    ...cached,
                    cached: true,
                    cacheKey
                });
            }
        }
        console.log(`Cache miss for query: ${query.substring(0, 50)}...`);
        // Extract stock symbols from query
        const symbols = relevanceService.extractSymbolsFromQuery(query);
        let newsContext = '';
        let allArticles = [];
        // If symbols found, fetch relevant news
        if (symbols.length > 0) {
            for (const symbol of symbols.slice(0, 2)) { // Limit to 2 symbols
                try {
                    const articles = await newsService.searchStockNews(symbol, Number(lookbackDays));
                    const relevantArticles = relevanceService.getTopRelevantArticles(articles, symbol, Math.ceil(Number(maxArticles) / symbols.length));
                    allArticles.push(...relevantArticles);
                }
                catch (error) {
                    console.warn(`Failed to fetch news for ${symbol}:`, error);
                }
            }
            if (allArticles.length > 0) {
                const { compressed, totalLength } = contextCompressor.compressArticles(allArticles);
                newsContext = contextCompressor.formatForPrompt(compressed);
                console.log(`Using ${compressed.length} articles for query analysis (${totalLength} chars)`);
            }
        }
        // Analyze with Gemini
        const analysis = await geminiService.analyzeQuery(query, newsContext);
        // Prepare response
        const response = {
            query,
            generatedAt: analysis.generatedAt,
            insight: analysis.insight,
            symbols: symbols.length > 0 ? symbols : undefined,
            sources: allArticles.length > 0 ? allArticles.slice(0, 5).map((article) => ({
                title: article.title,
                url: article.url,
                publishedAt: article.publishedAt,
                source: article.source.name
            })) : undefined,
            metadata: {
                symbolsFound: symbols.length,
                newsContextUsed: !!newsContext,
                contextLength: newsContext.length,
                articlesAnalyzed: allArticles.length
            },
            cached: false,
            cacheKey
        };
        // Cache the result
        cacheService.set(cacheKey, response, 15); // 15 minutes TTL for queries
        res.json(response);
    }
    catch (error) {
        console.error('Query analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
/**
 * GET /api/insights/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', (req, res) => {
    const stats = cacheService.getStats();
    res.json({
        cache: stats,
        timestamp: new Date().toISOString()
    });
});
/**
 * DELETE /api/insights/cache
 * Clear cache
 */
router.delete('/cache', (req, res) => {
    cacheService.clear();
    res.json({
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString()
    });
});
/**
 * GET /api/insights/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        services: {
            news: 'available',
            gemini: 'available',
            cache: 'available'
        },
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=insights.js.map