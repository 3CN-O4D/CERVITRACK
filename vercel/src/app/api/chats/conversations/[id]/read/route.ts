import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, ownsPatientRow, hasConsentGrant, forbidden } from '@/lib/api-auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const { id } = params;

    const { data: conv } = await supabaseAdmin
      .from('chat_conversations')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();
    if (!ownsPatientRow(user, conv?.user_id)) return forbidden();
    if (user.role !== 'patient') {
      const granted = await hasConsentGrant(conv?.user_id, user.userId);
      if (!granted) return forbidden();
    }

    await supabaseAdmin
      .from('chat_messages')
      .update({ status: 'read' })
      .eq('conversation_id', id)
      .neq('status', 'read');

    const { data, error } = await supabaseAdmin
      .from('chat_conversations')
      .update({ unread: 0 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
