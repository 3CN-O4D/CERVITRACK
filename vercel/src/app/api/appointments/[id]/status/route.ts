import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, ownsPatientRow, forbidden } from '@/lib/api-auth';

const VALID_STATUSES = ['upcoming', 'completed', 'cancelled'];

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const body = await request.json();
    const { status } = body;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('appointments')
      .select('user_id')
      .eq('id', params.id)
      .maybeSingle();
    if (!ownsPatientRow(user, existing?.user_id)) return forbidden();

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(appointment, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
