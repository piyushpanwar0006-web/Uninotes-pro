import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/types/api';
import { STORAGE_BUCKET, SIGNED_URL_EXPIRES_IN } from '@/types/upload';

/**
 * GET /api/papers/[id]/signed-url
 * Auth-gated — user must be signed in.
 * Fetches the paper's storage_path and generates a fresh 1-hour signed URL.
 */
export const GET = withAuth(async (req: NextRequest, { supabase, user }, params) => {
  const paperId = params?.id;

  if (!paperId) {
    return errorResponse('Missing paper ID.', 400, 'MISSING_PARAM');
  }

  // Look up the paper's storage path (user client respects RLS — only ready papers)
  const { data: paper, error: paperError } = await supabase
    .from('papers')
    .select('id, storage_path, title, status')
    .eq('id', paperId)
    .single();

  if (paperError || !paper) {
    return errorResponse('Paper not found.', 404, 'NOT_FOUND');
  }

  if (paper.status !== 'ready') {
    return errorResponse('Paper is not ready yet.', 400, 'NOT_READY');
  }

  // Generate a fresh signed URL using the admin client
  const adminClient = createAdminClient();
  const { data: urlData, error: urlError } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(paper.storage_path, SIGNED_URL_EXPIRES_IN);

  if (urlError || !urlData?.signedUrl) {
    return errorResponse('Failed to generate signed URL.', 500, 'SIGNED_URL_ERROR');
  }

  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRES_IN * 1000).toISOString();

  // Async log the download event (no await to keep the request fast)
  adminClient
    .from('resource_downloads')
    .insert({
      resource_type: 'paper',
      resource_id: paper.id,
      user_id: user.id,
    })
    .then(({ error }) => {
      if (error) console.error('[Download Log Error]', error);
    });

  return successResponse({
    paperId: paper.id,
    title: paper.title,
    signedUrl: urlData.signedUrl,
    expiresAt,
  });
});
