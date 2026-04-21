import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/types/api';
import { assertEnvVars } from '@/lib/env';
export const dynamic = 'force-dynamic';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
});

export async function POST(req: NextRequest) {
  try {
    assertEnvVars();
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.flatten().formErrors[0] ||
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Validation error';
      return errorResponse(firstError, 400, 'VALIDATION_ERROR');
    }

    const { email, password, fullName } = parsed.data;
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return errorResponse('This email is already registered.', 409, 'EMAIL_EXISTS');
      }
      return errorResponse(error.message, 400, 'SIGNUP_FAILED');
    }

    return successResponse(
      {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          fullName,
        },
        message: 'Account created. Please check your email to confirm your account.',
      },
      201
    );
  } catch (err) {
    console.error('[POST /api/auth/signup]', err);
    return errorResponse('Internal server error.', 500, 'INTERNAL_ERROR');
  }
}
