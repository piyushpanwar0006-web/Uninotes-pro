import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/types/api';
export const dynamic = 'force-dynamic';

/* ────────────────────────────────────────────────
   In-memory rate limiter
   Limits: max 3 OTP requests per phone+IP in 60 s
   (For prod use Upstash Redis instead)
──────────────────────────────────────────────── */
interface RateEntry { count: number; firstAt: number; }
const rateMap = new Map<string, RateEntry>();
const WINDOW_MS = 60_000;   // 60 seconds
const MAX_REQS = 3;         // max 3 OTPs per window

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now - entry.firstAt > WINDOW_MS) {
    rateMap.set(key, { count: 1, firstAt: now });
    return false;
  }

  if (entry.count >= MAX_REQS) return true;
  entry.count++;
  return false;
}

/* ────────────────────────────────────────────────
   Schema
──────────────────────────────────────────────── */
const sendSchema = z.object({
  phone: z.string()
    .min(10, 'Phone number too short')
    .regex(/^\+91[6-9]\d{9}$/, 'Must be a valid Indian mobile number (+91XXXXXXXXXX)'),
  action: z.literal('send'),
});

const verifySchema = z.object({
  phone: z.string().min(10),
  token: z.string().length(6, 'OTP must be 6 digits'),
  action: z.literal('verify'),
});

const bodySchema = z.discriminatedUnion('action', [sendSchema, verifySchema]);

/* ────────────────────────────────────────────────
   POST /api/auth/otp
──────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      const msg =
        parsed.error.flatten().formErrors[0] ||
        Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid request';
      return errorResponse(msg, 400, 'VALIDATION_ERROR');
    }

    const supabase = await createClient();

    /* ── SEND OTP ── */
    if (parsed.data.action === 'send') {
      const { phone } = parsed.data;
      const rateKey = `otp:${ip}:${phone}`;

      if (isRateLimited(rateKey)) {
        return errorResponse(
          'Too many OTP requests. Please wait 60 seconds and try again.',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        console.error('[OTP send error]', error.message);

        // Map Supabase errors to user-friendly messages
        if (error.message.toLowerCase().includes('unsupported phone provider')) {
          return errorResponse(
            'SMS service is not configured. Please contact support.',
            503,
            'SMS_PROVIDER_ERROR'
          );
        }
        if (error.message.toLowerCase().includes('rate limit')) {
          return errorResponse(
            'SMS rate limit exceeded. Please wait a few minutes.',
            429,
            'RATE_LIMIT_EXCEEDED'
          );
        }
        if (error.message.toLowerCase().includes('invalid phone')) {
          return errorResponse(
            'Invalid phone number format.',
            400,
            'INVALID_PHONE'
          );
        }

        return errorResponse('Could not send OTP. Please try again.', 500, 'SMS_SEND_FAILED');
      }

      return successResponse({ message: 'OTP sent successfully' });
    }

    /* ── VERIFY OTP ── */
    if (parsed.data.action === 'verify') {
      const { phone, token } = parsed.data;
      const verifyKey = `verify:${ip}:${phone}`;

      if (isRateLimited(verifyKey)) {
        return errorResponse(
          'Too many verification attempts. Please wait and try again.',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) {
        console.error('[OTP verify error]', error.message);

        if (error.message.toLowerCase().includes('expired')) {
          return errorResponse('OTP has expired. Please request a new one.', 400, 'OTP_EXPIRED');
        }

        return errorResponse('Invalid OTP. Please check and try again.', 400, 'OTP_INVALID');
      }

      return successResponse({ message: 'Verified successfully' });
    }

    return errorResponse('Invalid action', 400, 'INVALID_ACTION');

  } catch (err) {
    console.error('[POST /api/auth/otp]', err);
    return errorResponse('Internal server error.', 500, 'INTERNAL_ERROR');
  }
}
