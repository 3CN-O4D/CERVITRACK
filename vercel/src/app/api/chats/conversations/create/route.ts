import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { user_id, contact_id, contact_name, contact_role, online } = await request.json();

    const { data: existing, error: existErr } = await supabaseAdmin
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user_id)
      .eq('contact_id', contact_id)
      .maybeSingle();

    if (existErr) throw existErr;
    if (existing) return NextResponse.json(existing);

    const { data, error } = await supabaseAdmin
      .from('chat_conversations')
      .insert({
        user_id,
        contact_id,
        contact_name,
        contact_role,
        online,
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
