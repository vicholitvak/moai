import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay for debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Error filtering - don't send certain errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Filter out common browser extensions errors
    if (error && error.message && (
      error.message.includes('Non-Error promise rejection') ||
      error.message.includes('ResizeObserver loop limit exceeded') ||
      error.message.includes('Script error')
    )) {
      return null;
    }
    
    // Filter out network errors we can't control
    if (error && error.name === 'ChunkLoadError') {
      return null;
    }
    
    return event;
  },
  
  // Custom tags for better error categorization
  initialScope: {
    tags: {
      app: 'moai',
      component: 'client'
    },
  },
  
  // Integration configuration
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration({
      // Only trace important routes for performance
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      )
    })
  ],
  
  // Custom release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
  
  // Enhanced error context
  attachStacktrace: true,
  
  // Security settings
  allowUrls: [
    // Only capture errors from your domain
    /https:\/\/.*\.vercel\.app/,
    /https:\/\/moai-wheat\.vercel\.app/,
    /http:\/\/localhost/,
  ],
});