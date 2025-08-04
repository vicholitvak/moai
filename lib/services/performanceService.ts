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

// Performance metric types
export interface PerformanceMetric {
  id?: string;
  type: 'page_load' | 'api_call' | 'search' | 'render' | 'interaction';
  name: string;
  duration: number; // in milliseconds
  timestamp: Timestamp;
  userId?: string;
  sessionId: string;
  userAgent: string;
  metadata?: any;
}

export interface WebVitals {
  id?: string;
  sessionId: string;
  userId?: string;
  url: string;
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  ttfb?: number; // Time to First Byte
  timestamp: Timestamp;
}

export interface APIPerformance {
  id?: string;
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: Timestamp;
  userId?: string;
  sessionId: string;
  size?: number; // response size in bytes
  error?: string;
}

export interface PerformanceReport {
  overview: {
    averagePageLoad: number;
    averageAPIResponse: number;
    errorRate: number;
    totalRequests: number;
  };
  pagePerformance: {
    [page: string]: {
      averageLoadTime: number;
      samples: number;
      p95: number;
    };
  };
  apiPerformance: {
    [endpoint: string]: {
      averageResponseTime: number;
      errorRate: number;
      requests: number;
    };
  };
  webVitals: {
    cls: { average: number; good: number; needs_improvement: number; poor: number };
    fid: { average: number; good: number; needs_improvement: number; poor: number };
    lcp: { average: number; good: number; needs_improvement: number; poor: number };
  };
  trends: {
    date: string;
    pageLoad: number;
    apiResponse: number;
    errors: number;
  }[];
}

export class PerformanceService {
  private static sessionId: string | null = null;
  private static isInitialized = false;

  // Initialize performance monitoring
  static initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.sessionId = this.generateSessionId();
    this.isInitialized = true;

    // Set up performance observers
    this.setupNavigationObserver();
    this.setupResourceObserver();
    this.setupWebVitalsObserver();
    this.setupErrorHandling();

    console.log('Performance monitoring initialized');
  }

  // Generate session ID
  private static generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track page load performance
  static async trackPageLoad(pageName: string, loadTime: number, metadata?: any): Promise<void> {
    try {
      const metric: PerformanceMetric = {
        type: 'page_load',
        name: pageName,
        duration: loadTime,
        timestamp: Timestamp.now(),
        sessionId: this.sessionId || this.generateSessionId(),
        userAgent: navigator.userAgent,
        metadata
      };

      await addDoc(collection(db, 'performanceMetrics'), metric);
      
      // Update aggregated metrics
      await this.updateAggregatedMetrics('page_load', pageName, loadTime);

    } catch (error) {
      console.error('Error tracking page load:', error);
    }
  }

  // Track API call performance
  static async trackAPICall(
    endpoint: string, 
    method: string, 
    duration: number, 
    status: number, 
    size?: number,
    error?: string
  ): Promise<void> {
    try {
      const metric: APIPerformance = {
        endpoint,
        method,
        duration,
        status,
        timestamp: Timestamp.now(),
        sessionId: this.sessionId || this.generateSessionId(),
        size,
        error
      };

      await addDoc(collection(db, 'apiPerformance'), metric);
      
      // Update aggregated metrics
      await this.updateAggregatedMetrics('api_call', endpoint, duration, status >= 400);

    } catch (error) {
      console.error('Error tracking API call:', error);
    }
  }

  // Track search performance
  static async trackSearchPerformance(query: string, duration: number, resultsCount: number): Promise<void> {
    try {
      const metric: PerformanceMetric = {
        type: 'search',
        name: 'search_execution',
        duration,
        timestamp: Timestamp.now(),
        sessionId: this.sessionId || this.generateSessionId(),
        userAgent: navigator.userAgent,
        metadata: {
          query,
          resultsCount
        }
      };

      await addDoc(collection(db, 'performanceMetrics'), metric);

    } catch (error) {
      console.error('Error tracking search performance:', error);
    }
  }

  // Track component render performance
  static async trackRenderPerformance(componentName: string, renderTime: number): Promise<void> {
    try {
      const metric: PerformanceMetric = {
        type: 'render',
        name: componentName,
        duration: renderTime,
        timestamp: Timestamp.now(),
        sessionId: this.sessionId || this.generateSessionId(),
        userAgent: navigator.userAgent
      };

      await addDoc(collection(db, 'performanceMetrics'), metric);

    } catch (error) {
      console.error('Error tracking render performance:', error);
    }
  }

  // Track user interaction performance
  static async trackInteraction(actionName: string, duration: number, metadata?: any): Promise<void> {
    try {
      const metric: PerformanceMetric = {
        type: 'interaction',
        name: actionName,
        duration,
        timestamp: Timestamp.now(),
        sessionId: this.sessionId || this.generateSessionId(),
        userAgent: navigator.userAgent,
        metadata
      };

      await addDoc(collection(db, 'performanceMetrics'), metric);

    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  // Track Web Vitals
  static async trackWebVitals(vitals: Omit<WebVitals, 'id' | 'timestamp' | 'sessionId'>): Promise<void> {
    try {
      const webVitalsData: WebVitals = {
        ...vitals,
        sessionId: this.sessionId || this.generateSessionId(),
        timestamp: Timestamp.now()
      };

      await addDoc(collection(db, 'webVitals'), webVitalsData);

    } catch (error) {
      console.error('Error tracking web vitals:', error);
    }
  }

  // Update aggregated metrics for fast reporting
  private static async updateAggregatedMetrics(
    type: string, 
    name: string, 
    duration: number, 
    isError: boolean = false
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const aggregateRef = doc(db, 'performanceAggregates', `${type}_${name}_${today}`);
      
      const aggregateDoc = await getDoc(aggregateRef);
      
      if (aggregateDoc.exists()) {
        const data = aggregateDoc.data();
        const count = data.count + 1;
        const totalDuration = data.totalDuration + duration;
        const errors = data.errors + (isError ? 1 : 0);
        
        await updateDoc(aggregateRef, {
          count,
          totalDuration,
          averageDuration: totalDuration / count,
          errors,
          errorRate: (errors / count) * 100,
          lastUpdated: Timestamp.now()
        });
      } else {
        await setDoc(aggregateRef, {
          type,
          name,
          date: today,
          count: 1,
          totalDuration: duration,
          averageDuration: duration,
          errors: isError ? 1 : 0,
          errorRate: isError ? 100 : 0,
          lastUpdated: Timestamp.now()
        });
      }

    } catch (error) {
      console.error('Error updating aggregated metrics:', error);
    }
  }

  // Set up Navigation Timing observer
  private static setupNavigationObserver(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            this.trackPageLoad(
              window.location.pathname,
              navEntry.loadEventEnd - navEntry.navigationStart,
              {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
                firstPaint: navEntry.responseEnd - navEntry.navigationStart,
                domComplete: navEntry.domComplete - navEntry.navigationStart
              }
            );
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  // Set up Resource Timing observer
  private static setupResourceObserver(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Track slow resources (> 1 second)
            if (resourceEntry.duration > 1000) {
              this.trackAPICall(
                resourceEntry.name,
                'GET',
                resourceEntry.duration,
                200, // Assume success for resources that loaded
                resourceEntry.transferSize
              );
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  // Set up Web Vitals observer
  private static setupWebVitalsObserver(): void {
    // This would integrate with the web-vitals library in a real implementation
    // For now, we'll simulate collecting these metrics
    
    if ('PerformanceObserver' in window) {
      // Observe layout shifts for CLS
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        if (clsValue > 0) {
          this.trackWebVitals({
            url: window.location.href,
            cls: clsValue
          });
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Observe paint metrics for FCP and LCP
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.trackWebVitals({
              url: window.location.href,
              fcp: entry.startTime
            });
          }
        }
      });

      paintObserver.observe({ entryTypes: ['paint'] });
    }
  }

  // Set up error handling
  private static setupErrorHandling(): void {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackInteraction('javascript_error', 0, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackInteraction('unhandled_rejection', 0, {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    });
  }

  // Get performance report
  static async getPerformanceReport(days: number = 7): Promise<PerformanceReport> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get aggregated metrics
      const aggregatesQuery = query(
        collection(db, 'performanceAggregates'),
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr)
      );

      const aggregatesSnapshot = await getDocs(aggregatesQuery);
      const aggregates = aggregatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate overview metrics
      const pageLoadMetrics = aggregates.filter(a => a.type === 'page_load');
      const apiMetrics = aggregates.filter(a => a.type === 'api_call');

      const overview = {
        averagePageLoad: this.calculateAverage(pageLoadMetrics, 'averageDuration'),
        averageAPIResponse: this.calculateAverage(apiMetrics, 'averageDuration'),
        errorRate: this.calculateAverage(apiMetrics, 'errorRate'),
        totalRequests: apiMetrics.reduce((sum, m) => sum + m.count, 0)
      };

      // Group page performance
      const pagePerformance: { [page: string]: any } = {};
      pageLoadMetrics.forEach(metric => {
        if (!pagePerformance[metric.name]) {
          pagePerformance[metric.name] = {
            averageLoadTime: metric.averageDuration,
            samples: metric.count,
            p95: metric.averageDuration * 1.2 // Approximation
          };
        }
      });

      // Group API performance
      const apiPerformance: { [endpoint: string]: any } = {};
      apiMetrics.forEach(metric => {
        if (!apiPerformance[metric.name]) {
          apiPerformance[metric.name] = {
            averageResponseTime: metric.averageDuration,
            errorRate: metric.errorRate,
            requests: metric.count
          };
        }
      });

      // Get Web Vitals
      const webVitalsSnapshot = await getDocs(
        query(
          collection(db, 'webVitals'),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          where('timestamp', '<=', Timestamp.fromDate(endDate))
        )
      );

      const vitals = webVitalsSnapshot.docs.map(doc => doc.data());
      const webVitals = this.calculateWebVitalsMetrics(vitals);

      // Calculate trends
      const trends = this.calculateTrends(aggregates, days);

      return {
        overview,
        pagePerformance,
        apiPerformance,
        webVitals,
        trends
      };

    } catch (error) {
      console.error('Error getting performance report:', error);
      return this.getEmptyReport();
    }
  }

  // Calculate average from metrics
  private static calculateAverage(metrics: any[], field: string): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + (m[field] || 0), 0) / metrics.length;
  }

  // Calculate Web Vitals metrics
  private static calculateWebVitalsMetrics(vitals: any[]) {
    const cls = vitals.filter(v => v.cls !== undefined).map(v => v.cls);
    const fid = vitals.filter(v => v.fid !== undefined).map(v => v.fid);
    const lcp = vitals.filter(v => v.lcp !== undefined).map(v => v.lcp);

    return {
      cls: this.calculateVitalDistribution(cls, [0.1, 0.25]),
      fid: this.calculateVitalDistribution(fid, [100, 300]),
      lcp: this.calculateVitalDistribution(lcp, [2500, 4000])
    };
  }

  // Calculate distribution for Web Vitals
  private static calculateVitalDistribution(values: number[], thresholds: [number, number]) {
    if (values.length === 0) {
      return { average: 0, good: 0, needs_improvement: 0, poor: 0 };
    }

    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const good = values.filter(v => v <= thresholds[0]).length;
    const needs_improvement = values.filter(v => v > thresholds[0] && v <= thresholds[1]).length;
    const poor = values.filter(v => v > thresholds[1]).length;

    return { average, good, needs_improvement, poor };
  }

  // Calculate performance trends
  private static calculateTrends(aggregates: any[], days: number) {
    const trends: { [date: string]: { pageLoad: number; apiResponse: number; errors: number } } = {};

    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trends[dateStr] = { pageLoad: 0, apiResponse: 0, errors: 0 };
    }

    // Aggregate by date
    aggregates.forEach(metric => {
      if (trends[metric.date]) {
        if (metric.type === 'page_load') {
          trends[metric.date].pageLoad = metric.averageDuration;
        } else if (metric.type === 'api_call') {
          trends[metric.date].apiResponse = metric.averageDuration;
          trends[metric.date].errors += metric.errors;
        }
      }
    });

    return Object.entries(trends)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get empty report structure
  private static getEmptyReport(): PerformanceReport {
    return {
      overview: {
        averagePageLoad: 0,
        averageAPIResponse: 0,
        errorRate: 0,
        totalRequests: 0
      },
      pagePerformance: {},
      apiPerformance: {},
      webVitals: {
        cls: { average: 0, good: 0, needs_improvement: 0, poor: 0 },
        fid: { average: 0, good: 0, needs_improvement: 0, poor: 0 },
        lcp: { average: 0, good: 0, needs_improvement: 0, poor: 0 }
      },
      trends: []
    };
  }

  // Performance monitoring utilities
  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return fn().then(
      (result) => {
        const duration = performance.now() - startTime;
        this.trackInteraction(name, duration, { success: true });
        return result;
      },
      (error) => {
        const duration = performance.now() - startTime;
        this.trackInteraction(name, duration, { success: false, error: error.message });
        throw error;
      }
    );
  }

  static measureSync<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.trackInteraction(name, duration, { success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.trackInteraction(name, duration, { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  // Create performance monitoring hook for React components
  static createPerformanceHook(componentName: string) {
    return {
      onMount: () => {
        const startTime = performance.now();
        return () => {
          const duration = performance.now() - startTime;
          this.trackRenderPerformance(`${componentName}_mount`, duration);
        };
      },
      onUpdate: () => {
        const startTime = performance.now();
        return () => {
          const duration = performance.now() - startTime;
          this.trackRenderPerformance(`${componentName}_update`, duration);
        };
      }
    };
  }
}