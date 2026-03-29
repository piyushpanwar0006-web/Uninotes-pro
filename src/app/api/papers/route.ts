import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/types/api';

const querySchema = z.object({
  subjectId: z.string().uuid('subjectId must be a valid UUID').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/papers?subjectId=<uuid>&page=1&limit=20
 * Lists ready papers, optionally filtered by subject.
 * Protected — requires authentication.
 */
export const GET = withAuth(async (req: NextRequest, { supabase }) => {
  const { searchParams } = new URL(req.url);

  const subjectIdParam = searchParams.get('subjectId');
  const normalizedSubjectId = (subjectIdParam === 'null' || subjectIdParam === 'undefined') ? undefined : (subjectIdParam ?? undefined);

  const parsed = querySchema.safeParse({
    subjectId: normalizedSubjectId,
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 20,
  });

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400, 'VALIDATION_ERROR');
  }

  const { subjectId, page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('papers')
    .select(
      `id, title, description, size_bytes, status, created_at,
       subjects ( branch, semester, name, code ),
       users ( full_name, avatar_url )`,
      { count: 'exact' }
    )
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (subjectId) {
    query = query.eq('subject_id', subjectId);
  }

  const { data, error, count } = await query;

  if (error) {
    return errorResponse('Failed to fetch papers.', 500, 'DB_ERROR');
  }

  return successResponse({
    papers: data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
});
