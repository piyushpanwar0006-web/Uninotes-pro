const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr', 'winston'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

// Wrap with Sentry so it instruments all server/edge/client code automatically
module.exports = withSentryConfig(nextConfig, {
  // Sentry organisation + project — fill these in after you create the project
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in CI / production builds
  silent: !process.env.CI,

  // Upload source maps so Sentry shows readable stack traces
  widenClientFileUpload: true,

  // Hides source maps from the client bundle in production
  hideSourceMaps: true,

  // Auto-instrument Next.js server components
  autoInstrumentServerFunctions: true,

  // Disable the Sentry tunnel route (not needed for our setup)
  disableLogger: true,
});
