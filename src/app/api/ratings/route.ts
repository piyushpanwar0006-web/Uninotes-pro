import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/types/api';
export const dynamic = 'force-dynamic';

const rateSchema = z.object({
  resource_type: z.enum(['paper', 'note']),
  resource_id: z.string().uuid('Invalid resource ID'),
  score: z.number().int().min(1).max(5, 'Score must be between 1 and 5'),
});

/**
 * POST /api/ratings
 * Rates a resource (paper or note).
 */
export const POST = withAuth(async (req: NextRequest, { supabase, user }) => {
  try {
    const body = await req.json();
    const parsed = rateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400, 'VALIDATION_ERROR');
    }

    const { resource_type, resource_id, score } = parsed.data;

    const { data, error } = await supabase
      .from('ratings')
      .upsert(
        { user_id: user.id, resource_type, resource_id, score },
        { onConflict: 'user_id, resource_type, resource_id', ignoreDuplicates: false }
      )
      .select('id, score, created_at')
      .single();

    if (error) {
      return errorResponse('Failed to submit rating.', 500, 'DB_ERROR');
    }

    return successResponse(data, 201);
  } catch (err) {
    return errorResponse('Internal server error.', 500);
  }
});
