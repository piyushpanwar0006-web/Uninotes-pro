import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errorResponse } from '@/types/api';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Context injected into protected handlers
// ============================================================
export interface AuthContext {
  user: User;
  supabase: SupabaseClient;
}

// ============================================================
// Protected handler type — receives the parsed request + auth context
// ============================================================
type ProtectedHandler = (
  req: NextRequest,
  context: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

// ============================================================
// withAuth — higher-order function that wraps route handlers
//
// Usage:
//   export const GET = withAuth(async (req, { user, supabase }) => {
//     // user is guaranteed to be authenticated here
//   });
// ============================================================
export function withAuth(handler: ProtectedHandler, requiredRole?: 'admin') {
  return async (
    req: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return errorResponse('Unauthorized. Please log in.', 401, 'UNAUTHORIZED');
      }

      // Optional role check
      if (requiredRole) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profile || profile.role !== requiredRole) {
          return errorResponse('Forbidden. Insufficient permissions.', 403, 'FORBIDDEN');
        }
      }

      return await handler(req, { user, supabase }, context?.params);
    } catch (err) {
      console.error('[withAuth] Unexpected error:', err);
      return errorResponse('Internal server error.', 500, 'INTERNAL_ERROR');
    }
  };
}
