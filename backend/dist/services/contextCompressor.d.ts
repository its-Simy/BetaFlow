import { NewsArticle } from './newsService';
export interface CompressedArticle {
    title: string;
    summary: string;
    source: string;
    date: string;
    url: string;
}
export declare class ContextCompressor {
    private readonly maxContextLength;
    private readonly maxArticles;
    constructor(maxContextLength?: number, maxArticles?: number);
    /**
     * Compress articles into compact format for Gemini
     */
    compressArticles(articles: NewsArticle[]): {
        compressed: CompressedArticle[];
        totalLength: number;
        truncated: boolean;
    };
    /**
     * Compress a single article into compact format
     */
    private compressSingleArticle;
    /**
     * Calculate the character length of a compressed article
     */
    private calculateLength;
    /**
     * Format compressed articles for Gemini prompt
     */
    formatForPrompt(compressed: CompressedArticle[]): string;
    /**
     * Create a summary of the compression process
     */
    getCompressionSummary(originalCount: number, compressedCount: number, totalLength: number): string;
}
//# sourceMappingURL=contextCompressor.d.ts.map