/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Allow images from the local Firebase Storage emulator
        protocol: "http",
        hostname: "localhost",
        port: "9199",
      },
      {
        // Allow images from your production Firebase Storage
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  webpack: (config, { webpack }) => {
    // This configuration is needed to resolve issues with dependencies from the Genkit AI toolkit.
    // These libraries use optional, dynamic imports that Webpack cannot resolve by default.

    // 1. Ignore optional dependencies that are not installed.
    // This prevents "Module not found" errors for '@opentelemetry/exporter-jaeger' and '@genkit-ai/firebase'.
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /^@opentelemetry\/exporter-jaeger$/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /^@genkit-ai\/firebase$/ })
    );

    // 2. Alias 'handlebars' to a browser-friendly version.
    // This resolves the "require.extensions is not supported" error.
    config.resolve.alias.handlebars = 'handlebars/dist/handlebars.js';

    return config;
  },
};

export default nextConfig;