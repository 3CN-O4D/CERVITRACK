import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const body = await request.json();
    const {
      user_id,
      provider_id,
      clinician_id,
      title,
      facility_name,
      facility_location,
      date,
      time,
      notes,
      custom_text,
      status,
    } = body;

    const scopedId = resolveUserScope(user, user_id);
    if (!scopedId) return forbidden();
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
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

    let clinicianUserId: string | null = null;
    if (clinician_id && UUID_RE.test(String(clinician_id))) {
      clinicianUserId = clinician_id;
    } else if (provider?.email) {
      const { data: clinicianUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', provider.email)
        .maybeSingle();
      clinicianUserId = clinicianUser?.id ?? null;
    }

    const allowedStatuses = ['pending', 'upcoming', 'completed', 'cancelled'];
    const appointmentStatus = allowedStatuses.includes(status) ? status : 'upcoming';

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        user_id: scopedId,
        clinician_id: clinicianUserId,
        provider_id: provider?.id ?? null,
        title: title || (provider ? `Appointment with ${provider.name}` : 'Appointment'),
        facility_name: facility_name || provider?.hospital || '',
        facility_location: facility_location || provider?.county || '',
        date,
        time: time || '',
        notes: notes || '',
        custom_text: custom_text || '',
        status: appointmentStatus,
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('notifications').insert({
      user_id: scopedId,
      title: 'Appointment Booked',
      message: `Your appointment${provider ? ` with ${provider.name}` : ''} on ${date}${time ? ` at ${time}` : ''} has been booked.`,
      type: 'appointment',
      read: false,
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
