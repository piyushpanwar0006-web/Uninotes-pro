import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';

/**
 * GET /api/me/stats
 * Fetches high-level stats for the authenticated user (total uploads and total downloads received).
 */
export const GET = withAuth(async (req: NextRequest, { supabase, user }) => {
  try {
    const adminClient = createAdminClient();

    // 1. Get total uploads count and fetch all paper IDs belonging to the user
    const { data: userPapers, count, error: countError } = await adminClient
      .from('papers')
      .select('id', { count: 'exact' })
      .eq('uploaded_by', user.id);

    if (countError) {
      console.error('[GET /api/me/stats] Papers Count Error:', countError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch upload stats.' },
        { status: 500 }
      );
    }

    const totalUploads = count ?? 0;
    const paperIds = (userPapers ?? []).map((p: any) => p.id);

    let totalDownloads = 0;

    // 2. Count total downloads across all of their uploaded papers
    if (paperIds.length > 0) {
      const { count: dlCount, error: dlError } = await adminClient
        .from('resource_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('resource_type', 'paper')
        .in('resource_id', paperIds);
      
      if (!dlError) {
        totalDownloads = dlCount ?? 0;
      } else {
        console.error('[GET /api/me/stats] Downloads Count Error:', dlError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUploads,
        totalDownloads,
      },
    });
  } catch (err) {
    console.error('[GET /api/me/stats]', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
});
