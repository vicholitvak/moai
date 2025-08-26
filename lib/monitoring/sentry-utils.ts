import * as Sentry from '@sentry/nextjs'

/**
 * Enhanced error reporting utility for Moai app
 */
export class MoaiErrorReporter {
  /**
   * Report order-related errors with context
   */
  static reportOrderError(error: Error, orderId: string, context: Record<string, any> = {}) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'order')
      scope.setTag('order_id', orderId)
      scope.setContext('order_context', {
        orderId,
        ...context
      })
      Sentry.captureException(error)
    })
  }

  /**
   * Report payment-related errors
   */
  static reportPaymentError(error: Error, paymentData: Record<string, any> = {}) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'payment')
      scope.setTag('payment_method', paymentData.method || 'unknown')
      
      // Remove sensitive payment data but keep important context
      const safePa ymentData = {
        method: paymentData.method,
        amount: paymentData.amount,
        currency: paymentData.currency,
        orderId: paymentData.orderId,
        // Don't include card numbers, tokens, etc.
      }
      
      scope.setContext('payment_context', safePaymentData)
      Sentry.captureException(error)
    })
  }

  /**
   * Report Firebase/database errors
   */
  static reportDatabaseError(error: Error, operation: string, collection?: string) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'database')
      scope.setTag('db_operation', operation)
      if (collection) scope.setTag('db_collection', collection)
      
      scope.setContext('database_context', {
        operation,
        collection,
        timestamp: new Date().toISOString()
      })
      
      Sentry.captureException(error)
    })
  }

  /**
   * Report user authentication errors
   */
  static reportAuthError(error: Error, userId?: string, action?: string) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'auth')
      if (action) scope.setTag('auth_action', action)
      
      scope.setContext('auth_context', {
        userId: userId || 'unknown',
        action: action || 'unknown',
        timestamp: new Date().toISOString()
      })
      
      Sentry.captureException(error)
    })
  }

  /**
   * Report GPS/location errors
   */
  static reportLocationError(error: Error, context: Record<string, any> = {}) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'location')
      scope.setContext('location_context', {
        ...context,
        timestamp: new Date().toISOString()
      })
      
      Sentry.captureException(error)
    })
  }

  /**
   * Report performance issues
   */
  static reportPerformanceIssue(metricName: string, value: number, threshold: number, context: Record<string, any> = {}) {
    if (value > threshold) {
      Sentry.withScope((scope) => {
        scope.setTag('issue_type', 'performance')
        scope.setTag('metric_name', metricName)
        
        scope.setContext('performance_context', {
          metric: metricName,
          value,
          threshold,
          exceedsBy: value - threshold,
          ...context
        })
        
        Sentry.captureMessage(`Performance threshold exceeded: ${metricName}`, 'warning')
      })
    }
  }

  /**
   * Report critical business logic errors
   */
  static reportBusinessLogicError(error: Error, businessFlow: string, context: Record<string, any> = {}) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'business_logic')
      scope.setTag('business_flow', businessFlow)
      scope.setLevel('error')
      
      scope.setContext('business_context', {
        flow: businessFlow,
        ...context,
        timestamp: new Date().toISOString()
      })
      
      Sentry.captureException(error)
    })
  }

  /**
   * Set user context for better error tracking
   */
  static setUserContext(userId: string, email: string, role: string) {
    Sentry.setUser({
      id: userId,
      email,
      role
    })
    
    Sentry.setTag('user_role', role)
  }

  /**
   * Clear user context (on logout)
   */
  static clearUserContext() {
    Sentry.setUser(null)
  }

  /**
   * Add breadcrumb for user actions
   */
  static addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      timestamp: Date.now() / 1000,
      level: 'info'
    })
  }

  /**
   * Start transaction for performance monitoring
   */
  static startTransaction(name: string, operation: string) {
    return Sentry.startTransaction({
      name,
      op: operation
    })
  }
}

/**
 * Decorator for automatic error reporting in async functions
 */
export function withErrorReporting<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorType: string = 'unknown'
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('error_type', errorType)
        scope.setContext('function_context', {
          functionName: fn.name,
          arguments: args.length,
          timestamp: new Date().toISOString()
        })
        
        if (error instanceof Error) {
          Sentry.captureException(error)
        } else {
          Sentry.captureMessage(`Unknown error in ${fn.name}: ${String(error)}`, 'error')
        }
      })
      
      throw error
    }
  }) as T
}

/**
 * Hook for React components to report errors
 */
export function useSentryErrorBoundary() {
  return (error: Error, componentStack: string) => {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'react_error_boundary')
      scope.setContext('react_context', {
        componentStack,
        timestamp: new Date().toISOString()
      })
      
      Sentry.captureException(error)
    })
  }
}