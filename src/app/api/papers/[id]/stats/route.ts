import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/types/api';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;
    if (!paperId) {
      return errorResponse('Missing paper ID', 400);
    }

    const supabase = await createClient();

    // 1. Fetch the global stats directly from the papers table
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .select('rating_avg, rating_count, saved_count')
      .eq('id', paperId)
      .maybeSingle();

    if (paperError) {
      console.error('Stats fetch error:', paperError);
      return errorResponse('Failed to fetch stats', 500, 'DB_ERROR');
    }

    if (!paper) {
      return errorResponse('Paper not found', 404, 'NOT_FOUND');
    }

    const stats = {
      avg_rating: paper.rating_avg ?? 0,
      rating_count: paper.rating_count ?? 0,
      saved_count: paper.saved_count ?? 0,
      userRating: 0,
      isBookmarked: false,
    };

    // 2. Fetch user-specific stats if logged in
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const userId = authData.user.id;
      
      const [ratingRes, bookmarkRes] = await Promise.all([
        supabase
          .from('ratings')
          .select('score')
          .eq('user_id', userId)
          .eq('resource_type', 'paper')
          .eq('resource_id', paperId)
          .maybeSingle(),
        supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', userId)
          .eq('resource_type', 'paper')
          .eq('resource_id', paperId)
          .maybeSingle(),
      ]);

      if (ratingRes.data) {
        stats.userRating = ratingRes.data.score;
      }
      if (bookmarkRes.data) {
        stats.isBookmarked = true;
      }
    }

    return successResponse(stats, 200);
  } catch (err) {
    console.error('Unexpected error fetching stats:', err);
    return errorResponse('Internal server error', 500);
  }
}
