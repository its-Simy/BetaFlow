import { NewsArticle } from './newsService';
export interface StockAlias {
    symbol: string;
    aliases: string[];
    companyName: string;
}
export interface RelevanceScore {
    article: NewsArticle;
    score: number;
    reasons: string[];
}
export declare class RelevanceService {
    private readonly stockAliases;
    /**
     * Score articles for relevance to a specific stock symbol
     */
    scoreArticlesForSymbol(articles: NewsArticle[], symbol: string): RelevanceScore[];
    /**
     * Get top N most relevant articles for a symbol
     */
    getTopRelevantArticles(articles: NewsArticle[], symbol: string, maxArticles?: number): NewsArticle[];
    /**
     * Calculate relevance score for a single article
     */
    private calculateRelevanceScore;
    /**
     * Extract stock symbols from free text query
     */
    extractSymbolsFromQuery(query: string): string[];
    /**
     * Get stock info by symbol
     */
    getStockInfo(symbol: string): StockAlias | null;
}
//# sourceMappingURL=relevanceService.d.ts.map