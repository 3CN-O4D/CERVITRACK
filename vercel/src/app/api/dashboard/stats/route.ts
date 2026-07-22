import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [registered, screenings, hpvPositive, riskAlerts, screeningsToday, screeningsThisWeek, screeningsThisMonth, followupsCompleted] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('screenings').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('screenings').select('id', { count: 'exact', head: true }).eq('verdict', 'Positive'),
      supabaseAdmin.from('screenings').select('id', { count: 'exact', head: true }).eq('risk_tier', 'High'),
      supabaseAdmin.from('screenings').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabaseAdmin.from('screenings').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabaseAdmin.from('screenings').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabaseAdmin.from('followups').select('id', { count: 'exact', head: true }).eq('completed', true),
    ]);

    return NextResponse.json({
      registered: registered.count || 0,
      screenings: screenings.count || 0,
      hpvPositive: hpvPositive.count || 0,
      riskAlerts: riskAlerts.count || 0,
      screeningsToday: screeningsToday.count || 0,
      screeningsThisWeek: screeningsThisWeek.count || 0,
      screeningsThisMonth: screeningsThisMonth.count || 0,
      followupsCompleted: followupsCompleted.count || 0,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
