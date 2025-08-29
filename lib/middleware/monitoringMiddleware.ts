import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '@/lib/services/monitoringService';

export interface MonitoringMiddlewareOptions {
  trackPerformance?: boolean;
  trackErrors?: boolean;
  excludePaths?: string[];
}

export function withMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  options: MonitoringMiddlewareOptions = {}
) {
  const {
    trackPerformance = true,
    trackErrors = true,
    excludePaths = [],
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Skip monitoring for excluded paths
    if (excludePaths.some(path => pathname.startsWith(path))) {
      return handler(request);
    }

    try {
      // Track API call start
      monitoring.trackEvent({
        category: 'api_call',
        action: 'api_request_start',
        label: `${method} ${pathname}`,
        metadata: {
          method,
          pathname,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        },
      });

      // Execute the handler
      const response = await handler(request);
      const duration = Date.now() - startTime;

      // Track successful API call
      if (trackPerformance) {
        monitoring.trackApiCall(pathname, method, duration, true);
      }

      // Track response metrics
      monitoring.trackEvent({
        category: 'api_call',
        action: 'api_request_success',
        label: `${method} ${pathname}`,
        value: duration,
        metadata: {
          method,
          pathname,
          statusCode: response.status,
          duration,
        },
      });

      // Add monitoring headers to response
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('X-Response-Time', `${duration}ms`);
      responseHeaders.set('X-Monitoring-Enabled', 'true');

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });

    } catch (error) {
      const duration = Date.now() - startTime;

      // Track failed API call
      if (trackPerformance) {
        monitoring.trackApiCall(pathname, method, duration, false);
      }

      // Track error
      if (trackErrors) {
        monitoring.trackError(error as Error, {
          method,
          pathname,
          duration,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          timestamp: new Date().toISOString(),
        });
      }

      // Track error event
      monitoring.trackEvent({
        category: 'error',
        action: 'api_request_error',
        label: `${method} ${pathname}`,
        value: duration,
        metadata: {
          method,
          pathname,
          error: (error as Error).message,
          duration,
        },
      });

      // Re-throw the error to be handled by Next.js error boundary
      throw error;
    }
  };
}

// Utility function to wrap API routes with monitoring
export function createMonitoredApiHandler(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  options?: MonitoringMiddlewareOptions
) {
  return withMonitoring(handler, options);
}

// Performance monitoring wrapper for database operations
export async function withDbMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string,
  collection?: string
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    monitoring.trackFirebaseOperation(operationName, collection || 'unknown', duration, true);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    monitoring.trackFirebaseOperation(operationName, collection || 'unknown', duration, false);
    monitoring.trackError(error as Error, {
      operation: operationName,
      collection,
      duration,
    });

    throw error;
  }
}

// Performance monitoring wrapper for MercadoPago operations
export async function withPaymentMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    monitoring.trackMercadoPagoOperation(operationName, duration, true);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    monitoring.trackMercadoPagoOperation(operationName, duration, false);
    monitoring.trackError(error as Error, {
      operation: operationName,
      paymentProvider: 'mercadopago',
      duration,
    });

    throw error;
  }
}
