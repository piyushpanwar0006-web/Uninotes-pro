import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/me/uploads
 * Fetches the paginated list of papers/notes uploaded by the authenticated user.
 */
export const GET = withAuth(async (req: NextRequest, { supabase, user }) => {
  const { searchParams } = new URL(req.url);

  const parsed = querySchema.safeParse({
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const adminClient = createAdminClient();

    const { data, error, count } = await adminClient
      .from('papers')
      .select(
        `id, title, description, size_bytes, status, created_at,
         subjects ( id, branch, semester, name, code )`,
        { count: 'exact' }
      )
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[GET /api/me/uploads]', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch uploads.' },
        { status: 500 }
      );
    }

    const computedData = (data ?? []).map((paper: any) => {
      return { ...paper, avg_rating: 0, total_ratings: 0 };
    });

    return NextResponse.json({
      success: true,
      data: {
        uploads: computedData,
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      },
    });
  } catch (err) {
    console.error('[GET /api/me/uploads]', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
});
