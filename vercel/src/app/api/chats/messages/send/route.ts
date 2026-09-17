import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, ownsPatientRow, hasConsentGrant, forbidden } from '@/lib/api-auth';

async function staffOwnsContact(contactId: number | null | undefined, staffId: string): Promise<boolean> {
  if (!contactId) return false;
  const { data } = await supabaseAdmin
    .from('chat_contacts')
    .select('id')
    .eq('id', contactId)
    .eq('user_id', staffId)
    .maybeSingle();
  return !!data;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const { conversation_id, content } = await request.json();
    if (!conversation_id || !content?.trim()) {
      return NextResponse.json({ error: 'Missing conversation or content' }, { status: 400 });
    }

    const { data: conv } = await supabaseAdmin
      .from('chat_conversations')
      .select('user_id, contact_id')
      .eq('id', conversation_id)
      .maybeSingle();
    if (!conv) return forbidden();

    if (!ownsPatientRow(user, conv.user_id)) {
      const granted = await hasConsentGrant(conv.user_id, user.userId);
      const isContact = await staffOwnsContact(conv.contact_id, user.userId);
      if (!granted && !isContact) return forbidden();
    }

    const senderType = user.role === 'patient' ? 'patient' : 'staff';
    const { data: msg, error: msgErr } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        conversation_id,
        sender_id: user.userId,
        sender_type: senderType,
        content,
        message_type: 'text',
        status: 'sent',
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    const { data: current } = await supabaseAdmin
      .from('chat_conversations')
      .select('unread')
      .eq('id', conversation_id)
      .single();

    await supabaseAdmin
      .from('chat_conversations')
      .update({
        last_message: content,
        last_time: new Date().toISOString(),
        unread: (current?.unread || 0) + 1,
      })
      .eq('id', conversation_id);

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
