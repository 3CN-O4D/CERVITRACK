import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { admin_id, user_id, type } = await request.json();

    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userErr) throw userErr;

    const { data: screenings } = await supabaseAdmin
      .from('screenings')
      .select('*')
      .eq('profile_id', user_id)
      .order('created_at', { ascending: false });

    let content = `CERVICAL HEALTH REPORT\n`;
    content += `Patient: ${user.name}\n`;
    content += `Patient ID: ${user.patient_id || 'N/A'}\n`;
    content += `Generated: ${new Date().toISOString()}\n`;
    content += `\n--- SCREENING HISTORY ---\n`;

    for (const s of screenings || []) {
      content += `\nDate: ${s.created_at}\n`;
      content += `Verdict: ${s.verdict}\n`;
      content += `Risk Tier: ${s.risk_tier}\n`;
      content += `HPV: ${s.hpv_result || 'N/A'} | Cytology: ${s.cytology_result || 'N/A'}\n`;
    }

    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert({
        admin_id,
        user_id,
        type: type || 'screening',
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
