import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profile_id, verdict, risk_tier, age, parity, vaccination,
      previous_screening, hiv_status, smoking, symptoms,
      family_history, score,
    } = body;

    const { data: screening, error } = await supabaseAdmin
      .from('screenings')
      .insert({
        profile_id,
        verdict,
        risk_tier,
        age,
        parity,
        vaccination,
        previous_screening,
        hiv_status,
        smoking,
        symptoms,
        family_history,
        score,
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('notifications').insert({
      user_id: profile_id,
      title: 'Screening Completed',
      message: `Your screening result: ${verdict} (Risk: ${risk_tier})`,
      type: 'screening',
      read: false,
    });

    await supabaseAdmin.rpc('increment_screenings', { uid: profile_id });

    return NextResponse.json(screening, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
