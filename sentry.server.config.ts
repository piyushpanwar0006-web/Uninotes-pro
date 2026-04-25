import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Enable this in development to see all errors in Sentry
  debug: process.env.NODE_ENV === 'development',

  // Performance profiling
  profilesSampleRate: 1.0,
});
