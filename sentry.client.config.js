import * as Sentry from "@sentry/nextjs";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  tracesSampler: (samplingContext) => {
    // Sample more for important routes
    if (samplingContext.request?.url?.includes('/checkout')) {
      return 0.5;
    }
    if (samplingContext.request?.url?.includes('/dashboard')) {
      return 0.3;
    }
    return 0.1;
  },

  // Session replay for debugging
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Error filtering - don't send certain errors
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Filter out common browser extensions errors
    if (error && error.message && (
      error.message.includes('Non-Error promise rejection') ||
      error.message.includes('ResizeObserver loop limit exceeded') ||
      error.message.includes('Script error') ||
      error.message.includes('Extension context invalidated')
    )) {
      return null;
    }

    // Filter out network errors we can't control
    if (error && error.name === 'ChunkLoadError') {
      return null;
    }

    // Filter out MercadoPago SDK errors
    if (error && error.message && error.message.includes('MercadoPago')) {
      return null;
    }

    return event;
  },

  // Enhanced error context
  beforeSendTransaction(event) {
    // Add custom context to transactions
    if (event.transaction) {
      event.tags = {
        ...event.tags,
        transaction_type: event.transaction.includes('/api/') ? 'api' : 'page',
      };
    }
    return event;
  },

  // Custom tags for better error categorization
  initialScope: {
    tags: {
      app: 'moai',
      component: 'client',
      user_agent: navigator.userAgent,
      platform: navigator.platform,
    },
    user: {
      ip_address: '{{auto}}',
    },
  },

  // Integration configuration
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration({
      // Only trace important routes for performance
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
      // Custom sampling for specific routes
      beforeNavigate: (context) => {
        return {
          ...context,
          name: context.name?.replace(/\d+/g, '[id]') || context.name,
        };
      },
    }),
    Sentry.feedbackIntegration({
      colorScheme: 'auto',
      showBranding: false,
    }),
    Sentry.browserProfilingIntegration(),
  ],

  // Security settings
  allowUrls: [
    // Only capture errors from your domain
    /https:\/\/.*\.vercel\.app/,
    /https:\/\/moai-wheat\.vercel\.app/,
    /http:\/\/localhost/,
    /http:\/\/127\.0\.0\.1/,
  ],

  // Performance monitoring settings
  enableTracing: true,
  attachStacktrace: true,

  // Custom instrumentation
  instrumenter: 'otel',

  // Debug settings (only in development)
  debug: process.env.NODE_ENV === 'development',
});