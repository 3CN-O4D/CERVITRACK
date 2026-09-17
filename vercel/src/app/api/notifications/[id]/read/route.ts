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
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('user_id')
      .eq('id', params.id)
      .maybeSingle();
    if (!ownsPatientRow(user, existing?.user_id)) return forbidden();

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(notification, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
