export declare class CacheService {
    private cache;
    private readonly defaultTTL;
    constructor(defaultTTLMinutes?: number);
    /**
     * Get cached data by key
     */
    get<T>(key: string): T | null;
    /**
     * Set cached data with TTL
     */
    set<T>(key: string, data: T, ttlMinutes?: number): void;
    /**
     * Check if cache entry is expired
     */
    private isExpired;
    /**
     * Delete specific cache entry
     */
    delete(key: string): boolean;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        keys: string[];
        hitRate?: number;
    };
    /**
     * Clean up expired entries
     */
    cleanup(): number;
    /**
     * Generate cache key for stock insights
     */
    generateStockInsightKey(symbol: string, params?: {
        lookbackDays?: number;
        maxArticles?: number;
    }): string;
    /**
     * Generate cache key for query analysis
     */
    generateQueryKey(query: string, params?: {
        lookbackDays?: number;
        maxArticles?: number;
    }): string;
    /**
     * Simple hash function for cache keys
     */
    private hashString;
    /**
     * Check if cache has key (without retrieving)
     */
    has(key: string): boolean;
    /**
     * Get remaining TTL for a key
     */
    getTTL(key: string): number;
}
//# sourceMappingURL=cacheService.d.ts.map