import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me/recent-activity
 *
 * Returns up to 6 most recent activity events for the authenticated user:
 *  - Uploads (papers they have uploaded)
 *  - Downloads (papers they have downloaded)
 *  - Bookmarks (papers/notes they have bookmarked)
 *
 * Performance: all 3 primary queries run in parallel via Promise.all.
 * Title resolution is batched into a single IN query instead of two trips.
 *
 * Each event has the shape:
 *   { action: string, title: string, time: string }
 */
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const admin = createAdminClient();

    // ── Fire all 3 queries IN PARALLEL ──────────────────────────────────
    const [uploadsResult, downloadsResult, bookmarksResult] = await Promise.all([
      admin
        .from('papers')
        .select('id, title, created_at')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false })
        .limit(5),

      admin
        .from('resource_downloads')
        .select('resource_id, resource_type, created_at')
        .eq('user_id', user.id)
        .eq('resource_type', 'paper')
        .order('created_at', { ascending: false })
        .limit(5),

      admin
        .from('bookmarks')
        .select('resource_id, resource_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // ── Batch ALL title lookups into one IN query ────────────────────────
    const dlIds = (downloadsResult.data ?? []).map((d: any) => d.resource_id);
    const bkPaperIds = (bookmarksResult.data ?? [])
      .filter((b: any) => b.resource_type === 'paper')
      .map((b: any) => b.resource_id);

    const allNeededIds = [...new Set([...dlIds, ...bkPaperIds])];

    const titleMap: Record<string, string> = {};
    if (allNeededIds.length > 0) {
      const { data: papers } = await admin
        .from('papers')
        .select('id, title')
        .in('id', allNeededIds);
      (papers ?? []).forEach((p: any) => { titleMap[p.id] = p.title; });
    }

    // ── Map each result set to event shape ───────────────────────────────
    const uploadEvents = (uploadsResult.data ?? []).map((u: any) => ({
      action: 'Uploaded',
      title: u.title,
      time: u.created_at,
    }));

    const downloadEvents = (downloadsResult.data ?? []).map((d: any) => ({
      action: 'Downloaded',
      title: titleMap[d.resource_id] ?? 'Unknown Paper',
      time: d.created_at,
    }));

    const bookmarkEvents = (bookmarksResult.data ?? []).map((b: any) => ({
      action: 'Bookmarked',
      title: titleMap[b.resource_id] ?? 'Unknown Resource',
      time: b.created_at,
    }));

    // ── Merge, sort newest-first, take top 6 ─────────────────────────────
    const allEvents = [...uploadEvents, ...downloadEvents, ...bookmarkEvents]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);

    return NextResponse.json({ success: true, data: { activity: allEvents } });
  } catch (err) {
    console.error('[GET /api/me/recent-activity]', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
});
