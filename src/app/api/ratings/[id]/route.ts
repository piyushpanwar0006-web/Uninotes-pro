import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/types/api';
export const dynamic = 'force-dynamic';

const updateRateSchema = z.object({
  score: z.number().int().min(1).max(5, 'Score must be between 1 and 5'),
});

/**
 * PUT /api/ratings/[id]
 * Updates a specific rating by ID.
 */
export const PUT = withAuth(async (req: NextRequest, { supabase, user }, params) => {
  const ratingId = params?.id;

  if (!ratingId) {
    return errorResponse('Missing rating ID.', 400, 'MISSING_PARAM');
  }

  try {
    const body = await req.json();
    const parsed = updateRateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400, 'VALIDATION_ERROR');
    }

    const { score } = parsed.data;

    // Direct update with Row-Level filtering by user.id
    const { data, error } = await supabase
      .from('ratings')
      .update({ score })
      .eq('id', ratingId)
      .eq('user_id', user.id)
      .select('id, score, updated_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Rating not found or access denied.', 404, 'NOT_FOUND');
      }
      return errorResponse('Failed to update rating.', 500, 'DB_ERROR');
    }

    return successResponse(data);
  } catch (err) {
    return errorResponse('Internal server error.', 500);
  }
});
