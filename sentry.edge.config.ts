import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Lower sample rate for edge — it runs on every request
  tracesSampleRate: 0.5,

  debug: process.env.NODE_ENV === 'development',
});
