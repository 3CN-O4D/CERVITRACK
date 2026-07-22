import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { data: highRiskScreenings } = await supabaseAdmin
      .from('screenings')
      .select('profile_id')
      .eq('risk_tier', 'HIGH');

    const profileIds = [...new Set((highRiskScreenings || []).map((s) => s.profile_id))];

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('id', profileIds);

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
