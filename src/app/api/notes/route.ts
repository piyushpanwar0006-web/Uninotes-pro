import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';
import { successResponse, errorResponse } from '@/types/api';
import { log } from '@/lib/logger';
import { captureError } from '@/lib/sentry';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  subjectCode: z.string().min(1, 'subjectCode is required'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(['latest', 'popularity']).default('latest'),
});

/**
 * GET /api/notes?subjectCode=SUBJECT_CODE&page=1&limit=10&sortBy=latest
 * Lists notes for a specific subject.
 * Protected — requires authentication.
 */
export const GET = withLogging(
  withAuth(async (req: NextRequest, { user, supabase }) => {
    const { searchParams } = new URL(req.url);
    const endpoint = '/api/notes';

    const parsed = querySchema.safeParse({
      subjectCode: searchParams.get('subjectCode'),
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 10,
      sortBy: searchParams.get('sortBy') ?? 'latest',
    });

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0].message;
      log.warn('GET /api/notes — invalid query params', {
        endpoint,
        userId: user.id,
        error: errorMsg,
      });
      return errorResponse(errorMsg, 400, 'VALIDATION_ERROR');
    }

    const { subjectCode, page, limit, sortBy } = parsed.data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('notes')
      .select(
        `id, title, description, storage_path, size_bytes, status, created_at, downloads,
       subjects!inner ( id, branch, semester, name, code ),
       users ( full_name, avatar_url )`,
        { count: 'exact' }
      )
      .eq('status', 'ready')
      .is('deleted_at', null)
      .eq('subject_code', subjectCode);

    // Sorting
    if (sortBy === 'latest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'popularity') {
      query = query.order('downloads', { ascending: false });
    }

    // Pagination
    const { data, error, count } = await query.range(from, to);

    if (error) {
      log.error('GET /api/notes — DB query failed', {
        endpoint,
        userId: user.id,
        subjectCode,
        error: error.message,
      });
      captureError(new Error(error.message), {
        userId: user.id,
        endpoint,
        errorCode: 'DB_ERROR',
      });
      return errorResponse('Failed to fetch notes.', 500, 'DB_ERROR');
    }

    log.debug('GET /api/notes — success', {
      endpoint,
      userId: user.id,
      subjectCode,
      count: count ?? 0,
      page,
    });

    return successResponse({
      notes: data,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  }),
  '/api/notes'
);
