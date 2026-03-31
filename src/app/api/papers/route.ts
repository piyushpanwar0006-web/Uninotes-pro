<<<<<<< HEAD
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/types/api';

const querySchema = z.object({
  subjectId: z.string().uuid('subjectId must be a valid UUID').optional(),
=======
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const querySchema = z.object({
  subjectId: z.string().uuid('subjectId must be a valid UUID').optional(),
  branch: z.string().optional(),
  semester: z.coerce.number().int().min(1).max(10).optional(),
  subject: z.string().optional(),
>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/papers?subjectId=<uuid>&page=1&limit=20
<<<<<<< HEAD
 * Lists ready papers, optionally filtered by subject.
 * Protected — requires authentication.
 */
export const GET = withAuth(async (req: NextRequest, { supabase }) => {
  const { searchParams } = new URL(req.url);

  const subjectIdParam = searchParams.get('subjectId');
  const normalizedSubjectId = (subjectIdParam === 'null' || subjectIdParam === 'undefined') ? undefined : (subjectIdParam ?? undefined);

  const parsed = querySchema.safeParse({
    subjectId: normalizedSubjectId,
=======
 * Public server-side endpoint — uses admin client to bypass RLS.
 * Returns ready papers. Actual file access is gated by the signed-url endpoint (auth required).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  const parsed = querySchema.safeParse({
    subjectId: searchParams.get('subjectId') ?? undefined,
    branch: searchParams.get('branch') ?? undefined,
    semester: searchParams.get('semester') ?? undefined,
    subject: searchParams.get('subject') ?? undefined,
>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 20,
  });

  if (!parsed.success) {
<<<<<<< HEAD
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
=======
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { subjectId, branch, semester, subject, page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const adminClient = createAdminClient();

    // If using branch/semester/subject filtering, we force an inner join
    const doInnerJoin = branch || semester || subject;
    const subjectSelector = doInnerJoin
      ? `subjects!inner( id, branch, semester, name, code )`
      : `subjects( id, branch, semester, name, code )`;

    let query = adminClient
      .from('papers')
      .select(
        `id, title, description, size_bytes, status, created_at,
         ${subjectSelector},
         users ( full_name, avatar_url )`,
        { count: 'exact' }
      )
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (subjectId) query = query.eq('subject_id', subjectId);
    if (branch) query = query.eq('subjects.branch', branch);
    if (semester) query = query.eq('subjects.semester', semester);
    if (subject) query = query.eq('subjects.name', subject);

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/papers]', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch papers.' },
        { status: 500 }
      );
    }

    // Compute average ratings on the fly
    const computedData = (data ?? []).map((paper: any) => {
      return { ...paper, avg_rating: 0, total_ratings: 0 };
    });

    return NextResponse.json({
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
    });
  } catch (err) {
    console.error('[GET /api/papers]', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183
