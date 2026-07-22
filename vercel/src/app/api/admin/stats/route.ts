import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, county, age')
      .not('county', 'is', null);

    const { data: screenings } = await supabaseAdmin
      .from('screenings')
      .select('profile_id, verdict, risk_tier, created_at, age');

    const { data: vaccines } = await supabaseAdmin
      .from('vaccines')
      .select('user_id');

    const userMap = new Map((users || []).map((u) => [u.id, u]));
    const screeningList = screenings || [];
    const vaccineList = vaccines || [];

    const countyStats: Record<string, any> = {};
    for (const user of users || []) {
      const county = user.county || 'Unknown';
      if (!countyStats[county]) {
        countyStats[county] = { county, patients: 0, screenings: 0, positive: 0, negative: 0, high_risk: 0, low_risk: 0, vaccinated: 0 };
      }
      countyStats[county].patients++;
    }

    for (const s of screeningList) {
      const user = userMap.get(s.profile_id);
      const county = user?.county || 'Unknown';
      if (!countyStats[county]) {
        countyStats[county] = { county, patients: 0, screenings: 0, positive: 0, negative: 0, high_risk: 0, low_risk: 0, vaccinated: 0 };
      }
      countyStats[county].screenings++;
      if (s.verdict === 'positive') countyStats[county].positive++;
      if (s.verdict === 'negative') countyStats[county].negative++;
      if (s.risk_tier === 'HIGH') countyStats[county].high_risk++;
      if (s.risk_tier === 'LOW') countyStats[county].low_risk++;
    }

    for (const v of vaccineList) {
      const user = userMap.get(v.user_id);
      const county = user?.county || 'Unknown';
      if (countyStats[county]) countyStats[county].vaccinated++;
    }

    const ageGroups: Record<string, number> = { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
    for (const s of screeningList) {
      const age = s.age || userMap.get(s.profile_id)?.age || 0;
      if (age >= 18 && age <= 24) ageGroups['18-24']++;
      else if (age >= 25 && age <= 34) ageGroups['25-34']++;
      else if (age >= 35 && age <= 44) ageGroups['35-44']++;
      else if (age >= 45 && age <= 54) ageGroups['45-54']++;
      else if (age >= 55) ageGroups['55+']++;
    }

    const verdictBreakdown: Record<string, number> = {};
    for (const s of screeningList) {
      const v = s.verdict || 'unknown';
      verdictBreakdown[v] = (verdictBreakdown[v] || 0) + 1;
    }

    const riskBreakdown: Record<string, number> = {};
    for (const s of screeningList) {
      const r = s.risk_tier || 'unknown';
      riskBreakdown[r] = (riskBreakdown[r] || 0) + 1;
    }

    const monthlyTrends: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrends[key] = 0;
    }
    for (const s of screeningList) {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthlyTrends) monthlyTrends[key]++;
    }

    const vaccinatedUserIds = new Set(vaccineList.map((v) => v.user_id));
    const countyVaccine: Record<string, { total: number; vaccinated: number }> = {};
    for (const user of users || []) {
      const county = user.county || 'Unknown';
      if (!countyVaccine[county]) countyVaccine[county] = { total: 0, vaccinated: 0 };
      countyVaccine[county].total++;
      if (vaccinatedUserIds.has(user.id)) countyVaccine[county].vaccinated++;
    }

    return NextResponse.json({
      countyStats: Object.values(countyStats),
      ageGroupDistribution: ageGroups,
      verdictBreakdown,
      riskBreakdown,
      monthlyTrends,
      vaccineCoverageByCounty: countyVaccine,
      overallTotals: {
        totalUsers: (users || []).length,
        totalScreenings: screeningList.length,
        totalVaccines: vaccineList.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
