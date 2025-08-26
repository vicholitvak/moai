import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment and release tracking
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
  
  // Performance monitoring for server
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Server-specific error handling
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Don't send Firebase quota exceeded errors (we can't control these)
    if (error && error.message && error.message.includes('quota exceeded')) {
      return null;
    }
    
    // Filter development-only errors
    if (process.env.NODE_ENV === 'development' && error && (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('MODULE_NOT_FOUND')
    )) {
      return null;
    }
    
    return event;
  },
  
  // Server-specific tags
  initialScope: {
    tags: {
      app: 'moai',
      component: 'server',
      nodeVersion: process.version
    },
  },
  
  // Enhanced server context
  attachStacktrace: true,
  serverName: process.env.SERVER_NAME || 'unknown',
  
  // Integration with Next.js
  integrations: [
    Sentry.httpIntegration(),
    Sentry.nodeProfilingIntegration()
  ],
  
  // Security: only capture from our servers
  allowUrls: [
    /https:\/\/.*\.vercel\.app/,
    /https:\/\/moai-wheat\.vercel\.app/,
  ],
});