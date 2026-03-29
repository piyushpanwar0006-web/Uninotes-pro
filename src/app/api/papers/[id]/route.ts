import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/types/api';
import { getSignedUrl, deleteFromStorage } from '@/services/upload';

/**
 * GET /api/papers/[id]
 * Returns paper metadata + a fresh 1-hour signed URL for the PDF.
 * Protected — requires authentication.
 */
export const GET = withAuth(
  async (req: NextRequest, { supabase }, params) => {
    const paperId = params?.id;

    if (!paperId) {
      return errorResponse('Paper ID is required.', 400, 'MISSING_ID');
    }

    const { data: paper, error } = await supabase
      .from('papers')
      .select(
        `id, title, description, size_bytes, status, created_at,
         subjects ( branch, semester, name, code ),
         users ( full_name, avatar_url )`
      )
      .eq('id', paperId)
      .single();

    if (error || !paper) {
      return errorResponse('Paper not found.', 404, 'NOT_FOUND');
    }

    // Generate a fresh signed URL
    const { data: storageData } = await supabase
      .from('papers')
      .select('storage_path')
      .eq('id', paperId)
      .single();

    if (!storageData?.storage_path) {
      return errorResponse('Paper storage path not found.', 500, 'STORAGE_PATH_MISSING');
    }

    const adminClient = createAdminClient();
    const { signedUrl, expiresAt, error: urlError } = await getSignedUrl(
      adminClient,
      storageData.storage_path
    );

    if (urlError) {
      return errorResponse('Failed to generate access URL.', 500, 'SIGNED_URL_ERROR');
    }

    return successResponse({ ...paper, signedUrl, expiresAt });
  }
);

/**
 * DELETE /api/papers/[id]
 * Deletes paper from DB and storage. Owner or admin only.
 * Protected — requires authentication.
 */
export const DELETE = withAuth(
  async (req: NextRequest, { user, supabase }, params) => {
    const paperId = params?.id;

    if (!paperId) {
      return errorResponse('Paper ID is required.', 400, 'MISSING_ID');
    }

    // Fetch paper to check ownership and get storage path
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('id, uploaded_by, storage_path')
      .eq('id', paperId)
      .single();

    if (fetchError || !paper) {
      return errorResponse('Paper not found.', 404, 'NOT_FOUND');
    }

    // Check ownership
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = paper.uploaded_by === user.id;
    const isAdmin = userProfile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(
        'You do not have permission to delete this paper.',
        403,
        'FORBIDDEN'
      );
    }

    // Delete from DB (RLS also enforces this)
    const { error: deleteError } = await supabase
      .from('papers')
      .delete()
      .eq('id', paperId);

    if (deleteError) {
      return errorResponse('Failed to delete paper.', 500, 'DB_ERROR');
    }

    // Delete from storage (admin client to bypass RLS)
    const adminClient = createAdminClient();
    await deleteFromStorage(adminClient, paper.storage_path);

    return successResponse({ message: 'Paper deleted successfully.' });
  }
);
