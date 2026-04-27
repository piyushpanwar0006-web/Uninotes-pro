import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort:  z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/me/download-history
 *
 * Returns the authenticated user's personal download history
 * from resource_downloads, enriched with paper title + subject.
 *
 * Deduplicated per paper (shows most recent download per paper).
 */
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    page:  searchParams.get('page')  ?? 1,
    limit: searchParams.get('limit') ?? 20,
    sort:  searchParams.get('sort')  ?? 'desc',
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { page, limit, sort } = parsed.data;
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  const admin = createAdminClient();

  // Fetch download rows for this user, latest first
  const { data: dlRows, error: dlError, count } = await admin
    .from('resource_downloads')
    .select('id, resource_id, resource_type, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('resource_type', 'paper')
    .order('created_at', { ascending: sort === 'asc' })
    .range(from, to);

  if (dlError) {
    console.error('[GET /api/me/download-history]', dlError);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch download history.' },
      { status: 500 }
    );
  }

  if (!dlRows || dlRows.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        downloads: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      },
    });
  }

  // Enrich with paper metadata
  const paperIds = [...new Set(dlRows.map((d: any) => d.resource_id))];
  const { data: papers } = await admin
    .from('papers')
    .select('id, title, subjects ( name, branch, semester )')
    .in('id', paperIds);

  const paperMap: Record<string, any> = {};
  (papers ?? []).forEach((p: any) => { paperMap[p.id] = p; });

  const downloads = dlRows.map((d: any) => {
    const paper = paperMap[d.resource_id];
    return {
      id:          d.id,
      paper_id:    d.resource_id,
      title:       paper?.title        ?? 'Unknown',
      subject:     paper?.subjects?.name    ?? '—',
      branch:      paper?.subjects?.branch  ?? '—',
      downloaded_at: d.created_at,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      downloads,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    },
  });
});
