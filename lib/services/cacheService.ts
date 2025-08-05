'use client';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  maxSize?: number; // Maximum number of items in cache
  prefix?: string; // Cache key prefix
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 1000;
  private prefix = 'moai_cache_';

  constructor(options?: CacheOptions) {
    if (options?.ttl) this.defaultTTL = options.ttl;
    if (options?.maxSize) this.maxSize = options.maxSize;
    if (options?.prefix) this.prefix = options.prefix;

    // Clean up expired items every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private generateKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.expiry;
  }

  private evictOldest(): void {
    if (this.cache.size < this.maxSize) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Set item in cache
  set<T>(key: string, data: T, ttl?: number): void {
    const cacheKey = this.generateKey(key);
    const expiry = Date.now() + (ttl || this.defaultTTL);
    
    this.evictOldest();
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  // Get item from cache
  get<T>(key: string): T | null {
    const cacheKey = this.generateKey(key);
    const item = this.cache.get(cacheKey);

    if (!item || this.isExpired(item)) {
      if (item) this.cache.delete(cacheKey);
      return null;
    }

    return item.data;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const cacheKey = this.generateKey(key);
    const item = this.cache.get(cacheKey);
    
    if (!item || this.isExpired(item)) {
      if (item) this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  // Delete specific key
  delete(key: string): boolean {
    const cacheKey = this.generateKey(key);
    return this.cache.delete(cacheKey);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Clean up expired items
  cleanup(): void {
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: string;
  } {
    const size = this.cache.size;
    return {
      size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses to calculate
      memoryUsage: `${Math.round(size * 0.1)}KB` // Rough estimate
    };
  }

  // Wrap async function with caching
  cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        // Check cache first
        const cached = this.get<T>(key);
        if (cached !== null) {
          resolve(cached);
          return;
        }

        // Execute function and cache result
        const result = await fn();
        this.set(key, result, ttl);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Invalidate cache entries by pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Get all keys (for debugging)
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Create different cache instances for different data types
export const dishCache = new CacheService({
  ttl: 10 * 60 * 1000, // 10 minutes for dishes
  maxSize: 500,
  prefix: 'dish_'
});

export const cookCache = new CacheService({
  ttl: 15 * 60 * 1000, // 15 minutes for cooks
  maxSize: 200,
  prefix: 'cook_'
});

export const orderCache = new CacheService({
  ttl: 2 * 60 * 1000, // 2 minutes for orders (more dynamic)
  maxSize: 300,
  prefix: 'order_'
});

export const userCache = new CacheService({
  ttl: 30 * 60 * 1000, // 30 minutes for user data
  maxSize: 100,
  prefix: 'user_'
});

export const searchCache = new CacheService({
  ttl: 5 * 60 * 1000, // 5 minutes for search results
  maxSize: 200,
  prefix: 'search_'
});

export const locationCache = new CacheService({
  ttl: 60 * 60 * 1000, // 1 hour for location data
  maxSize: 100,
  prefix: 'location_'
});

// Default cache instance
export const cache = new CacheService();

// Cache utility functions
export const cacheUtils = {
  // Clear all caches
  clearAll(): void {
    dishCache.clear();
    cookCache.clear();
    orderCache.clear();
    userCache.clear();
    searchCache.clear();
    locationCache.clear();
    cache.clear();
  },

  // Get overall cache statistics
  getAllStats(): Record<string, any> {
    return {
      dishes: dishCache.getStats(),
      cooks: cookCache.getStats(),
      orders: orderCache.getStats(),
      users: userCache.getStats(),
      searches: searchCache.getStats(),
      locations: locationCache.getStats(),
      default: cache.getStats()
    };
  },

  // Invalidate related caches when data changes
  invalidateRelated: {
    dish(dishId: string, cookId: string): void {
      dishCache.delete(dishId);
      dishCache.invalidatePattern(`cook_${cookId}_.*`);
      searchCache.clear(); // Clear search cache as results may change
    },

    cook(cookId: string): void {
      cookCache.delete(cookId);
      dishCache.invalidatePattern(`cook_${cookId}_.*`);
      searchCache.clear();
    },

    order(orderId: string, customerId: string, cookId: string): void {
      orderCache.delete(orderId);
      orderCache.invalidatePattern(`customer_${customerId}_.*`);
      orderCache.invalidatePattern(`cook_${cookId}_.*`);
    },

    user(userId: string): void {
      userCache.delete(userId);
    }
  }
};

// React hooks for caching
import { useState, useEffect, useCallback } from 'react';

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    cacheInstance?: CacheService;
    dependencies?: any[];
  }
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const cacheInstance = options?.cacheInstance || cache;
  const ttl = options?.ttl;
  const dependencies = options?.dependencies || [];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await cacheInstance.cached(key, fetcher, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, cacheInstance, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    cacheInstance.delete(key);
    await fetchData();
  }, [key, fetchData, cacheInstance]);

  return { data, loading, error, refetch };
}

export default CacheService;