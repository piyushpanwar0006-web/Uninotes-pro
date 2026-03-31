import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/types/api';

const schema = z.object({
  branch: z.string().min(1, 'Branch is required'),
  semester: z.number().int().min(1).max(10),
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().optional(),
});

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

<<<<<<< HEAD
  // Upsert: find existing or create bypassing RLS
=======
  // Upsert with admin client to bypass RLS (restricted to admins in DB)
>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183
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
