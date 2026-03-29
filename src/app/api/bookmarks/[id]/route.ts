import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/types/api';

/**
 * DELETE /api/bookmarks/[id]
 * Deletes a specific bookmark for the authenticated user by bookmark ID.
 */
export const DELETE = withAuth(async (req: NextRequest, { supabase, user }, params) => {
  const bookmarkId = params?.id;

  if (!bookmarkId) {
    return errorResponse('Missing bookmark ID.', 400, 'MISSING_PARAM');
  }

  // Attempt to delete it directly (will only succeed if RLS allows, or manually checking ownership)
  // Actually, standard supabase client respects RLS, filtering to the user implicitly. 
  // But just to be explicit:
  const { data, error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse('Bookmark not found or access denied.', 404, 'NOT_FOUND');
    }
    return errorResponse('Failed to delete bookmark.', 500, 'DB_ERROR');
  }

  return successResponse({ deleted: true, id: data.id });
});
