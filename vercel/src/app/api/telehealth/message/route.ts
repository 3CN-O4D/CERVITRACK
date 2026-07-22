import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, sender, message } = body;

    const { data: msg, error } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id,
        sender,
        message,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(msg, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
