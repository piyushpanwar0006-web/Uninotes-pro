import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture Replay for 10% of all sessions — adjust as needed
  replaysSessionSampleRate: 0.1,

  // Capture Replay for 100% of sessions with errors
  replaysOnErrorSampleRate: 1.0,

  tracesSampleRate: 1.0,

  debug: process.env.NODE_ENV === 'development',

  integrations: [
    Sentry.replayIntegration(),
  ],
});
