import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const body = await request.json();
    const {
      profile_id, verdict, risk_tier, age, parity, vaccination,
      previous_screening, hiv_status, smoking, symptoms,
      family_history, score,
    } = body;

    const scopedId = resolveUserScope(user, profile_id);
    if (!scopedId) return forbidden();

    const { data: screening, error } = await supabaseAdmin
      .from('screenings')
      .insert({
        profile_id: scopedId,
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
      user_id: scopedId,
      title: 'Screening Completed',
      message: `Your screening result: ${verdict} (Risk: ${risk_tier})`,
      type: 'screening',
      read: false,
    });

    await supabaseAdmin.rpc('increment_screenings', { uid: scopedId });

    return NextResponse.json(screening, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
