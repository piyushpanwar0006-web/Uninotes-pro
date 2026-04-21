import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/types/api';
import { STORAGE_BUCKET, SIGNED_URL_EXPIRES_IN } from '@/types/upload';

/**
 * GET /api/papers/[id]/signed-url
 *
 * PUBLIC — no authentication required.
 * Guests and logged-in users can both view PDFs.
 *
 * Signed URLs are time-limited (1 hour) and generated on-demand from Supabase
 * Storage. There is no security concern in granting guest access to public
 * academic notes via time-limited signed URLs.
 *
 * If the user is authenticated, their download is logged for analytics.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const paperId = params?.id;

  if (!paperId) {
    return errorResponse('Missing paper ID.', 400, 'MISSING_PARAM');
  }

  const adminClient = createAdminClient();

  // Optionally resolve the current user — used only for download logging.
  // This does NOT gate access; failure to get a user is fine.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Non-blocking — guests don't need to be authenticated
  }

  // Look up the paper using admin client (bypasses RLS, always works for guests)
  const { data: paper, error: paperError } = await adminClient
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

  // Generate a fresh signed URL
  const { data: urlData, error: urlError } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(paper.storage_path, SIGNED_URL_EXPIRES_IN);

  if (urlError || !urlData?.signedUrl) {
    return errorResponse('Failed to generate signed URL.', 500, 'SIGNED_URL_ERROR');
  }

  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRES_IN * 1000).toISOString();

  // Log download event for authenticated users (non-blocking, best-effort)
  if (userId) {
    try {
      await adminClient.from('resource_downloads').insert({
        resource_type: 'paper',
        resource_id: paper.id,
        user_id: userId,
      });
    } catch (logError) {
      console.error('[Download Log Error]', logError);
    }
  }

  return successResponse({
    paperId: paper.id,
    title: paper.title,
    signedUrl: urlData.signedUrl,
    expiresAt,
  });
}

