import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) return forbidden();
    const { searchParams } = new URL(req.url);
    const claimed = searchParams.get('profile_id');
    const profileId = resolveUserScope(user, claimed);
    if (!profileId) return forbidden();

    let q = supabaseAdmin
      .from('screenings')
      .select('*, users:profile_id(name, email)')
      .order('created_at', { ascending: false });

    if (profileId) {
      q = q.eq('profile_id', profileId);
    }

    const { data, error } = await q;
    if (error) throw error;

    const screenings = (data || []).map((s: any) => ({
      ...s,
      patient_name: s.users?.name || '',
      patient_email: s.users?.email || '',
      screening_type: s.verdict || '',
      screening_date: s.created_at,
      risk_level: s.risk_tier || '',
      notes: s.symptoms || '',
    }));

    return NextResponse.json({ screenings });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message, screenings: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) return forbidden();
    const body = await req.json();
    const { patientId, type, result, riskLevel, notes } = body;

    const scopedId = resolveUserScope(user, patientId);
    if (!scopedId) return forbidden();

    const { data, error } = await supabaseAdmin
      .from('screenings')
      .insert({
        profile_id: scopedId,
        verdict: result || 'Pending',
        risk_tier: riskLevel || 'low',
        symptoms: notes || '',
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.rpc('increment_screenings', { uid: scopedId });

    return NextResponse.json({ screening: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
