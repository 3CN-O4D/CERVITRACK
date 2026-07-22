import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

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
