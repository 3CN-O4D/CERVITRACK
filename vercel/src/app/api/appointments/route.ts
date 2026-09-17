import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveClinicianUserId(provider: any): Promise<string | null> {
  const email = provider?.email;
  if (!email) return null;
  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return data?.id ?? null;
}

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
        .select('id, name, email, hospital, county')
        .eq('id', provider_id)
        .maybeSingle();
      provider = data;
    }

    // "Any available" — assign the first approved provider so the request is
    // actually routable instead of dead-ending with a null provider.
    if (!provider) {
      const { data } = await supabaseAdmin
        .from('providers')
        .select('id, name, email, hospital, county')
        .eq('approval_status', 'approved')
        .order('name', { ascending: true })
        .limit(1)
        .maybeSingle();
      provider = data;
    }

    const clinicianUserId = await resolveClinicianUserId(provider);
    const { data: patient } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', scopedId)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        user_id: scopedId,
        clinician_id: clinicianUserId,
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

    if (clinicianUserId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: clinicianUserId,
        title: 'New Appointment Request',
        message: `${patient?.name || 'A patient'} requested an appointment on ${date} at ${time}.`,
        type: 'appointment',
        read: false,
      });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const params = request.nextUrl.searchParams;
    const claimed = params.get('user_id');
    const providerId = params.get('provider_id');

    // Staff viewing appointments assigned to their provider record.
    if (providerId && user.role !== 'patient') {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('provider_id', providerId)
        .order('date', { ascending: false });
      if (error) throw error;
      return NextResponse.json(data, { status: 200 });
    }

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
