import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const { user_id, contact_id } = await request.json();

    if (!contact_id) {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 });
    }

    const scopedId = resolveUserScope(user, user_id);
    if (!scopedId) return forbidden();

    const { data: contact, error: contactErr } = await supabaseAdmin
      .from('chat_contacts')
      .select('id, name, role, online')
      .eq('id', contact_id)
      .maybeSingle();
    if (contactErr) throw contactErr;
    if (!contact) {
      return NextResponse.json({ error: 'Unknown contact' }, { status: 404 });
    }

    const { data: existing, error: existErr } = await supabaseAdmin
      .from('chat_conversations')
      .select('*')
      .eq('user_id', scopedId)
      .eq('contact_id', contact.id)
      .maybeSingle();

    if (existErr) throw existErr;
    if (existing) return NextResponse.json(existing);

    const { data, error } = await supabaseAdmin
      .from('chat_conversations')
      .insert({
        user_id: scopedId,
        contact_id: contact.id,
        contact_name: contact.name,
        contact_role: contact.role,
        online: contact.online,
        last_message: '',
        last_time: new Date().toISOString(),
        unread: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
