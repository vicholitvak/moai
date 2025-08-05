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

  // Get dishes with caching and pagination
  static async getDishes(options: {
    cookId?: string;
    category?: string;
    isAvailable?: boolean;
    pageSize?: number;
    useCache?: boolean;
  } = {}): Promise<{
    data: Dish[];
    hasMore: boolean;
    pagination: FirebasePagination<Dish>;
  }> {
    const {
      cookId,
      category,
      isAvailable = true,
      pageSize = this.DEFAULT_PAGE_SIZE,
      useCache = true
    } = options;

    // Generate cache key
    const cacheKey = `dishes_${cookId || 'all'}_${category || 'all'}_${isAvailable}_${pageSize}`;
    
    // Check cache first
    if (useCache) {
      const cached = dishCache.get<{
        data: Dish[];
        hasMore: boolean;
      }>(cacheKey);
      
      if (cached) {
        // Return cached data but still create pagination for future use
        const baseQuery = this.buildDishesQuery({ cookId, category, isAvailable });
        const pagination = new FirebasePagination<Dish>(baseQuery, { pageSize });
        
        return {
          data: cached.data,
          hasMore: cached.hasMore,
          pagination
        };
      }
    }

    try {
      // Build optimized query
      const baseQuery = this.buildDishesQuery({ cookId, category, isAvailable });
      
      // Try pagination first, with fallback to direct query
      try {
        const pagination = new FirebasePagination<Dish>(baseQuery, {
          pageSize,
          orderByField: 'createdAt',
          orderDirection: 'desc'
        });

        const result = await pagination.getFirstPage();
        
        if (!result.error && result.data.length > 0) {
          // Pagination worked
          if (useCache) {
            dishCache.set(cacheKey, {
              data: result.data,
              hasMore: result.hasNextPage
            }, this.CACHE_TTL);
          }

          return {
            data: result.data,
            hasMore: result.hasNextPage,
            pagination
          };
        }
      } catch (paginationError) {
        console.warn('Pagination failed, falling back to direct query:', paginationError);
      }
      
      // Fallback: Use direct query without pagination
      const { getDocs, orderBy: fbOrderBy, limit: fbLimit } = await import('firebase/firestore');
      const { query } = await import('firebase/firestore');
      
      // Add ordering and limit to base query
      const fallbackQuery = query(baseQuery, fbOrderBy('createdAt', 'desc'), fbLimit(pageSize));
      const directSnapshot = await getDocs(fallbackQuery);
      
      const directDishes = directSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Dish[];
      
      // Cache the result
      if (useCache) {
        dishCache.set(cacheKey, {
          data: directDishes,
          hasMore: directSnapshot.docs.length === pageSize
        }, this.CACHE_TTL);
      }

      return {
        data: directDishes,
        hasMore: directSnapshot.docs.length === pageSize,
        pagination: new FirebasePagination<Dish>(baseQuery, { pageSize })
      };
    } catch (error) {
      console.error('Error fetching dishes:', error);
      const baseQuery = this.buildDishesQuery({ cookId, category, isAvailable });
      const pagination = new FirebasePagination<Dish>(baseQuery, { pageSize });
      
      return {
        data: [],
        hasMore: false,
        pagination
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
    let q = collection(db, 'dishes');

    // Apply filters
    if (options.cookId) {
      q = query(q, where('cookerId', '==', options.cookId));
    }
    
    if (options.category) {
      q = query(q, where('category', '==', options.category));
    }

    if (options.isAvailable !== undefined) {
      q = query(q, where('isAvailable', '==', options.isAvailable));
    }

    return q;
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
    let q = collection(db, 'dishes');

    // Basic filters
    q = query(q, where('isAvailable', '==', true));

    if (options.category) {
      q = query(q, where('category', '==', options.category));
    }

    if (options.maxPrice) {
      q = query(q, where('price', '<=', options.maxPrice));
    }

    if (options.minRating > 0) {
      q = query(q, where('rating', '>=', options.minRating));
    }

    // Note: Full-text search would need to be implemented differently
    // This is a simplified version using array-contains for tags
    if (searchTerm) {
      const searchTag = searchTerm.toLowerCase();
      q = query(q, where('tags', 'array-contains', searchTag));
    }

    return q;
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
    let q = collection(db, 'cooks');

    if (options.isActive !== undefined) {
      q = query(q, where('isActive', '==', options.isActive));
    }

    if (options.minRating && options.minRating > 0) {
      q = query(q, where('rating', '>=', options.minRating));
    }

    return q;
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