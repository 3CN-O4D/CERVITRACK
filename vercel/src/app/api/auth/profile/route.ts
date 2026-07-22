import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, ...updates } = body;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    await supabaseAdmin.from('screenings').delete().eq('profile_id', user_id);
    await supabaseAdmin.from('appointments').delete().eq('user_id', user_id);
    await supabaseAdmin.from('notifications').delete().eq('user_id', user_id);

    const { error } = await supabaseAdmin.from('users').delete().eq('id', user_id);
    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
