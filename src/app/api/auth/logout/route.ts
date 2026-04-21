import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/types/api';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return errorResponse('Logout failed. Please try again.', 500, 'LOGOUT_FAILED');
    }

    return successResponse({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('[POST /api/auth/logout]', err);
    return errorResponse('Internal server error.', 500, 'INTERNAL_ERROR');
  }
}
