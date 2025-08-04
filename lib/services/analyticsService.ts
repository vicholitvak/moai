'use client';

import { db } from '@/lib/firebase/client';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  increment
} from 'firebase/firestore';

// Analytics event types
export interface SearchEvent {
  id?: string;
  userId?: string;
  sessionId: string;
  query: string;
  filters: any;
  resultsCount: number;
  searchTime: number;
  clickedDishId?: string;
  clickPosition?: number;
  timestamp: Timestamp;
  userAgent: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserInteractionEvent {
  id?: string;
  userId?: string;
  sessionId: string;
  eventType: 'search' | 'click' | 'view' | 'add_to_cart' | 'order' | 'filter_change';
  targetId?: string; // dishId, cookId, etc.
  metadata: any;
  timestamp: Timestamp;
  userAgent: string;
}

export interface SearchAnalytics {
  totalSearches: number;
  uniqueSearches: number;
  popularQueries: { query: string; count: number }[];
  popularFilters: { filter: string; value: string; count: number }[];
  averageSearchTime: number;
  clickThroughRate: number;
  topCategories: { category: string; searchCount: number }[];
  searchTrends: { date: string; searches: number }[];
  userBehavior: {
    avgSessionDuration: number;
    avgSearchesPerSession: number;
    bounceRate: number;
  };
}

export interface DishAnalytics {
  dishId: string;
  dishName: string;
  views: number;
  searches: number;
  clicks: number;
  orders: number;
  conversionRate: number;
  averageRating: number;
  reviewCount: number;
  revenue: number;
  popularSearchTerms: string[];
}

export interface CookAnalytics {
  cookId: string;
  cookName: string;
  dishViews: number;
  orders: number;
  revenue: number;
  averageRating: number;
  totalReviews: number;
  popularDishes: { dishId: string; name: string; orders: number }[];
  customerRetention: number;
}

export class AnalyticsService {
  private static sessionId: string | null = null;

  // Generate or get session ID
  private static getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  // Track search events
  static async trackSearch(searchData: {
    userId?: string;
    query: string;
    filters: any;
    resultsCount: number;
    searchTime: number;
    location?: { latitude: number; longitude: number };
  }): Promise<void> {
    try {
      const searchEvent: SearchEvent = {
        ...searchData,
        sessionId: this.getSessionId(),
        timestamp: Timestamp.now(),
        userAgent: navigator.userAgent
      };

      // Add to search events collection
      await addDoc(collection(db, 'searchEvents'), searchEvent);

      // Update search aggregations
      await this.updateSearchAggregations(searchData.query, searchData.filters);

    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  // Track search result clicks
  static async trackSearchClick(data: {
    userId?: string;
    query: string;
    dishId: string;
    position: number;
    resultsCount: number;
  }): Promise<void> {
    try {
      // Update the search event with click data
      const searchEvents = await getDocs(
        query(
          collection(db, 'searchEvents'),
          where('sessionId', '==', this.getSessionId()),
          where('query', '==', data.query),
          orderBy('timestamp', 'desc'),
          limit(1)
        )
      );

      if (!searchEvents.empty) {
        const searchEventRef = searchEvents.docs[0].ref;
        await updateDoc(searchEventRef, {
          clickedDishId: data.dishId,
          clickPosition: data.position
        });
      }

      // Track as user interaction
      await this.trackUserInteraction({
        userId: data.userId,
        eventType: 'click',
        targetId: data.dishId,
        metadata: {
          query: data.query,
          position: data.position,
          resultsCount: data.resultsCount
        }
      });

    } catch (error) {
      console.error('Error tracking search click:', error);
    }
  }

  // Track general user interactions
  static async trackUserInteraction(data: {
    userId?: string;
    eventType: 'search' | 'click' | 'view' | 'add_to_cart' | 'order' | 'filter_change';
    targetId?: string;
    metadata: any;
  }): Promise<void> {
    try {
      const interaction: UserInteractionEvent = {
        ...data,
        sessionId: this.getSessionId(),
        timestamp: Timestamp.now(),
        userAgent: navigator.userAgent
      };

      await addDoc(collection(db, 'userInteractions'), interaction);

    } catch (error) {
      console.error('Error tracking user interaction:', error);
    }
  }

  // Update search aggregations for quick analytics
  private static async updateSearchAggregations(query: string, filters: any): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Update daily search counts
      const dailyStatsRef = doc(db, 'searchStats', today);
      const dailyStatsDoc = await getDoc(dailyStatsRef);
      
      if (dailyStatsDoc.exists()) {
        await updateDoc(dailyStatsRef, {
          totalSearches: increment(1),
          lastUpdated: Timestamp.now()
        });
      } else {
        await setDoc(dailyStatsRef, {
          date: today,
          totalSearches: 1,
          uniqueQueries: new Set([query.toLowerCase()]),
          lastUpdated: Timestamp.now()
        });
      }

      // Update query popularity
      const queryRef = doc(db, 'popularQueries', query.toLowerCase());
      const queryDoc = await getDoc(queryRef);
      
      if (queryDoc.exists()) {
        await updateDoc(queryRef, {
          count: increment(1),
          lastSearched: Timestamp.now()
        });
      } else {
        await setDoc(queryRef, {
          query: query.toLowerCase(),
          count: 1,
          firstSearched: Timestamp.now(),
          lastSearched: Timestamp.now()
        });
      }

      // Update filter popularity
      for (const [filterKey, filterValue] of Object.entries(filters)) {
        if (filterValue && filterKey !== 'query') {
          const filterRef = doc(db, 'popularFilters', `${filterKey}_${filterValue}`);
          const filterDoc = await getDoc(filterRef);
          
          if (filterDoc.exists()) {
            await updateDoc(filterRef, {
              count: increment(1),
              lastUsed: Timestamp.now()
            });
          } else {
            await setDoc(filterRef, {
              filter: filterKey,
              value: filterValue,
              count: 1,
              firstUsed: Timestamp.now(),
              lastUsed: Timestamp.now()
            });
          }
        }
      }

    } catch (error) {
      console.error('Error updating search aggregations:', error);
    }
  }

  // Get search analytics
  static async getSearchAnalytics(days: number = 30): Promise<SearchAnalytics> {
    try {
      // Get date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Get search events
      const searchEvents = await getDocs(
        query(
          collection(db, 'searchEvents'),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          where('timestamp', '<=', Timestamp.fromDate(endDate))
        )
      );

      const events = searchEvents.docs.map(doc => ({ id: doc.id, ...doc.data() } as SearchEvent));

      // Calculate metrics
      const totalSearches = events.length;
      const uniqueQueries = new Set(events.map(e => e.query.toLowerCase())).size;
      const averageSearchTime = events.reduce((sum, e) => sum + e.searchTime, 0) / totalSearches || 0;
      const clickedSearches = events.filter(e => e.clickedDishId).length;
      const clickThroughRate = totalSearches > 0 ? (clickedSearches / totalSearches) * 100 : 0;

      // Get popular queries
      const popularQueriesSnapshot = await getDocs(
        query(collection(db, 'popularQueries'), orderBy('count', 'desc'), limit(10))
      );
      const popularQueries = popularQueriesSnapshot.docs.map(doc => ({
        query: doc.data().query,
        count: doc.data().count
      }));

      // Get popular filters
      const popularFiltersSnapshot = await getDocs(
        query(collection(db, 'popularFilters'), orderBy('count', 'desc'), limit(20))
      );
      const popularFilters = popularFiltersSnapshot.docs.map(doc => ({
        filter: doc.data().filter,
        value: doc.data().value,
        count: doc.data().count
      }));

      // Calculate search trends
      const searchTrends = this.calculateSearchTrends(events, days);

      // Calculate user behavior metrics
      const userBehavior = this.calculateUserBehavior(events);

      return {
        totalSearches,
        uniqueSearches: uniqueQueries,
        popularQueries,
        popularFilters,
        averageSearchTime,
        clickThroughRate,
        topCategories: [], // Will be calculated based on filter data
        searchTrends,
        userBehavior
      };

    } catch (error) {
      console.error('Error getting search analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  // Calculate search trends by day
  private static calculateSearchTrends(events: SearchEvent[], days: number) {
    const trendMap: { [key: string]: number } = {};
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendMap[dateStr] = 0;
    }

    // Count searches by day
    events.forEach(event => {
      const dateStr = event.timestamp.toDate().toISOString().split('T')[0];
      if (trendMap.hasOwnProperty(dateStr)) {
        trendMap[dateStr]++;
      }
    });

    return Object.entries(trendMap)
      .map(([date, searches]) => ({ date, searches }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Calculate user behavior metrics
  private static calculateUserBehavior(events: SearchEvent[]) {
    const sessionMap: { [key: string]: SearchEvent[] } = {};
    
    // Group events by session
    events.forEach(event => {
      if (!sessionMap[event.sessionId]) {
        sessionMap[event.sessionId] = [];
      }
      sessionMap[event.sessionId].push(event);
    });

    const sessions = Object.values(sessionMap);
    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return {
        avgSessionDuration: 0,
        avgSearchesPerSession: 0,
        bounceRate: 0
      };
    }

    // Calculate session durations
    const sessionDurations = sessions.map(sessionEvents => {
      if (sessionEvents.length <= 1) return 0;
      
      const timestamps = sessionEvents.map(e => e.timestamp.toDate().getTime());
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      
      return (maxTime - minTime) / 1000; // in seconds
    });

    const avgSessionDuration = sessionDurations.reduce((sum, duration) => sum + duration, 0) / totalSessions;
    const avgSearchesPerSession = events.length / totalSessions;
    const bounceSessions = sessions.filter(session => session.length === 1 && !session[0].clickedDishId).length;
    const bounceRate = (bounceSessions / totalSessions) * 100;

    return {
      avgSessionDuration,
      avgSearchesPerSession,
      bounceRate
    };
  }

  // Get dish analytics
  static async getDishAnalytics(dishId: string): Promise<DishAnalytics | null> {
    try {
      // Get dish interactions
      const interactions = await getDocs(
        query(
          collection(db, 'userInteractions'),
          where('targetId', '==', dishId)
        )
      );

      const interactionData = interactions.docs.map(doc => doc.data());
      
      const views = interactionData.filter(i => i.eventType === 'view').length;
      const clicks = interactionData.filter(i => i.eventType === 'click').length;
      const orders = interactionData.filter(i => i.eventType === 'order').length;

      // Get search events that resulted in clicks to this dish
      const searchClicks = await getDocs(
        query(
          collection(db, 'searchEvents'),
          where('clickedDishId', '==', dishId)
        )
      );

      const searches = searchClicks.docs.length;
      const conversionRate = views > 0 ? (orders / views) * 100 : 0;

      // Extract popular search terms
      const popularSearchTerms = searchClicks.docs
        .map(doc => doc.data().query)
        .filter((query, index, arr) => arr.indexOf(query) === index)
        .slice(0, 10);

      return {
        dishId,
        dishName: '', // Will be fetched from dish data
        views,
        searches,
        clicks,
        orders,
        conversionRate,
        averageRating: 0, // Will be calculated from reviews
        reviewCount: 0,
        revenue: 0, // Will be calculated from orders
        popularSearchTerms
      };

    } catch (error) {
      console.error('Error getting dish analytics:', error);
      return null;
    }
  }

  // Get top performing dishes
  static async getTopPerformingDishes(metric: 'views' | 'orders' | 'revenue' = 'orders', limit: number = 10) {
    try {
      // This would require aggregated data or complex queries
      // This would require complex aggregation queries or pre-computed data
      return [];
    } catch (error) {
      console.error('Error getting top performing dishes:', error);
      return [];
    }
  }

  // Get search suggestions based on analytics
  static async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      if (!query || query.length < 2) {
        // Return popular queries
        const popularQueriesSnapshot = await getDocs(
          query(collection(db, 'popularQueries'), orderBy('count', 'desc'), limit(limit))
        );
        return popularQueriesSnapshot.docs.map(doc => doc.data().query);
      }

      // Find similar queries
      const queryLower = query.toLowerCase();
      const popularQueriesSnapshot = await getDocs(
        query(collection(db, 'popularQueries'), orderBy('count', 'desc'), limit(50))
      );

      const suggestions = popularQueriesSnapshot.docs
        .map(doc => doc.data().query)
        .filter(q => q.includes(queryLower) && q !== queryLower)
        .slice(0, limit);

      return suggestions;

    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Get empty analytics structure
  private static getEmptyAnalytics(): SearchAnalytics {
    return {
      totalSearches: 0,
      uniqueSearches: 0,
      popularQueries: [],
      popularFilters: [],
      averageSearchTime: 0,
      clickThroughRate: 0,
      topCategories: [],
      searchTrends: [],
      userBehavior: {
        avgSessionDuration: 0,
        avgSearchesPerSession: 0,
        bounceRate: 0
      }
    };
  }

  // Track page views
  static async trackPageView(page: string, userId?: string): Promise<void> {
    try {
      await this.trackUserInteraction({
        userId,
        eventType: 'view',
        targetId: page,
        metadata: {
          page,
          timestamp: new Date().toISOString(),
          referrer: document.referrer,
          userAgent: navigator.userAgent
        }
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  // Track conversion events
  static async trackConversion(type: 'order' | 'signup' | 'add_to_cart', data: any): Promise<void> {
    try {
      await this.trackUserInteraction({
        userId: data.userId,
        eventType: type,
        targetId: data.targetId,
        metadata: {
          type,
          value: data.value,
          ...data
        }
      });
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  // Get real-time analytics
  static async getRealTimeStats(): Promise<{
    activeUsers: number;
    currentSearches: number;
    topQueries: string[];
    conversionRate: number;
  }> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get recent interactions
      const recentInteractions = await getDocs(
        query(
          collection(db, 'userInteractions'),
          where('timestamp', '>=', Timestamp.fromDate(oneHourAgo))
        )
      );

      const interactions = recentInteractions.docs.map(doc => doc.data());
      const uniqueUsers = new Set(interactions.map(i => i.userId).filter(Boolean)).size;
      const searches = interactions.filter(i => i.eventType === 'search').length;
      const orders = interactions.filter(i => i.eventType === 'order').length;

      // Get recent popular queries
      const recentSearches = await getDocs(
        query(
          collection(db, 'searchEvents'),
          where('timestamp', '>=', Timestamp.fromDate(oneHourAgo)),
          orderBy('timestamp', 'desc'),
          limit(100)
        )
      );

      const queryCount: { [key: string]: number } = {};
      recentSearches.docs.forEach(doc => {
        const query = doc.data().query.toLowerCase();
        queryCount[query] = (queryCount[query] || 0) + 1;
      });

      const topQueries = Object.entries(queryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([query]) => query);

      const conversionRate = searches > 0 ? (orders / searches) * 100 : 0;

      return {
        activeUsers: uniqueUsers,
        currentSearches: searches,
        topQueries,
        conversionRate
      };

    } catch (error) {
      console.error('Error getting real-time stats:', error);
      return {
        activeUsers: 0,
        currentSearches: 0,
        topQueries: [],
        conversionRate: 0
      };
    }
  }
}