import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/types/api';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id;
    if (!noteId) {
      return errorResponse('Missing note ID', 400);
    }

    const supabase = await createClient();

    // 1. Fetch the global stats directly from the notes table
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('rating_avg, rating_count, saved_count')
      .eq('id', noteId)
      .maybeSingle();

    if (noteError) {
      console.error('Stats fetch error:', noteError);
      return errorResponse('Failed to fetch stats', 500, 'DB_ERROR');
    }

    if (!note) {
      return errorResponse('Note not found', 404, 'NOT_FOUND');
    }

    const stats = {
      avg_rating: note.rating_avg ?? 0,
      rating_count: note.rating_count ?? 0,
      saved_count: note.saved_count ?? 0,
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
          .eq('resource_type', 'note')
          .eq('resource_id', noteId)
          .maybeSingle(),
        supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', userId)
          .eq('resource_type', 'note')
          .eq('resource_id', noteId)
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
