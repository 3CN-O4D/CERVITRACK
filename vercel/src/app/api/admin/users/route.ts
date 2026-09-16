import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const county = request.nextUrl.searchParams.get('county');
    let query = supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });
    if (county) query = query.eq('county', county);
    const { data: users, error } = await query;

    if (error) throw error;

    const result = [];
    for (const user of users || []) {
      const { data: latest } = await supabaseAdmin
        .from('screenings')
        .select('verdict, risk_tier, created_at')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      result.push({ ...user, latest_screening: latest || null });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
