import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/types/api';
import { assertEnvVars } from '@/lib/env';
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    assertEnvVars();
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.flatten().formErrors[0] ||
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Validation error';
      return errorResponse(firstError, 400, 'VALIDATION_ERROR');
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Supabase returns the same error for invalid email and wrong password
      // for security — we mirror that behaviour
      return errorResponse(
        'Invalid email or password.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // Fetch extended profile from our users table
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, role, avatar_url')
      .eq('id', data.user.id)
      .single();

    return successResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name ?? data.user.user_metadata?.full_name,
        role: profile?.role ?? 'user',
        avatarUrl: profile?.avatar_url ?? null,
      },
    });
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return errorResponse('Internal server error.', 500, 'INTERNAL_ERROR');
  }
}
