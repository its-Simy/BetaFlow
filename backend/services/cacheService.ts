interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL: number;

  constructor(defaultTTLMinutes: number = 20) {
    this.defaultTTL = defaultTTLMinutes * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Get cached data by key
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with TTL
   */
  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTTL;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      cleaned++;
    });
    
    return cleaned;
  }

  /**
   * Generate cache key for stock insights
   */
  generateStockInsightKey(symbol: string, params?: {
    lookbackDays?: number;
    maxArticles?: number;
  }): string {
    const paramHash = params ? 
      JSON.stringify(params) : 
      JSON.stringify({ lookbackDays: 7, maxArticles: 5 });
    
    return `insight:${symbol.toUpperCase()}:${this.hashString(paramHash)}`;
  }

  /**
   * Generate cache key for query analysis
   */
  generateQueryKey(query: string, params?: {
    lookbackDays?: number;
    maxArticles?: number;
  }): string {
    const paramHash = params ? 
      JSON.stringify(params) : 
      JSON.stringify({ lookbackDays: 7, maxArticles: 5 });
    
    return `query:${this.hashString(query)}:${this.hashString(paramHash)}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if cache has key (without retrieving)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get remaining TTL for a key
   */
  getTTL(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) {
      return 0;
    }
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return 0;
    }
    
    return entry.ttl - (Date.now() - entry.timestamp);
  }
}
