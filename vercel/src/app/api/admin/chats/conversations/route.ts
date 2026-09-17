import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, forbidden } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();

    const { data: contacts, error: contactsErr } = await supabaseAdmin
      .from('chat_contacts')
      .select('*');

    if (contactsErr) throw contactsErr;

    const { data: grants, error: grantsErr } = await supabaseAdmin
      .from('consent_grants')
      .select('patient_id')
      .eq('staff_id', user.userId)
      .eq('status', 'granted');

    if (grantsErr) throw grantsErr;
    const granted = new Set((grants || []).map((g) => g.patient_id));

    const { data: conversations, error: convErr } = await supabaseAdmin
      .from('chat_conversations')
      .select('*, users:user_id(name)')
      .order('last_time', { ascending: false });

    if (convErr) throw convErr;

    const scoped = (conversations || []).filter((c) => granted.has(c.user_id));

    return NextResponse.json({
      contacts: contacts || [],
      conversations: scoped,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
