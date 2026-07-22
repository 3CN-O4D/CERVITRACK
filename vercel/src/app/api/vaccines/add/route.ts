import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, name, hospital, date } = body;

    const { data: vaccine, error } = await supabaseAdmin
      .from('vaccines')
      .insert({
        user_id,
        name,
        hospital,
        date,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.rpc('increment_vaccines', { uid: user_id });

    return NextResponse.json(vaccine, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
