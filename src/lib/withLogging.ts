import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@/lib/logger';
import { recordRequest } from '@/lib/metrics';
import { captureError } from '@/lib/sentry';

// ============================================================
// withLogging — higher-order function that wraps API handlers
//
// Usage:
//   export const GET = withLogging(handler, '/api/papers');
//   export const POST = withLogging(withAuth(handler), '/api/upload');
//
// What it does automatically:
//   1. Generates a unique requestId per request
//   2. Logs the incoming request (method + endpoint)
//   3. Times the handler execution
//   4. Logs the response (status + durationMs)
//   5. Records metrics (endpoint, status, duration)
//   6. Catches any unhandled exceptions → logs + Sentry
// ============================================================

type RouteHandler = (
  req: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

export function withLogging(handler: RouteHandler, endpointLabel?: string): RouteHandler {
  return async (req: NextRequest, context?: { params?: Record<string, string> }) => {
    const requestId = uuidv4();
    const method = req.method;
    const endpoint = endpointLabel ?? new URL(req.url).pathname;
    const startedAt = Date.now();

    // Attach requestId to headers so it propagates to the response
    log.http(`→ ${method} ${endpoint}`, { requestId, endpoint, method });

    try {
      const response = await handler(req, context);
      const durationMs = Date.now() - startedAt;
      const status = response.status;

      log.http(`← ${method} ${endpoint} ${status}`, {
        requestId,
        endpoint,
        method,
        status,
        durationMs,
      });

      recordRequest(endpoint, status, durationMs);

      // Forward requestId in response headers for client-side correlation
      response.headers.set('X-Request-Id', requestId);
      return response;
    } catch (err) {
      const durationMs = Date.now() - startedAt;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;

      log.error(`✗ ${method} ${endpoint} unhandled exception`, {
        requestId,
        endpoint,
        method,
        durationMs,
        error: errorMessage,
        stack,
      });

      captureError(err, { requestId, endpoint });
      recordRequest(endpoint, 500, durationMs);

      return NextResponse.json(
        { success: false, error: 'Internal server error.', requestId },
        { status: 500, headers: { 'X-Request-Id': requestId } }
      );
    }
  };
}
