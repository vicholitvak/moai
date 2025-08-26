import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
  
  // Lower sample rate for edge functions (cost optimization)
  tracesSampleRate: 0.05,
  
  // Edge-specific configuration
  beforeSend(event, hint) {
    // Filter out expected edge runtime limitations
    const error = hint.originalException;
    if (error && error.message && error.message.includes('Dynamic Code Evaluation')) {
      return null;
    }
    
    return event;
  },
  
  // Edge runtime tags
  initialScope: {
    tags: {
      app: 'moai',
      component: 'edge',
      runtime: 'edge'
    },
  },
  
  // Minimal integrations for edge
  integrations: [],
  
  // Security
  allowUrls: [
    /https:\/\/.*\.vercel\.app/,
    /https:\/\/moai-wheat\.vercel\.app/,
  ],
});