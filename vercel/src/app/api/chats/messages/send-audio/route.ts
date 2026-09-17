import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, ownsPatientRow, hasConsentGrant, forbidden } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const { conversation_id, sender_id, sender_type, file_url, duration } = await request.json();

    const { data: conv } = await supabaseAdmin
      .from('chat_conversations')
      .select('user_id')
      .eq('id', conversation_id)
      .maybeSingle();
    if (!conv || !ownsPatientRow(user, conv.user_id)) return forbidden();
    if (user.role !== 'patient') {
      const granted = await hasConsentGrant(conv.user_id, user.userId);
      if (!granted) return forbidden();
    }
    const scopedSender = user.role === 'patient' ? user.userId : sender_id;

    const { data: msg, error: msgErr } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        conversation_id,
        sender_id: scopedSender,
        sender_type,
        content: '',
        file_url,
        duration,
        message_type: 'audio',
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
        last_message: '[Audio]',
        last_time: new Date().toISOString(),
        unread: (convUnread?.unread || 0) + 1,
      })
      .eq('id', conversation_id);

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
