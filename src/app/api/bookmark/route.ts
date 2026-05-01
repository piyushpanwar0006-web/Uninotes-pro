import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/types/api';
export const dynamic = 'force-dynamic';

const toggleSchema = z.object({
  resource_id: z.string().uuid('Invalid resource ID'),
  resource_type: z.enum(['note', 'paper']).default('note'),
});

/**
 * POST /api/bookmark
 * Toggles a bookmark for a note.
 */
export const POST = withAuth(async (req: NextRequest, { supabase, user }) => {
  try {
    const body = await req.json();
    const parsed = toggleSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400, 'VALIDATION_ERROR');
    }

    const { resource_id, resource_type } = parsed.data;

    // Check if the bookmark already exists
    const { data: existing, error: fetchError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('resource_type', resource_type)
      .eq('resource_id', resource_id)
      .maybeSingle();

    if (fetchError) {
      console.error('Bookmark fetch error:', fetchError);
      return errorResponse('Failed to check bookmark status.', 500, 'DB_ERROR');
    }

    if (existing) {
      // Unsave (Delete)
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('Bookmark delete error:', deleteError);
        return errorResponse('Failed to remove bookmark.', 500, 'DB_ERROR');
      }

      return successResponse({ isBookmarked: false }, 200);
    } else {
      // Save (Insert)
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          resource_type: resource_type,
          resource_id: resource_id,
        });

      if (insertError) {
        console.error('Bookmark insert error:', insertError);
        return errorResponse('Failed to add bookmark.', 500, 'DB_ERROR');
      }

      return successResponse({ isBookmarked: true }, 201);
    }
  } catch (err) {
    console.error('Unexpected error toggling bookmark:', err);
    return errorResponse('Internal server error.', 500);
  }
});
