import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['source.unsplash.com', 'images.unsplash.com'],
  },
  // Sentry configuration
  sentry: {
    hideSourceMaps: true,
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: '/monitoring',
  },
  // Performance monitoring
  experimental: {
    instrumentationHook: true,
  },
  // Environment variables for Sentry
  env: {
    SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_ENVIRONMENT: process.env.NODE_ENV,
    SENTRY_RELEASE: process.env.NEXT_PUBLIC_APP_VERSION,
  },
};

export default nextConfig;
