import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile
 * Returns the authenticated user's profile row from public.users,
 * merged with email from auth.users (via the Supabase user object).
 */
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('users')
    .select('id, full_name, avatar_url, college, branch, semester, role, created_at')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[GET /api/profile]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...data,
      email: user.email,
    },
  });
});

const updateSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  college:   z.string().max(150).optional(),
  branch:    z.string().max(50).optional(),
  semester:  z.coerce.number().int().min(1).max(10).optional(),
});

/**
 * PUT /api/profile
 * Updates the authenticated user's profile fields.
 * Also syncs full_name to auth.users user_metadata so the Navbar shows it.
 */
export const PUT = withAuth(async (req: NextRequest, { user }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: 'No fields to update.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Update public.users row
  const { data, error } = await admin
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select('id, full_name, avatar_url, college, branch, semester')
    .single();

  if (error) {
    console.error('[PUT /api/profile]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile.' },
      { status: 500 }
    );
  }

  // Sync full_name into auth user_metadata so Navbar picks it up on next session refresh
  if (updates.full_name) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { full_name: updates.full_name },
    });
  }

  return NextResponse.json({ success: true, data });
});
