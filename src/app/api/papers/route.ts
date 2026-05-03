import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { withLogging } from '@/lib/withLogging';
import { log } from '@/lib/logger';
import { captureError } from '@/lib/sentry';
import { redis } from '@/lib/rateLimit';
import { NO_CACHE_HEADERS } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const querySchema = z.object({
  subjectId: z.string().optional(),
  branch: z.string().optional(),
  semester: z.coerce.number().int().min(1).max(10).optional(),
  subject: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Public server-side endpoint — uses admin client to bypass RLS.
 * Returns ready papers. Actual file access is gated by the signed-url endpoint (auth required).
 */
async function handler(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const endpoint = '/api/papers';

  const parsed = querySchema.safeParse({
    subjectId: searchParams.get('subjectId') ?? undefined,
    branch: searchParams.get('branch') ?? undefined,
    semester: searchParams.get('semester') ?? undefined,
    subject: searchParams.get('subject') ?? undefined,
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 20,
  });

  if (!parsed.success) {
    log.warn('GET /api/papers — invalid query params', {
      endpoint,
      error: parsed.error.issues[0].message,
    });
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { subjectId, branch, semester, subject, page, limit } = parsed.data;
  // Cache Logic
  let cacheKey = '';
  try {
    if (redis) {
      // 150ms timeout for getting the version
      const versionResult = await Promise.race([
        redis.get('papers:list:version'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 150))
      ]);
      const version = versionResult || '1';
      cacheKey = `papers:list:v${version}:${subjectId ?? 'all'}:pg${page}`;

      // 150ms timeout for getting the cached data
      const cached = await Promise.race([
        redis.get(cacheKey),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 150))
      ]);
      
      if (cached) {
        log.debug('GET /api/papers — cache hit', { cacheKey });
        return NextResponse.json(cached);
      }
    }
  } catch (cacheErr) {
    log.warn('GET /api/papers — cache read failed (timeout or error)', { error: (cacheErr as Error).message });
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const adminClient = createAdminClient();

    const isUUID = subjectId
      ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectId)
      : false;

    const doInnerJoin = branch || semester || subject || (subjectId && !isUUID);
    const subjectSelector = doInnerJoin
      ? `subjects!inner( id, branch, semester, name, code )`
      : `subjects( id, branch, semester, name, code )`;

    let query = adminClient
      .from('papers')
      .select(
        `id, title, description, size_bytes, created_at, uploaded_by,
         ${subjectSelector},
         users ( full_name )`,
        { count: 'exact' }
      )
      .eq('status', 'ready')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (subjectId) {
      if (isUUID) {
        query = query.eq('subject_id', subjectId);
      } else {
        query = query.eq('subjects.code', subjectId);
      }
    }
    if (branch) query = query.eq('subjects.branch', branch);
    if (semester) query = query.eq('subjects.semester', semester);
    if (subject) query = query.eq('subjects.name', subject);

    const { data, error, count } = await query;

    if (error) {
      log.error('GET /api/papers — DB query failed', {
        endpoint,
        error: error.message,
        stack: error.details,
      });
      captureError(new Error(error.message), { endpoint, errorCode: 'DB_ERROR' });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch papers.' },
        { status: 500 }
      );
    }

    const computedData = (data ?? []).map((paper: any) => {
      return { ...paper, avg_rating: 0, total_ratings: 0 };
    });

    log.debug('GET /api/papers — success', {
      endpoint,
      count: count ?? 0,
      page,
      subjectId,
    });

    const responseBody = {
      success: true,
      data: {
        papers: computedData,
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      },
    };

    // 2. Save to Cache (60 seconds) with timeout protection
    if (redis && cacheKey) {
      try {
        await Promise.race([
          redis.setex(cacheKey, 60, responseBody),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 150))
        ]);
      } catch (cacheErr) {
        log.warn('GET /api/papers — cache write failed', { cacheKey, error: (cacheErr as Error).message });
      }
    }

    const cacheHdrs = NO_CACHE_HEADERS as Record<string, string>;
    const jsonResponse = NextResponse.json(responseBody);
    Object.entries(cacheHdrs).forEach(([k, v]) => jsonResponse.headers.set(k, v));
    return jsonResponse;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;

    log.error('GET /api/papers — unhandled exception', {
      endpoint,
      error: errorMessage,
      stack,
    });
    captureError(err, { endpoint, errorCode: 'INTERNAL_ERROR' });

    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handler, '/api/papers');
