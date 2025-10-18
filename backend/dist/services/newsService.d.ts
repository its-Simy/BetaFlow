export interface NewsArticle {
    title: string;
    description: string;
    url: string;
    urlToImage?: string;
    source: {
        name: string;
    };
    publishedAt: string;
}
export interface NewsSearchParams {
    query?: string;
    pageSize?: number;
    country?: string;
    category?: string;
    from?: string;
    to?: string;
}
export declare class NewsService {
    private readonly newsApiKey;
    private readonly worldNewsApiKey;
    private readonly newsApiBaseUrl;
    private readonly worldNewsApiBaseUrl;
    constructor();
    /**
     * Search for news articles with optional filters
     */
    searchNews(params: NewsSearchParams): Promise<NewsArticle[]>;
    /**
     * Search using News API
     */
    private searchWithNewsAPI;
    /**
     * Search using World News API
     */
    private searchWithWorldNewsAPI;
    /**
     * Get top headlines for a specific category
     */
    getTopHeadlines(params: {
        category?: string;
        country?: string;
        pageSize?: number;
    }): Promise<NewsArticle[]>;
    /**
     * Search for news about a specific stock symbol
     */
    searchStockNews(symbol: string, lookbackDays?: number): Promise<NewsArticle[]>;
    /**
     * Normalize articles to ensure consistent structure
     */
    private normalizeArticles;
    /**
     * Normalize World News API articles to our format
     */
    private normalizeWorldNewsArticles;
    /**
     * Remove duplicate articles based on URL
     */
    private deduplicateArticles;
    /**
     * Get mock news data when API key is not available
     */
    private getMockNews;
    /**
     * Get company name from ticker symbol
     */
    private getCompanyNameFromTicker;
}
//# sourceMappingURL=newsService.d.ts.map