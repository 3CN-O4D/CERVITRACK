import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, ownsPatientRow, forbidden } from '@/lib/api-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const body = await request.json();
    const { reminder_day, reminder_before } = body;

    const { data: existing } = await supabaseAdmin
      .from('vaccines')
      .select('user_id')
      .eq('id', params.id)
      .maybeSingle();
    if (!ownsPatientRow(user, existing?.user_id)) return forbidden();

    const { data: vaccine, error } = await supabaseAdmin
      .from('vaccines')
      .update({ reminder_day, reminder_before })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(vaccine, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
