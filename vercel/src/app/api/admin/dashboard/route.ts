import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: totalUsers },
      { count: screeningsToday },
      { count: screeningsWeek },
      { count: screeningsMonth },
      { count: highRisk },
      { count: hpvPositive },
      { count: followupsCompleted },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).in('risk_tier', ['high', 'critical']),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).ilike('verdict', '%positive%'),
      supabaseAdmin.from('followups').select('*', { count: 'exact', head: true }).eq('completed', true),
    ]);

    const { data: recentScreenings } = await supabaseAdmin
      .from('screenings')
      .select('id, verdict, risk_tier, created_at, profile_id, users:profile_id(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    const formatted = (recentScreenings || []).map((s: any) => ({
      id: s.id,
      user_name: s.users?.name || 'Unknown',
      verdict: s.verdict || '',
      risk_tier: s.risk_tier || 'low',
      created_at: s.created_at,
    }));

    return NextResponse.json({
      total_users: totalUsers || 0,
      screenings_today: screeningsToday || 0,
      screenings_week: screeningsWeek || 0,
      screenings_month: screeningsMonth || 0,
      high_risk_alerts: highRisk || 0,
      hpv_positive: hpvPositive || 0,
      followups_completed: followupsCompleted || 0,
      recent_screenings: formatted,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
