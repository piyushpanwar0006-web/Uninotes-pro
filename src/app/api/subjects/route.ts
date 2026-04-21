import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/types/api';
export const dynamic = 'force-dynamic';

const schema = z.object({
  branch: z.string().min(1, 'Branch is required'),
  semester: z.number().int().min(1).max(10),
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().optional(),
});

const querySchema = z.object({
  subjectId: z.string().optional(),
  branch: z.string().optional(),
  semester: z.coerce.number().int().min(1).max(10).optional(),
  name: z.string().optional(),
});

/**
 * GET /api/subjects
 * Retrieves subjects based on provided query parameters.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    subjectId: searchParams.get('subjectId') ?? undefined,
    branch: searchParams.get('branch') ?? undefined,
    semester: searchParams.get('semester') ?? undefined,
    name: searchParams.get('name') ?? undefined,
  });

  if (!parsed.success) {
    return errorResponse('Invalid query parameters', 400, 'VALIDATION_ERROR');
  }

  const { subjectId, branch, semester, name } = parsed.data;

  try {
    const adminClient = createAdminClient();
    let query = adminClient.from('subjects').select('id, branch, semester, name, code');

    if (subjectId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectId);
      if (isUUID) {
        query = query.eq('id', subjectId);
      } else {
        query = query.eq('code', subjectId);
      }
    }
    if (branch) query = query.eq('branch', branch);
    if (semester) query = query.eq('semester', semester);
    if (name) query = query.eq('name', name);

    const { data, error } = await query;
    if (error) {
      console.error('[GET /api/subjects]', error);
      return errorResponse('Database error fetching subjects', 500, 'DB_ERROR');
    }

    return successResponse(data);
  } catch (err) {
    console.error('[GET /api/subjects]', err);
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

/**
 * POST /api/subjects/resolve
 * Looks up a subject by branch + semester + name.
 * If it doesn't exist, creates it (upsert).
 * Returns the subject's UUID so it can be used in uploads.
 * Protected — requires authentication.
 */
export const POST = withAuth(async (req: NextRequest, { supabase }) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.flatten().formErrors[0] ||
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
      'Validation error';
    return errorResponse(firstError, 400, 'VALIDATION_ERROR');
  }

  const { branch, semester, name, code } = parsed.data;

  // Upsert with admin client to bypass RLS (restricted to admins in DB)
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('subjects')
    .upsert(
      { branch, semester, name, code: code ?? null },
      { onConflict: 'branch,semester,name', ignoreDuplicates: false }
    )
    .select('id, branch, semester, name, code')
    .single();

  if (error || !data) {
    return errorResponse(
      `Failed to resolve subject: ${error?.message ?? 'Unknown error'}`,
      500,
      'DB_ERROR'
    );
  }

  return successResponse(data);
});
