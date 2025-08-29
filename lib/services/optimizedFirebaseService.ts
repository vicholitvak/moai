'use client';

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  Query,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { dishCache, cookCache, searchCache } from './cacheService';
import { FirebasePagination } from '@/lib/utils/pagination';
import type { Dish, Cook } from '@/lib/firebase/dataService';

// Optimized Dishes Service
export class OptimizedDishesService {
  private static readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private static readonly DEFAULT_PAGE_SIZE = 20;

  // Get dishes with caching (simplified - no pagination)
  static async getDishes(options: {
    cookId?: string;
    category?: string;
    isAvailable?: boolean;
    pageSize?: number;
    useCache?: boolean;
  } = {}): Promise<{
    data: Dish[];
    hasMore: boolean;
  }> {
    const {
      cookId,
      category,
      pageSize = this.DEFAULT_PAGE_SIZE,
      useCache = true
    } = options;

    // Generate cache key (remove isAvailable since we're not filtering by it)
    const cacheKey = `dishes_${cookId || 'all'}_${category || 'all'}_${pageSize}`;
    
    // Check cache first
    if (useCache) {
      const cached = dishCache.get<{
        data: Dish[];
        hasMore: boolean;
      }>(cacheKey);
      
      if (cached) {
        return {
          data: cached.data,
          hasMore: cached.hasMore
        };
      }
    }

    try {
      // Use simple query - just get dishes with limit, no complex filters or ordering
      const { getDocs, limit: fbLimit, collection, query } = await import('firebase/firestore');
      
      const simpleQuery = query(collection(db, 'dishes'), fbLimit(pageSize));
      const snapshot = await getDocs(simpleQuery);
      
      const dishes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Dish[];
      
      // Cache the result
      if (useCache) {
        dishCache.set(cacheKey, {
          data: dishes,
          hasMore: snapshot.docs.length === pageSize
        }, this.CACHE_TTL);
      }

      return {
        data: dishes,
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error fetching dishes:', error);
      return {
        data: [],
        hasMore: false
      };
    }
  }

  // Get single dish with caching
  static async getDishById(dishId: string, useCache = true): Promise<Dish | null> {
    const cacheKey = `dish_${dishId}`;
    
    // Check cache first
    if (useCache) {
      const cached = dishCache.get<Dish>(cacheKey);
      if (cached) return cached;
    }

    try {
      const dishDoc = await getDoc(doc(db, 'dishes', dishId));
      
      if (!dishDoc.exists()) return null;
      
      const dish = {
        id: dishDoc.id,
        ...dishDoc.data()
      } as Dish;

      // Cache the result
      if (useCache) {
        dishCache.set(cacheKey, dish, this.CACHE_TTL);
      }

      return dish;
    } catch (error) {
      console.error('Error fetching dish:', error);
      return null;
    }
  }

  // Get popular dishes with caching
  static async getPopularDishes(limit_count = 10, useCache = true): Promise<Dish[]> {
    const cacheKey = `popular_dishes_${limit_count}`;
    
    // Check cache first
    if (useCache) {
      const cached = dishCache.get<Dish[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      const q = query(
        collection(db, 'dishes'),
        where('isAvailable', '==', true),
        orderBy('rating', 'desc'),
        orderBy('reviewCount', 'desc'),
        limit(limit_count)
      );

      const snapshot = await getDocs(q);
      const dishes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Dish[];

      // Cache the result
      if (useCache) {
        dishCache.set(cacheKey, dishes, this.CACHE_TTL);
      }

      return dishes;
    } catch (error) {
      console.error('Error fetching popular dishes:', error);
      return [];
    }
  }

  // Search dishes with caching
  static async searchDishes(
    searchTerm: string,
    options: {
      category?: string;
      maxPrice?: number;
      minRating?: number;
      pageSize?: number;
      useCache?: boolean;
    } = {}
  ): Promise<{
    data: Dish[];
    hasMore: boolean;
    pagination: FirebasePagination<Dish>;
  }> {
    const {
      category,
      maxPrice,
      minRating = 0,
      pageSize = this.DEFAULT_PAGE_SIZE,
      useCache = true
    } = options;

    const cacheKey = `search_${searchTerm}_${category || 'all'}_${maxPrice || 'any'}_${minRating}_${pageSize}`;
    
    // Check cache first
    if (useCache) {
      const cached = searchCache.get<{
        data: Dish[];
        hasMore: boolean;
      }>(cacheKey);
      
      if (cached) {
        const baseQuery = this.buildSearchQuery(searchTerm, options);
        const pagination = new FirebasePagination<Dish>(baseQuery, { pageSize });
        
        return {
          data: cached.data,
          hasMore: cached.hasMore,
          pagination
        };
      }
    }

    try {
      const baseQuery = this.buildSearchQuery(searchTerm, options);
      
      const pagination = new FirebasePagination<Dish>(baseQuery, {
        pageSize,
        orderByField: 'rating',
        orderDirection: 'desc'
      });

      const result = await pagination.getFirstPage();
      
      // Cache the result
      if (useCache && !result.error) {
        searchCache.set(cacheKey, {
          data: result.data,
          hasMore: result.hasNextPage
        }, 5 * 60 * 1000); // 5 minutes for search results
      }

      return {
        data: result.data,
        hasMore: result.hasNextPage,
        pagination
      };
    } catch (error) {
      console.error('Error searching dishes:', error);
      const baseQuery = this.buildSearchQuery(searchTerm, options);
      const pagination = new FirebasePagination<Dish>(baseQuery, { pageSize });
      
      return {
        data: [],
        hasMore: false,
        pagination
      };
    }
  }

  // Helper method to build dishes query
  private static buildDishesQuery(options: {
    cookId?: string;
    category?: string;
    isAvailable?: boolean;
  }): Query<DocumentData> {
    const collectionRef = collection(db, 'dishes');
    const constraints: any[] = [];

    // Apply filters
    if (options.cookId) {
      constraints.push(where('cookerId', '==', options.cookId));
    }
    
    if (options.category) {
      constraints.push(where('category', '==', options.category));
    }

    if (options.isAvailable !== undefined) {
      constraints.push(where('isAvailable', '==', options.isAvailable));
    }

    return constraints.length > 0 ? query(collectionRef, ...constraints) : query(collectionRef);
  }

  // Helper method to build search query
  private static buildSearchQuery(
    searchTerm: string,
    options: {
      category?: string;
      maxPrice?: number;
      minRating?: number;
    }
  ): Query<DocumentData> {
    const collectionRef = collection(db, 'dishes');
    const constraints: any[] = [where('isAvailable', '==', true)];

    if (options.category) {
      constraints.push(where('category', '==', options.category));
    }

    if (options.maxPrice) {
      constraints.push(where('price', '<=', options.maxPrice));
    }

    if (options.minRating && options.minRating > 0) {
      constraints.push(where('rating', '>=', options.minRating));
    }

    // Note: Full-text search would need to be implemented differently
    // This is a simplified version using array-contains for tags
    if (searchTerm) {
      const searchTag = searchTerm.toLowerCase();
      constraints.push(where('tags', 'array-contains', searchTag));
    }

    return query(collectionRef, ...constraints);
  }

  // Invalidate cache when dish is updated
  static invalidateCache(dishId?: string, cookId?: string): void {
    if (dishId) {
      dishCache.delete(`dish_${dishId}`);
    }
    
    if (cookId) {
      dishCache.invalidatePattern(`.*cook_${cookId}.*`);
    }

    // Clear general caches
    dishCache.invalidatePattern('dishes_.*');
    dishCache.invalidatePattern('popular_dishes_.*');
    searchCache.clear();
  }
}

// Optimized Cooks Service
export class OptimizedCooksService {
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  // Get cooks with pagination
  static async getCooks(options: {
    isActive?: boolean;
    minRating?: number;
    pageSize?: number;
    useCache?: boolean;
  } = {}): Promise<{
    data: Cook[];
    hasMore: boolean;
    pagination: FirebasePagination<Cook>;
  }> {
    const {
      isActive = true,
      minRating = 0,
      pageSize = 20,
      useCache = true
    } = options;

    const cacheKey = `cooks_${isActive}_${minRating}_${pageSize}`;
    
    // Check cache first
    if (useCache) {
      const cached = cookCache.get<{
        data: Cook[];
        hasMore: boolean;
      }>(cacheKey);
      
      if (cached) {
        const baseQuery = this.buildCooksQuery(options);
        const pagination = new FirebasePagination<Cook>(baseQuery, { pageSize });
        
        return {
          data: cached.data,
          hasMore: cached.hasMore,
          pagination
        };
      }
    }

    try {
      const baseQuery = this.buildCooksQuery(options);
      
      const pagination = new FirebasePagination<Cook>(baseQuery, {
        pageSize,
        orderByField: 'rating',
        orderDirection: 'desc'
      });

      const result = await pagination.getFirstPage();
      
      // Cache the result
      if (useCache && !result.error) {
        cookCache.set(cacheKey, {
          data: result.data,
          hasMore: result.hasNextPage
        }, this.CACHE_TTL);
      }

      return {
        data: result.data,
        hasMore: result.hasNextPage,
        pagination
      };
    } catch (error) {
      console.error('Error fetching cooks:', error);
      const baseQuery = this.buildCooksQuery(options);
      const pagination = new FirebasePagination<Cook>(baseQuery, { pageSize });
      
      return {
        data: [],
        hasMore: false,
        pagination
      };
    }
  }

  // Get single cook with caching
  static async getCookById(cookId: string, useCache = true): Promise<Cook | null> {
    const cacheKey = `cook_${cookId}`;
    
    // Check cache first
    if (useCache) {
      const cached = cookCache.get<Cook>(cacheKey);
      if (cached) return cached;
    }

    try {
      const cookDoc = await getDoc(doc(db, 'cooks', cookId));
      
      if (!cookDoc.exists()) return null;
      
      const cook = {
        id: cookDoc.id,
        ...cookDoc.data()
      } as Cook;

      // Cache the result
      if (useCache) {
        cookCache.set(cacheKey, cook, this.CACHE_TTL);
      }

      return cook;
    } catch (error) {
      console.error('Error fetching cook:', error);
      return null;
    }
  }

  // Helper method to build cooks query
  private static buildCooksQuery(options: {
    isActive?: boolean;
    minRating?: number;
  }): Query<DocumentData> {
    const collectionRef = collection(db, 'cooks');
    const constraints: any[] = [];

    if (options.isActive !== undefined) {
      constraints.push(where('isActive', '==', options.isActive));
    }

    if (options.minRating && options.minRating > 0) {
      constraints.push(where('rating', '>=', options.minRating));
    }

    return constraints.length > 0 ? query(collectionRef, ...constraints) : query(collectionRef);
  }

  // Invalidate cache when cook is updated
  static invalidateCache(cookId?: string): void {
    if (cookId) {
      cookCache.delete(`cook_${cookId}`);
    }
    
    cookCache.invalidatePattern('cooks_.*');
  }
}

// Export optimized services
export const optimizedServices = {
  dishes: OptimizedDishesService,
  cooks: OptimizedCooksService
};