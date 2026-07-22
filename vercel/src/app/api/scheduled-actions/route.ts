import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const user_id = request.nextUrl.searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('scheduled_actions')
      .select('*')
      .eq('user_id', user_id)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, type, scheduled_date, title, notes } = body;

    const { data: action, error } = await supabaseAdmin
      .from('scheduled_actions')
      .insert({
        user_id,
        type,
        scheduled_date,
        title,
        notes,
        completed: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(action, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
