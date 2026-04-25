import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getMetrics } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/metrics
 *
 * Protected endpoint — requires a logged-in admin user.
 * Returns a live snapshot of:
 *   - API request counts, error rates, avg response times per endpoint
 *   - Upload success/failure counts
 *   - Delete success/failure counts
 *
 * Example response:
 * {
 *   "startedAt": "2026-04-26T00:00:00.000Z",
 *   "endpoints": {
 *     "/api/upload": { "totalRequests": 10, "totalErrors": 1, "avgDurationMs": 342, "errorRate": "10.00%" },
 *     "/api/papers": { "totalRequests": 50, "totalErrors": 0, "avgDurationMs": 85, "errorRate": "0.00%" }
 *   },
 *   "uploads": { "attempts": 10, "successes": 9, "failures": 1, "successRate": "90.00%" },
 *   "deletes": { "attempts": 3, "successes": 3, "failures": 0, "successRate": "100.00%" }
 * }
 */
export const GET = withAuth(
  async (_req: NextRequest, { user: _user }) => {
    const snapshot = getMetrics();
    return NextResponse.json({ success: true, data: snapshot });
  },
  'admin'
);
