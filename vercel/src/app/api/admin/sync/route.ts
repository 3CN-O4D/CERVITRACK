import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const [{ count: total_users }, { count: total_screenings }, { count: total_vaccines }] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('vaccines').select('*', { count: 'exact', head: true }),
    ]);

    const { data: users } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      users: users || [],
      total_users: total_users || 0,
      total_screenings: total_screenings || 0,
      total_vaccines: total_vaccines || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
