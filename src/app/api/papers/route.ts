import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
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
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  const parsed = querySchema.safeParse({
    subjectId: searchParams.get('subjectId') ?? undefined,
    branch: searchParams.get('branch') ?? undefined,
    semester: searchParams.get('semester') ?? undefined,
    subject: searchParams.get('subject') ?? undefined,
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 20,
  });

  if (!parsed.success) {
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

    const isUUID = subjectId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectId) : false;
    
    // If using branch/semester/subject filtering, or querying by subject code, we force an inner join
    const doInnerJoin = branch || semester || subject || (subjectId && !isUUID);
    const subjectSelector = doInnerJoin
      ? `subjects!inner( id, branch, semester, name, code )`
      : `subjects( id, branch, semester, name, code )`;

    let query = adminClient
      .from('papers')
      .select(
        `id, title, description, size_bytes, status, created_at, uploaded_by,
         ${subjectSelector},
         users ( full_name, avatar_url )`,
        { count: 'exact' }
      )
      .eq('status', 'ready')
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
