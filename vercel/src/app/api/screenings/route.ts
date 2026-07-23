import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profile_id') || '';

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
    const body = await req.json();
    const { patientId, type, result, riskLevel, notes } = body;

    if (!patientId) {
      return NextResponse.json({ message: 'patientId required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('screenings')
      .insert({
        profile_id: patientId,
        verdict: result || 'Pending',
        risk_tier: riskLevel || 'low',
        symptoms: notes || '',
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.rpc('increment_screenings', { uid: patientId });

    return NextResponse.json({ screening: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
