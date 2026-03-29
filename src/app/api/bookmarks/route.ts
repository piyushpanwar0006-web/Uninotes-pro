import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/types/api';

const postSchema = z.object({
  resource_type: z.enum(['paper', 'note']),
  resource_id: z.string().uuid('Invalid resource ID'),
});

const getQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * POST /api/bookmarks
 * Adds a new bookmark for the authenticated user.
 */
export const POST = withAuth(async (req: NextRequest, { supabase, user }) => {
  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400, 'VALIDATION_ERROR');
    }

    const { resource_type, resource_id } = parsed.data;

    // Supabase will throw a unique constraint error if it already exists,
    // so we can just insert and catch or use upsert if needed.
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        resource_type,
        resource_id,
      })
      .select('id, resource_type, resource_id, created_at')
      .single();

    if (error) {
      // 23505 is PostgreSQL unique violation code
      if (error.code === '23505') {
        return errorResponse('Bookmark already exists.', 409, 'ALREADY_EXISTS');
      }
      return errorResponse('Failed to create bookmark.', 500, 'DB_ERROR');
    }

    return successResponse(data, 201);
  } catch (err) {
    return errorResponse('Internal server error.', 500);
  }
});

/**
 * GET /api/bookmarks
 * Retrieves the user's bookmarks with pagination.
 */
export const GET = withAuth(async (req: NextRequest, { supabase, user }) => {
  const { searchParams } = new URL(req.url);

  const parsed = getQuerySchema.safeParse({
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 20,
  });

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400, 'VALIDATION_ERROR');
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const { data, error, count } = await supabase
      .from('bookmarks')
      .select('id, resource_type, resource_id, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return errorResponse('Failed to fetch bookmarks.', 500, 'DB_ERROR');
    }

    // Since we only hold the UUID of the resource, we could optionally
    // fetch their metadata or let the client do it.
    // For a complex app, we should use a Postgres view or join with papers/notes.
    // However, for brevity, we can join manually using adminClient if needed,
    // or just return the IDs for now. To keep it fully functional:
    // We'll join papers/notes manually here using a helper or raw data.
    
    // To cleanly resolve the resources, let's fetch paper details for 'paper' bookmarks.
    const paperIds = data.filter((b) => b.resource_type === 'paper').map((b) => b.resource_id);
    let paperDetails: any[] = [];
    
    if (paperIds.length > 0) {
      const adminClient = createAdminClient();
      const { data: pData } = await adminClient
        .from('papers')
        .select(`id, title, description, size_bytes, subjects(branch, name)`)
        .in('id', paperIds);
      paperDetails = pData ?? [];
    }
    
    // Attach details back to the bookmarks
    const enrichedData = data.map((b) => {
      let detail = null;
      if (b.resource_type === 'paper') {
        detail = paperDetails.find((p) => p.id === b.resource_id) || null;
      }
      return { ...b, resource: detail };
    });

    return successResponse({
      bookmarks: enrichedData,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    return errorResponse('Internal server error.', 500);
  }
});
