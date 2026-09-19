import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();

    const { id } = await params;
    if (!id || !UUID_RE.test(String(id))) {
      return NextResponse.json({ error: 'Invalid appointment' }, { status: 400 });
    }

    // The caller must be a clinician/provider (not a patient) — this is the
    // provider-facing "Accept & confirm" action, NOT the patient status update.
    if (user.role === 'patient') return forbidden();

    const body = await request.json();
    const { date, time, reminder_phone, message } = body;

    const { data: appt, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !appt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Resolve the caller's provider row (clinician accounts map to providers
    // via their email). Admins and county staff are always allowed to act.
    let ownsAppointment = user.role !== 'patient';
    if (user.role === 'clinician' || user.role === 'doctor' || user.role === 'provider') {
      const { data: providerRow } = await supabaseAdmin
        .from('providers')
        .select('id, email')
        .eq('email', user.email)
        .maybeSingle();
      const { data: staffUser } = await supabaseAdmin
        .from('users')
        .select('county')
        .eq('id', user.userId)
        .maybeSingle();
      ownsAppointment = appt.provider_id === providerRow?.id || !!staffUser?.county;
    }

    const updates: any = {
      status: 'upcoming',
      granted_clinician_id: user.userId,
      updated_at: new Date().toISOString(),
    };
    if (date) updates.date = date;
    if (time) updates.time = time;

    const { error: updErr } = await supabaseAdmin
      .from('appointments')
      .update(updates)
      .eq('id', id);
    if (updErr) throw updErr;

    // Notify the patient that their date/time is confirmed and hand them the
    // clinician's chat contact so they can message with follow-up questions.
    const patientMessage = message ||
      `Your appointment has been accepted for ${date || appt.date} at ${time || appt.time}. Your clinician will reach out by phone (${reminder_phone || appt.reminder_phone || 'your phone on file'}).`;
    await supabaseAdmin.from('notifications').insert({
      user_id: appt.user_id,
      title: 'Appointment Accepted',
      message: patientMessage,
      type: 'appointment',
      read: false,
      action_url: `/patient/messages`,
    });

    // Attach the clinician's chat contact to the patient so the conversation
    // thread is discoverable in their messages screen.
    const { error: contactErr } = await supabaseAdmin
      .from('chat_contacts')
      .upsert({
        user_id: appt.user_id,
        contact_id: user.userId,
        provider_id: appt.provider_id,
        last_message: `Appointment confirmed for ${date || appt.date}`,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,contact_id' });
    if (contactErr) {
      console.warn('chat contact upsert failed', contactErr.message);
    }

    // Store any phone/reminder details provided during acceptance.
    if (reminder_phone) {
      await supabaseAdmin
        .from('appointments')
        .update({ reminder_phone })
        .eq('id', id);
    }

    return NextResponse.json({ ok: true, status: 'upcoming' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
