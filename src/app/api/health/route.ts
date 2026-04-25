import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check Database connection
    const adminClient = createAdminClient();
    const { error } = await adminClient.from('papers').select('id').limit(1);
    
    if (error) {
      return NextResponse.json({ status: 'error', message: 'Database connection failed', details: error.message }, { status: 503 });
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
