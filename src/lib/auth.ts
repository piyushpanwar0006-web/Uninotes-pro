import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errorResponse } from '@/types/api';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { log } from '@/lib/logger';
import { captureError } from '@/lib/sentry';

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
    const endpoint = new URL(req.url).pathname;

    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        log.warn('Unauthorized access attempt', { endpoint, method: req.method });
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
          log.warn('Forbidden: insufficient role', {
            endpoint,
            method: req.method,
            userId: user.id,
            requiredRole,
            actualRole: profile?.role ?? 'none',
          });
          return errorResponse('Forbidden. Insufficient permissions.', 403, 'FORBIDDEN');
        }
      }

      log.debug('Auth OK', { endpoint, method: req.method, userId: user.id });
      return await handler(req, { user, supabase }, context?.params);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;

      log.error('[withAuth] Unexpected error', {
        endpoint,
        method: req.method,
        error: errorMessage,
        stack,
      });

      captureError(err, { endpoint });
      return errorResponse('Internal server error.', 500, 'INTERNAL_ERROR');
    }
  };
}
