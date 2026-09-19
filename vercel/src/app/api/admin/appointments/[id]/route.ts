import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, requireRole, forbidden } from '@/lib/api-auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ['pending', 'upcoming', 'completed', 'cancelled'];

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getRequestUser(request);
    if (!user || !['admin', 'super_admin'].includes(user.role)) return forbidden();

    const { id } = await params;
    if (!id || !UUID_RE.test(String(id))) {
      return NextResponse.json({ error: 'Invalid appointment' }, { status: 400 });
    }

    const body = await request.json();
    const { status, date, time, reminder_phone, message } = body;
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('appointments')
      .select('user_id, provider_id, date, time, reminder_phone')
      .eq('id', id)
      .maybeSingle();

    const updates: any = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (date) updates.date = date;
    if (time) updates.time = time;
    if (typeof reminder_phone === 'string') updates.reminder_phone = reminder_phone;

    const { error } = await supabaseAdmin
      .from('appointments')
      .update(updates)
      .eq('id', id);
    if (error) throw error;

    if (existing?.user_id) {
      const actionLabel =
        status === 'upcoming' ? 'confirmed' :
        status === 'completed' ? 'marked completed' :
        status === 'cancelled' ? 'cancelled' : 'updated';
      await supabaseAdmin.from('notifications').insert({
        user_id: existing.user_id,
        title: `Appointment ${actionLabel} by admin`,
        message: message ||
          (status === 'upcoming'
            ? `Your appointment has been ${actionLabel}${date || existing.date ? ` for ${date || existing.date} at ${time || existing.time}.` : '.'} Contact your clinician via chat if you need to reschedule.`
            : `Your appointment was ${actionLabel}.`),
        type: 'appointment',
        read: false,
        action_url: '/patient/messages',
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
