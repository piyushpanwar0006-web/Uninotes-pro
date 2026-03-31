import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/subjects?branch=...&semester=...
 * Public endpoint — no auth required.
 * Returns subjects from the DB optionally filtered by branch and/or semester.
 * Uses the admin client so RLS doesn't block anon reads.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const branch = searchParams.get('branch');
  const semester = searchParams.get('semester');
  const subjectId = searchParams.get('subjectId');

  try {
    const adminClient = createAdminClient();

    let query = adminClient
      .from('subjects')
      .select('id, branch, semester, name, code, created_at')
      .order('semester', { ascending: true })
      .order('name', { ascending: true });

    if (subjectId) query = query.eq('id', subjectId);
    if (branch) query = query.eq('branch', branch);
    if (semester) query = query.eq('semester', Number(semester));

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subjects.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[GET /api/subjects]', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
