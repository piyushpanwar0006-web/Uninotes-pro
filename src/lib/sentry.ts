import * as Sentry from '@sentry/nextjs';

// ============================================================
// Sentry capture helpers
// Wraps the raw SDK to always attach consistent context fields
// ============================================================

export interface SentryContext {
  requestId?: string;
  userId?: string;
  userEmail?: string;
  endpoint?: string;
  errorCode?: string;
  [key: string]: unknown;
}

/**
 * Capture an exception and attach user + request context.
 * Use this in catch blocks instead of bare Sentry.captureException().
 */
export function captureError(error: unknown, ctx: SentryContext = {}) {
  Sentry.withScope((scope: Sentry.Scope) => {
    // Attach user identity so Sentry shows who was affected
    if (ctx.userId || ctx.userEmail) {
      scope.setUser({
        id: ctx.userId,
        email: ctx.userEmail,
      });
    }

    // Tag for filtering in the Sentry dashboard
    if (ctx.endpoint) scope.setTag('endpoint', ctx.endpoint);
    if (ctx.requestId) scope.setTag('requestId', ctx.requestId);
    if (ctx.errorCode) scope.setTag('errorCode', ctx.errorCode);

    // Attach full context as extra data
    scope.setExtras(ctx);

    Sentry.captureException(error);
  });
}

/**
 * Capture a non-fatal message (warning level).
 * Useful for tracking partial failures (e.g. signed URL failed but file saved).
 */
export function captureWarning(message: string, ctx: SentryContext = {}) {
  Sentry.withScope((scope: Sentry.Scope) => {
    if (ctx.userId) scope.setUser({ id: ctx.userId, email: ctx.userEmail });
    if (ctx.endpoint) scope.setTag('endpoint', ctx.endpoint);
    if (ctx.requestId) scope.setTag('requestId', ctx.requestId);
    scope.setExtras(ctx);
    scope.setLevel('warning');
    Sentry.captureMessage(message);
  });
}
