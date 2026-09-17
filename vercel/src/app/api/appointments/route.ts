import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();

    const body = await request.json();
    const { user_id: claimed, provider_id, date, time, title, notes, custom_text } = body;

    const scopedId = resolveUserScope(user, claimed);
    if (!scopedId) return forbidden();

    if (!date || !time) {
      return NextResponse.json({ error: 'Date and time are required' }, { status: 400 });
    }

    let provider: any = null;
    if (provider_id && UUID_RE.test(String(provider_id))) {
      const { data } = await supabaseAdmin
        .from('providers')
        .select('id, name, hospital, county')
        .eq('id', provider_id)
        .maybeSingle();
      provider = data;
    }

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        user_id: scopedId,
        provider_id: provider?.id ?? null,
        title: title || (provider ? `Appointment with ${provider.name}` : 'Appointment'),
        facility_name: provider?.hospital ?? '',
        facility_location: provider?.county ?? '',
        date,
        time,
        notes: notes || '',
        custom_text: custom_text || '',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('notifications').insert({
      user_id: scopedId,
      title: 'Appointment Requested',
      message: `Your appointment request for ${date} at ${time} has been sent.`,
      type: 'appointment',
      read: false,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const claimed = request.nextUrl.searchParams.get('user_id');
    const user_id = resolveUserScope(user, claimed);
    if (!user_id) return forbidden();

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('user_id', user_id)
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
