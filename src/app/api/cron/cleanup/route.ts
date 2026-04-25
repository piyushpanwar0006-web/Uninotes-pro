import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { captureError } from '@/lib/sentry';
import { MaintenanceService } from '@/services/maintenance';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/cleanup?job=reaper|scanner|aggregator|all
 *
 * Consolidated CRON endpoint for system maintenance.
 * Requires Authorization header with Bearer CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  // ── 1. Authenticate CRON request ─────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    log.error('CRON: CRON_SECRET is not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    log.warn('CRON: Unauthorized attempt to run cleanup', { ip: req.ip });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const job = searchParams.get('job') || 'all';

  const results: any = {
    job,
    timestamp: new Date().toISOString(),
    details: {},
  };

  try {
    log.info(`CRON: Starting maintenance job: ${job}`);

    // --- Task 1: The Reaper (Soft-Delete Cleanup) ---
    if (job === 'reaper' || job === 'all') {
      results.details.reaper = await MaintenanceService.processSoftDeletes();
    }

    // --- Task 2: The Scanner (Orphan Cleanup) ---
    // Only run if specifically requested, or optionally included in 'all'
    if (job === 'scanner' || job === 'all') {
      results.details.scanner = await MaintenanceService.cleanupOrphanFiles();
    }

    // --- Task 3: The Aggregator (Analytics) ---
    if (job === 'aggregator' || job === 'all') {
      results.details.aggregator = await MaintenanceService.aggregateAnalytics();
    }

    log.info('CRON: Maintenance completed successfully', { job, results });
    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    log.error('CRON: Maintenance job failed', { job, error: error.message });
    captureError(error, { endpoint: '/api/cron/cleanup', job });
    
    return NextResponse.json(
      { success: false, error: error.message, partialResults: results },
      { status: 500 }
    );
  }
}
