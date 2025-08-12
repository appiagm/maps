interface CachedPlace {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  timestamp: number;
}

interface PlacesCache {
  [query: string]: CachedPlace[];
}

class PlacesCacheService {
  private cache: PlacesCache = {};
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached queries

  /**
   * Get cached results for a query
   */
  get(query: string): CachedPlace[] | null {
    const cached = this.cache[query.toLowerCase()];
    if (!cached) return null;

    // Check if cache is still valid
    const now = Date.now();
    const validResults = cached.filter(item => (now - item.timestamp) < this.TTL);

    if (validResults.length === 0) {
      // Remove expired cache entry
      delete this.cache[query.toLowerCase()];
      return null;
    }

    // Update cache with only valid results
    this.cache[query.toLowerCase()] = validResults;
    return validResults;
  }

  /**
   * Store results in cache
   */
  set(query: string, results: CachedPlace[]): void {
    const now = Date.now();
    const cachedResults = results.map(result => ({
      ...result,
      timestamp: now
    }));

    this.cache[query.toLowerCase()] = cachedResults;

    // Clean up old entries if cache is too large
    this.cleanup();
  }

  /**
   * Check if a query is cached and valid
   */
  has(query: string): boolean {
    const cached = this.get(query);
    return cached !== null && cached.length > 0;
  }

  /**
   * Clear expired entries and limit cache size
   */
  private cleanup(): void {
    const now = Date.now();
    const queries = Object.keys(this.cache);
    
    if (queries.length <= this.MAX_CACHE_SIZE) return;

    // Sort by timestamp (oldest first) and remove excess
    const sortedQueries = queries.sort((a, b) => {
      const aTimestamp = this.cache[a][0]?.timestamp || 0;
      const bTimestamp = this.cache[b][0]?.timestamp || 0;
      return aTimestamp - bTimestamp;
    });

    // Remove oldest entries
    const toRemove = sortedQueries.slice(0, queries.length - this.MAX_CACHE_SIZE);
    toRemove.forEach(query => delete this.cache[query]);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache = {};
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; queries: string[] } {
    return {
      size: Object.keys(this.cache).length,
      queries: Object.keys(this.cache)
    };
  }
}

export const placesCache = new PlacesCacheService(); 