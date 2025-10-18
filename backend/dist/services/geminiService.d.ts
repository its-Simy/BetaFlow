export interface StockInsight {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    keyPoints: string[];
    riskLevel: 'Low' | 'Medium' | 'High';
    confidence: number;
}
export interface GeminiResponse {
    symbol?: string;
    generatedAt: string;
    insight: StockInsight;
    reasoning?: string;
}
export declare class GeminiService {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly model;
    constructor();
    /**
     * Analyze stock based on news articles
     */
    analyzeStock(symbol: string, newsContext: string): Promise<GeminiResponse>;
    /**
     * Analyze free-text query
     */
    analyzeQuery(query: string, newsContext?: string): Promise<GeminiResponse>;
    /**
     * Build prompt for stock analysis
     */
    private buildStockAnalysisPrompt;
    /**
     * Build prompt for free-text query analysis
     */
    private buildQueryAnalysisPrompt;
    /**
     * Call Gemini API
     */
    private callGeminiAPI;
    /**
     * Parse Gemini response and validate JSON
     */
    private parseGeminiResponse;
    /**
     * Attempt to fix truncated JSON responses
     */
    private fixTruncatedJson;
    /**
     * More aggressive JSON fixing for severely truncated responses
     */
    private aggressiveJsonFix;
    /**
     * Generate generic key points based on sentiment
     */
    private generateGenericKeyPoints;
    /**
     * Get mock response for stock analysis (when API key is not available)
     */
    private getMockStockResponse;
    /**
     * Get mock response for query analysis (when API key is not available)
     */
    private getMockQueryResponse;
}
//# sourceMappingURL=geminiService.d.ts.map