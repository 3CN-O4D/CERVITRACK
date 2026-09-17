import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, ownsPatientRow, forbidden } from '@/lib/api-auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    if (user.role !== 'patient') return forbidden();

    const { data: msg } = await supabaseAdmin
      .from('chat_messages')
      .select('conversation_id')
      .eq('id', params.id)
      .maybeSingle();
    if (!msg) return forbidden();
    const { data: conv } = await supabaseAdmin
      .from('chat_conversations')
      .select('user_id')
      .eq('id', msg.conversation_id)
      .maybeSingle();
    if (!ownsPatientRow(user, conv?.user_id)) return forbidden();

    const { data, error } = await supabaseAdmin.rpc('hide_message_for_me', { p_message_id: params.id });
    if (error) throw error;
    return NextResponse.json({ hidden: !!data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}