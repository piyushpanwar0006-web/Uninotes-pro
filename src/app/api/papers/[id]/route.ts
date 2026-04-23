import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/types/api';
import { STORAGE_BUCKET } from '@/types/upload';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * DELETE /api/papers/[id]
 *
 * ROLE-BASED ACCESS CONTROL (enforced by this handler, not RLS):
 * - Admin  → can delete ANY paper
 * - User   → can delete ONLY papers they uploaded
 *
 * The service-role admin client is used for ALL Supabase operations
 * so that RLS never interferes with the delete flow.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  const paperId = params?.id;

  if (!paperId) {
    return errorResponse('Paper ID is required.', 400, 'MISSING_ID');
  }

  // ── Step 1: Authenticate via server-side cookie ───────────────────────────
  let userId: string;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return errorResponse('Unauthorized. Please sign in.', 401, 'UNAUTHORIZED');
    }
    userId = user.id;
  } catch (e) {
    console.error('[DELETE] Auth error:', e);
    return errorResponse('Authentication failed.', 401, 'AUTH_ERROR');
  }

  // ── Step 2: All DB operations use service-role client (bypasses RLS) ──────
  const admin = createAdminClient();

  // ── Step 3: Fetch paper metadata ──────────────────────────────────────────
  // Use maybeSingle() instead of single() so we get null (not an error) when not found
  const { data: paper, error: fetchErr } = await admin
    .from('papers')
    .select('id, uploaded_by, storage_path')
    .eq('id', paperId)
    .maybeSingle();

  if (fetchErr) {
    console.error('[DELETE] Fetch error:', JSON.stringify(fetchErr));
    return errorResponse(`Database error: ${fetchErr.message}`, 500, 'DB_FETCH_ERROR');
  }

  if (!paper) {
    // Paper already deleted or ID is wrong — treat as success for idempotency
    console.warn(`[DELETE] Paper ${paperId} not found — may already be deleted`);
    return successResponse({ message: 'Paper already removed.', id: paperId });
  }

  // ── Step 4: Authorization check ───────────────────────────────────────────
  const { data: profile, error: profileErr } = await admin
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr) {
    console.error('[DELETE] Profile fetch error:', JSON.stringify(profileErr));
    return errorResponse('Could not verify user permissions.', 500, 'PROFILE_ERROR');
  }

  const isAdmin = profile?.role === 'admin';
  const isOwner = paper.uploaded_by === userId;

  if (!isAdmin && !isOwner) {
    console.warn(`[DELETE] User ${userId} attempted unauthorized delete of paper ${paperId}`);
    return errorResponse('You do not have permission to delete this note.', 403, 'FORBIDDEN');
  }

  // ── Step 5: Delete from Storage FIRST (non-blocking on failure) ──────────
  if (paper.storage_path) {
    try {
      const { error: storageErr } = await admin.storage
        .from(STORAGE_BUCKET)
        .remove([paper.storage_path]);

      if (storageErr) {
        // Log but continue — the storage file may already be gone
        console.warn(`[DELETE] Storage removal warning for ${paper.storage_path}:`, storageErr.message);
      } else {
        console.log(`[DELETE] Storage file removed: ${paper.storage_path}`);
      }
    } catch (ex) {
      console.warn('[DELETE] Storage exception (non-fatal):', ex);
    }
  }

  // ── Step 6: Delete from Database ─────────────────────────────────────────
  const { data: deletedRow, error: dbErr } = await admin
    .from('papers')
    .delete()
    .eq('id', paperId)
    .select()
    .maybeSingle();

  if (dbErr) {
    console.error('[DELETE] DB delete error:', JSON.stringify(dbErr));
    return errorResponse(
      `Failed to delete from database: ${dbErr.message}`,
      500,
      'DB_DELETE_ERROR'
    );
  }

  if (!deletedRow) {
    console.error(`[DELETE] DB delete silently failed for paper ${paperId}. RLS or constraint issue?`);
    return errorResponse(
      'Database deletion failed. The record could not be removed.',
      500,
      'DB_DELETE_SILENT_FAILURE'
    );
  }

  console.log(`[DELETE] Paper ${paperId} deleted by ${userId} (role: ${isAdmin ? 'admin' : 'user'})`);

  return successResponse({ message: 'Paper deleted successfully.', id: paperId });
}

/**
 * GET /api/papers/[id]
 * Returns paper metadata. Requires authentication.
 * Not used by the main notes list (which uses /api/papers), but kept for
 * direct paper lookups.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  const paperId = params?.id;
  if (!paperId) return errorResponse('Paper ID is required.', 400, 'MISSING_ID');

  const admin = createAdminClient();
  const { data: paper, error } = await admin
    .from('papers')
    .select('id, title, description, size_bytes, status, created_at, subjects ( branch, semester, name, code ), users ( full_name, avatar_url )')
    .eq('id', paperId)
    .maybeSingle();

  if (error) return errorResponse(`Database error: ${error.message}`, 500, 'DB_ERROR');
  if (!paper) return errorResponse('Paper not found.', 404, 'NOT_FOUND');

  return successResponse(paper);
}
