import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, hasConsentGrant, forbidden } from '@/lib/api-auth';

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
    const granted = await hasConsentGrant(conv.user_id, user.userId);
    const { data: contact } = await supabaseAdmin
      .from('chat_contacts')
      .select('id')
      .eq('id', conv.contact_id)
      .eq('user_id', user.userId)
      .maybeSingle();
    if (!granted && !contact) return forbidden();
    const scopedSender = user.userId;

    const { data: msg, error: msgErr } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        conversation_id,
        sender_id: scopedSender,
        sender_type: 'staff',
        content,
        message_type: 'text',
        status: 'sent',
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    const { data: convUnread } = await supabaseAdmin
      .from('chat_conversations')
      .select('unread')
      .eq('id', conversation_id)
      .single();

    await supabaseAdmin
      .from('chat_conversations')
      .update({
        last_message: content,
        last_time: new Date().toISOString(),
        unread: (convUnread?.unread || 0) + 1,
      })
      .eq('id', conversation_id);

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
