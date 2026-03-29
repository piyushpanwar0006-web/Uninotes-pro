import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/types/api';

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile from the `users` table.
 * Protected — requires a valid session.
 */
export const GET = withAuth(async (req: NextRequest, { user, supabase }) => {
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, full_name, role, avatar_url, created_at')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return errorResponse('User profile not found.', 404, 'PROFILE_NOT_FOUND');
  }

  return successResponse({
    id: profile.id,
    email: user.email,
    fullName: profile.full_name,
    role: profile.role,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
  });
});
