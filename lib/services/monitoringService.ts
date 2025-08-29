import * as Sentry from '@sentry/nextjs';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/client';

export interface MonitoringEvent {
  category: 'user_action' | 'api_call' | 'payment' | 'order' | 'error';
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  tags?: Record<string, string>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private userId: string | null = null;
  private userRole: string | null = null;

  private constructor() {
    this.initializeUserContext();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private async initializeUserContext() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        this.userId = user.uid;

        // Get user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          this.userRole = userDoc.data().role || 'client';
        }

        // Set user context in Sentry
        Sentry.setUser({
          id: user.uid,
          email: user.email || undefined,
          role: this.userRole,
        });

        // Set tags for better error categorization
        Sentry.setTags({
          user_role: this.userRole,
          user_id: user.uid,
        });
      }
    } catch (error) {
      console.error('Error initializing user context:', error);
    }
  }

  // Track custom events
  trackEvent(event: MonitoringEvent) {
    try {
      // Send to Sentry as breadcrumb
      Sentry.addBreadcrumb({
        category: event.category,
        message: `${event.action}${event.label ? ` - ${event.label}` : ''}`,
        level: 'info',
        data: {
          value: event.value,
          metadata: event.metadata,
          userId: event.userId || this.userId,
        },
      });

      // Custom event tracking for analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          custom_user_id: event.userId || this.userId,
        });
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  // Track performance metrics
  trackPerformance(metric: PerformanceMetric) {
    try {
      // Send performance data as breadcrumb (Sentry metrics API has changed)
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Performance: ${metric.name} = ${metric.value}${metric.unit}`,
        level: 'info',
        data: {
          ...metric,
          user_role: this.userRole,
        },
      });

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance: ${metric.name}`, metric);
      }
    } catch (error) {
      console.error('Error tracking performance:', error);
    }
  }

  // Track API calls
  trackApiCall(endpoint: string, method: string, duration: number, success: boolean) {
    this.trackEvent({
      category: 'api_call',
      action: `${method} ${endpoint}`,
      value: duration,
      metadata: {
        success,
        endpoint,
        method,
        duration,
      },
    });

    this.trackPerformance({
      name: 'api_response_time',
      value: duration,
      unit: 'ms',
      tags: {
        endpoint,
        method,
        success: success.toString(),
      },
    });
  }

  // Track payment events
  trackPayment(amount: number, currency: string, method: string, success: boolean) {
    this.trackEvent({
      category: 'payment',
      action: success ? 'payment_success' : 'payment_failed',
      value: amount,
      label: `${method} - ${currency}`,
      metadata: {
        amount,
        currency,
        method,
        success,
      },
    });
  }

  // Track order events
  trackOrder(orderId: string, status: string, value?: number) {
    this.trackEvent({
      category: 'order',
      action: `order_${status}`,
      label: orderId,
      value,
      metadata: {
        orderId,
        status,
        value,
      },
    });
  }

  // Track user actions
  trackUserAction(action: string, label?: string, metadata?: Record<string, any>) {
    this.trackEvent({
      category: 'user_action',
      action,
      label,
      metadata,
    });
  }

  // Track errors with context
  trackError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      tags: {
        error_type: 'application_error',
        user_role: this.userRole || 'unknown',
      },
      extra: {
        ...context,
        userId: this.userId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Track Firebase operations
  trackFirebaseOperation(operation: string, collection: string, duration: number, success: boolean) {
    this.trackPerformance({
      name: 'firebase_operation',
      value: duration,
      unit: 'ms',
      tags: {
        operation,
        collection,
        success: success.toString(),
      },
    });
  }

  // Track MercadoPago operations
  trackMercadoPagoOperation(operation: string, duration: number, success: boolean) {
    this.trackPerformance({
      name: 'mercadopago_operation',
      value: duration,
      unit: 'ms',
      tags: {
        operation,
        success: success.toString(),
      },
    });
  }

  // Set custom context for current session
  setContext(key: string, value: any) {
    Sentry.setContext(key, value);
  }

  // Add custom tag
  setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }

  // Start transaction for performance monitoring
  startTransaction(name: string, op: string) {
    // Create a span instead of transaction (updated Sentry API)
    return Sentry.startSpan({
      name,
      op,
    }, () => {});
  }

  // Capture message
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', extra?: Record<string, any>) {
    Sentry.withScope((scope) => {
      scope.setLevel(level);
      if (extra) {
        scope.setContext('extra', extra);
      }
      scope.setTag('user_role', this.userRole || 'unknown');
      Sentry.captureMessage(message);
    });
  }

  // Flush pending events (useful before page unload)
  async flush(timeout: number = 2000) {
    return Sentry.flush(timeout);
  }
}

export const monitoring = MonitoringService.getInstance();
