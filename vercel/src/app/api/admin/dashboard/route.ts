import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: totalUsers },
      { count: screeningsToday },
      { count: screeningsThisWeek },
      { count: screeningsThisMonth },
      { count: highRisk },
      { count: lowRisk },
      { count: positive },
      { count: negative },
      { count: followupsCompleted },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).eq('risk_tier', 'HIGH'),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).eq('risk_tier', 'LOW'),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).eq('verdict', 'positive'),
      supabaseAdmin.from('screenings').select('*', { count: 'exact', head: true }).eq('verdict', 'negative'),
      supabaseAdmin.from('followups').select('*', { count: 'exact', head: true }).eq('completed', true),
    ]);

    const { data: recentScreenings } = await supabaseAdmin
      .from('screenings')
      .select('*, users:user_id(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      screeningsToday: screeningsToday || 0,
      screeningsThisWeek: screeningsThisWeek || 0,
      screeningsThisMonth: screeningsThisMonth || 0,
      riskBreakdown: { high: highRisk || 0, low: lowRisk || 0 },
      verdictBreakdown: { positive: positive || 0, negative: negative || 0 },
      recentScreenings: recentScreenings || [],
      followupsCompleted: followupsCompleted || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
