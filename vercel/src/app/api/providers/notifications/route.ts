import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireRole, forbidden } from '@/lib/api-auth';

const STAFF_ROLES = [
  'clinician', 'officer', 'county_officer', 'lab_staff', 'admin', 'super_admin', 'staff',
];

export async function GET(request: NextRequest) {
  try {
    const staff = await requireRole(request, STAFF_ROLES);
    if (!staff) return forbidden();
    const provider_id = staff.userId;

    const notifications: any[] = [];

    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('id, title, date, time, status, user_id, custom_text')
      .eq('provider_id', provider_id)
      .eq('status', 'pending')
      .order('date', { ascending: true });

    for (const appt of appointments || []) {
      const { data: patient } = await supabaseAdmin
        .from('users').select('name').eq('id', appt.user_id).single();
      notifications.push({
        id: `appt_${appt.id}`,
        type: 'appointment_request',
        title: 'Appointment Request',
        message: `${patient?.name || 'Patient'} requests "${appt.title}" on ${appt.date}`,
        date: appt.date,
        read: false,
        action_url: '/clinician/appointments',
      });
    }

    const { data: upcomingAppts } = await supabaseAdmin
      .from('appointments')
      .select('id, title, date, time, status, user_id')
      .eq('provider_id', provider_id)
      .eq('status', 'upcoming')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(5);

    for (const appt of upcomingAppts || []) {
      const { data: patient } = await supabaseAdmin
        .from('users').select('name').eq('id', appt.user_id).single();
      notifications.push({
        id: `upcoming_${appt.id}`,
        type: 'upcoming_appointment',
        title: 'Upcoming Appointment',
        message: `${patient?.name || 'Patient'} — ${appt.title} on ${appt.date} ${appt.time || ''}`,
        date: appt.date,
        read: false,
        action_url: '/clinician/appointments',
      });
    }

    const { data: granted } = await supabaseAdmin
      .from('consent_grants')
      .select('patient_id')
      .eq('staff_id', provider_id)
      .eq('status', 'granted');
    const patientScope = (granted || []).map((g) => g.patient_id);

    if (patientScope.length > 0) {
      const { data: unreadConvos } = await supabaseAdmin
        .from('chat_conversations')
        .select('id, contact_name, last_message, unread')
        .in('user_id', patientScope)
        .gt('unread', 0)
        .limit(5);

      for (const convo of unreadConvos || []) {
        notifications.push({
          id: `msg_${convo.id}`,
          type: 'new_message',
          title: 'New Message',
          message: `${convo.contact_name}: ${convo.last_message}`,
          read: false,
          action_url: '/clinician',
        });
      }
    }

    notifications.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    return NextResponse.json({ notifications, total: notifications.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}