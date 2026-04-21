import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

/**
 * GET /api/papers/trending
 * Public endpoint to fetch top 10 most downloaded papers in the past 7 days.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // To avoid hitting DB on every load, caching could be added here in Next.js config
  try {
    const adminClient = createAdminClient();

    // The get_trending_papers RPC returns { paper_id, download_count }
    const { data: trendingRaw, error: trendingError } = await adminClient
      .rpc('get_trending_papers', { days: 7, max_limit: 10 });

    if (trendingError) {
      console.error('[GET /api/papers/trending] RPC Error:', trendingError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch trending stats.' },
        { status: 500 }
      );
    }

    if (!trendingRaw || trendingRaw.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Now enrich the data by fetching the actual paper information
    const paperIds = trendingRaw.map((t: any) => t.paper_id);

    const { data: papersData, error: papersError } = await adminClient
      .from('papers')
      .select(
        `id, title, description, size_bytes, status, created_at,
         subjects ( id, branch, semester, name, code ),
         users ( full_name, avatar_url )`
      )
      .in('id', paperIds)
      .eq('status', 'ready');

    if (papersError) {
      console.error('[GET /api/papers/trending] Papers Fetch Error:', papersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch paper metadata.' },
        { status: 500 }
      );
    }

    // Merge everything together and compute average static rating
    const enriched = trendingRaw.map((trend: any) => {
      const paper = (papersData ?? []).find((p: any) => p.id === trend.paper_id);
      if (!paper) return null;

      return {
        ...paper,
        downloads_7d: trend.download_count,
        avg_rating: 0,
        total_ratings: 0,
      };
    }).filter(Boolean); // Clean any nulls (happens if paper was deleted or is not 'ready')

    // Since in(...) doesn't guarantee order, we sort it back by the trending raw order
    enriched.sort((a: any, b: any) => (b.downloads_7d || 0) - (a.downloads_7d || 0));

    return NextResponse.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[GET /api/papers/trending]', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
