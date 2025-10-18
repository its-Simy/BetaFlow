"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelevanceService = void 0;
class RelevanceService {
    constructor() {
        this.stockAliases = {
            'AAPL': {
                symbol: 'AAPL',
                aliases: ['Apple', 'Apple Inc.', 'Apple Computer', 'iPhone', 'iPad', 'MacBook'],
                companyName: 'Apple Inc.'
            },
            'NVDA': {
                symbol: 'NVDA',
                aliases: ['NVIDIA', 'Nvidia', 'GeForce', 'RTX', 'AI chips', 'GPU'],
                companyName: 'NVIDIA Corporation'
            },
            'TSLA': {
                symbol: 'TSLA',
                aliases: ['Tesla', 'Tesla Inc.', 'Elon Musk', 'Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'],
                companyName: 'Tesla Inc.'
            },
            'MSFT': {
                symbol: 'MSFT',
                aliases: ['Microsoft', 'Microsoft Corp', 'Windows', 'Office', 'Azure', 'Xbox'],
                companyName: 'Microsoft Corporation'
            },
            'GOOGL': {
                symbol: 'GOOGL',
                aliases: ['Google', 'Alphabet', 'Google Inc.', 'YouTube', 'Android', 'Chrome'],
                companyName: 'Alphabet Inc.'
            },
            'AMZN': {
                symbol: 'AMZN',
                aliases: ['Amazon', 'Amazon.com', 'AWS', 'Prime', 'Alexa', 'Echo'],
                companyName: 'Amazon.com Inc.'
            },
            'META': {
                symbol: 'META',
                aliases: ['Meta', 'Facebook', 'Instagram', 'WhatsApp', 'Oculus', 'VR'],
                companyName: 'Meta Platforms Inc.'
            },
            'AMD': {
                symbol: 'AMD',
                aliases: ['AMD', 'Advanced Micro Devices', 'Ryzen', 'Radeon', 'EPYC'],
                companyName: 'Advanced Micro Devices Inc.'
            },
            'HOOD': {
                symbol: 'HOOD',
                aliases: ['Robinhood', 'Robinhood Markets', 'Robinhood Trading', 'commission-free trading'],
                companyName: 'Robinhood Markets Inc.'
            },
            'S': {
                symbol: 'S',
                aliases: ['SentinelOne', 'Sentinel One', 'cybersecurity', 'endpoint security'],
                companyName: 'SentinelOne Inc.'
            },
            'BMNR': {
                symbol: 'BMNR',
                aliases: ['Banner', 'Banner Corporation', 'regional bank', 'community bank'],
                companyName: 'Banner Corporation'
            }
        };
    }
    /**
     * Score articles for relevance to a specific stock symbol
     */
    scoreArticlesForSymbol(articles, symbol) {
        let stockInfo = this.stockAliases[symbol.toUpperCase()];
        if (!stockInfo) {
            console.warn(`No aliases found for symbol: ${symbol}`);
            // Create a generic entry for unknown symbols
            stockInfo = {
                symbol: symbol.toUpperCase(),
                aliases: [symbol.toUpperCase(), symbol.toLowerCase()],
                companyName: `${symbol} Corporation`
            };
        }
        return articles.map(article => {
            const score = this.calculateRelevanceScore(article, stockInfo);
            return {
                article,
                score: score.total,
                reasons: score.reasons
            };
        }).sort((a, b) => b.score - a.score);
    }
    /**
     * Get top N most relevant articles for a symbol
     */
    getTopRelevantArticles(articles, symbol, maxArticles = 5) {
        const scoredArticles = this.scoreArticlesForSymbol(articles, symbol);
        return scoredArticles
            .filter(item => item.score > 0.1) // Only articles with some relevance
            .slice(0, maxArticles)
            .map(item => item.article);
    }
    /**
     * Calculate relevance score for a single article
     */
    calculateRelevanceScore(article, stockInfo) {
        const reasons = [];
        let score = 0;
        const text = `${article.title} ${article.description}`.toLowerCase();
        const symbol = stockInfo.symbol.toLowerCase();
        // Symbol mention in title (highest weight)
        if (article.title.toLowerCase().includes(symbol)) {
            score += 3;
            reasons.push('Symbol in title');
        }
        // Symbol mention in description
        if (article.description.toLowerCase().includes(symbol)) {
            score += 2;
            reasons.push('Symbol in description');
        }
        // Company name mentions
        for (const alias of stockInfo.aliases) {
            const aliasLower = alias.toLowerCase();
            if (text.includes(aliasLower)) {
                score += 1.5;
                reasons.push(`Company name: ${alias}`);
            }
        }
        // Financial keywords
        const financialKeywords = [
            'earnings', 'revenue', 'profit', 'loss', 'stock', 'shares', 'dividend',
            'analyst', 'upgrade', 'downgrade', 'target', 'price', 'valuation',
            'quarterly', 'annual', 'guidance', 'forecast', 'outlook'
        ];
        for (const keyword of financialKeywords) {
            if (text.includes(keyword)) {
                score += 0.5;
                reasons.push(`Financial keyword: ${keyword}`);
            }
        }
        // Recency bonus
        const publishedDate = new Date(article.publishedAt);
        const daysOld = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld <= 1) {
            score += 1;
            reasons.push('Very recent');
        }
        else if (daysOld <= 3) {
            score += 0.5;
            reasons.push('Recent');
        }
        else if (daysOld <= 7) {
            score += 0.2;
            reasons.push('Within week');
        }
        // Source credibility
        const credibleSources = [
            'bloomberg', 'reuters', 'cnbc', 'wsj', 'financial times', 'yahoo finance',
            'marketwatch', 'seeking alpha', 'benzinga', 'fool.com'
        ];
        const sourceName = article.source.name.toLowerCase();
        for (const credibleSource of credibleSources) {
            if (sourceName.includes(credibleSource)) {
                score += 0.3;
                reasons.push(`Credible source: ${article.source.name}`);
                break;
            }
        }
        return {
            total: Math.min(score, 10), // Cap at 10
            reasons: reasons.slice(0, 5) // Limit reasons
        };
    }
    /**
     * Extract stock symbols from free text query
     */
    extractSymbolsFromQuery(query) {
        const symbols = [];
        const upperQuery = query.toUpperCase();
        // Look for known symbols
        for (const symbol of Object.keys(this.stockAliases)) {
            if (upperQuery.includes(symbol)) {
                symbols.push(symbol);
            }
        }
        // Look for common patterns like "AAPL stock", "Apple (AAPL)", etc.
        const symbolPattern = /\b([A-Z]{1,5})\b/g;
        const matches = query.match(symbolPattern);
        if (matches) {
            symbols.push(...matches.filter(match => match.length >= 2 && match.length <= 5));
        }
        return Array.from(new Set(symbols)); // Remove duplicates
    }
    /**
     * Get stock info by symbol
     */
    getStockInfo(symbol) {
        return this.stockAliases[symbol.toUpperCase()] || null;
    }
}
exports.RelevanceService = RelevanceService;
//# sourceMappingURL=relevanceService.js.map