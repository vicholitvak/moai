import { useEffect, useCallback } from 'react';
import { monitoring } from '@/lib/services/monitoringService';
import { useAuth } from '@/context/AuthContext';

export const useMonitoring = () => {
  const { user, role } = useAuth();

  // Update user context when user changes
  useEffect(() => {
    if (user) {
      monitoring.setTag('user_role', role || 'client');
      monitoring.setContext('user', {
        id: user.uid,
        email: user.email,
        role: role,
      });
    }
  }, [user, role]);

  // Track page views
  const trackPageView = useCallback((pageName: string) => {
    monitoring.trackUserAction('page_view', pageName, {
      page: pageName,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Track button clicks
  const trackButtonClick = useCallback((buttonName: string, metadata?: Record<string, any>) => {
    monitoring.trackUserAction('button_click', buttonName, {
      button: buttonName,
      ...metadata,
    });
  }, []);

  // Track form submissions
  const trackFormSubmit = useCallback((formName: string, success: boolean, metadata?: Record<string, any>) => {
    monitoring.trackUserAction('form_submit', formName, {
      form: formName,
      success,
      ...metadata,
    });
  }, []);

  // Track API calls with timing
  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<T> => {
    const startTime = Date.now();

    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;

      monitoring.trackApiCall(endpoint, method, duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.trackApiCall(endpoint, method, duration, false);

      // Re-throw the error
      throw error;
    }
  }, []);

  // Track performance metrics
  const trackPerformance = useCallback((
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' = 'ms',
    tags?: Record<string, string>
  ) => {
    monitoring.trackPerformance({
      name,
      value,
      unit,
      tags,
    });
  }, []);

  // Track errors
  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    monitoring.trackError(error, context);
  }, []);

  // Track custom events
  const trackEvent = useCallback((
    category: 'user_action' | 'api_call' | 'payment' | 'order' | 'error',
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    monitoring.trackEvent({
      category,
      action,
      label,
      value,
      metadata,
    });
  }, []);

  return {
    trackPageView,
    trackButtonClick,
    trackFormSubmit,
    trackApiCall,
    trackPerformance,
    trackError,
    trackEvent,
  };
};
