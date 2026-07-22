import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, category, message, contact } = body;

    const { error } = await supabaseAdmin
      .from('feedback')
      .insert({
        user_id,
        category,
        message,
        contact,
      });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Feedback submitted' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
