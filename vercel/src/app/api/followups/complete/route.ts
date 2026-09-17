import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, ownsPatientRow, forbidden } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const body = await request.json();
    const { followup_id, notes } = body;

    const { data: existing } = await supabaseAdmin
      .from('followups')
      .select('user_id')
      .eq('id', followup_id)
      .maybeSingle();
    if (!ownsPatientRow(user, existing?.user_id)) return forbidden();

    const { data: followup, error } = await supabaseAdmin
      .from('followups')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        notes,
      })
      .eq('id', followup_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(followup, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
