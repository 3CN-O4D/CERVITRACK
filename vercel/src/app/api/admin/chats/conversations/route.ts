import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { data: contacts, error: contactsErr } = await supabaseAdmin
      .from('chat_contacts')
      .select('*');

    if (contactsErr) throw contactsErr;

    const { data: conversations, error: convErr } = await supabaseAdmin
      .from('chat_conversations')
      .select('*, users:user_id(name)')
      .order('last_time', { ascending: false });

    if (convErr) throw convErr;

    return NextResponse.json({
      contacts: contacts || [],
      conversations: conversations || [],
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
