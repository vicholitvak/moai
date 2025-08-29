import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment and release tracking
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

  // Performance monitoring for server
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Server-specific error handling
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Don't send Firebase quota exceeded errors (we can't control these)
    if (error && error.message && (
      error.message.includes('quota exceeded') ||
      error.message.includes('exceeded') ||
      error.message.includes('limit')
    )) {
      return null;
    }

    // Filter development-only errors
    if (process.env.NODE_ENV === 'development' && error && (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('MODULE_NOT_FOUND') ||
      error.message.includes('ENOTFOUND')
    )) {
      return null;
    }

    // Filter out MercadoPago API errors
    if (error && error.message && error.message.includes('MercadoPago')) {
      return null;
    }

    return event;
  },

  // Enhanced server context
  beforeSendTransaction(event) {
    // Add API route context
    if (event.transaction && event.transaction.includes('/api/')) {
      event.tags = {
        ...event.tags,
        api_route: 'true',
        method: event.request?.method || 'unknown',
      };
    }
    return event;
  },

  // Server-specific tags
  initialScope: {
    tags: {
      app: 'moai',
      component: 'server',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    contexts: {
      server: {
        hostname: process.env.HOSTNAME || 'unknown',
        region: process.env.VERCEL_REGION || 'unknown',
      },
    },
  },

  // Integration with Next.js
  integrations: [
    Sentry.httpIntegration({
      tracing: true,
    }),
    Sentry.nativeNodeFetchIntegration(),
    Sentry.graphqlIntegration(),
    Sentry.mongoIntegration(),
    Sentry.postgresIntegration(),
    Sentry.redisIntegration(),
    Sentry.prismaIntegration(),
  ],

  // Security: only capture from our servers
  allowUrls: [
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

  // Sampling for performance
  tracesSampler: (samplingContext) => {
    // Sample more for API routes
    if (samplingContext.request?.url?.includes('/api/')) {
      return 0.3;
    }
    // Sample more for checkout and payment routes
    if (samplingContext.request?.url?.includes('/checkout') ||
        samplingContext.request?.url?.includes('/payment')) {
      return 0.5;
    }
    return 0.1;
  },
});