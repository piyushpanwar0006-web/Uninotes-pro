import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const querySchema = z.object({
  subjectId: z.string().uuid('subjectId must be a valid UUID').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/papers?subjectId=<uuid>&page=1&limit=20
 * Public server-side endpoint — uses admin client to bypass RLS.
 * Returns ready papers. Actual file access is gated by the signed-url endpoint (auth required).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  const parsed = querySchema.safeParse({
    subjectId: searchParams.get('subjectId') ?? undefined,
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { subjectId, page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const adminClient = createAdminClient();

    let query = adminClient
      .from('papers')
      .select(
        `id, title, description, size_bytes, status, created_at,
         subjects ( id, branch, semester, name, code ),
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
      console.error('[GET /api/papers]', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch papers.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        papers: data,
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
