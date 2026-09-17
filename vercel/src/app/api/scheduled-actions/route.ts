import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const claimed = request.nextUrl.searchParams.get('user_id');
    const user_id = resolveUserScope(user, claimed);
    if (!user_id) return forbidden();

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
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const body = await request.json();
    const { user_id, type, scheduled_date, title, notes } = body;

    const scopedId = resolveUserScope(user, user_id);
    if (!scopedId) return forbidden();

    const { data: action, error } = await supabaseAdmin
      .from('scheduled_actions')
      .insert({
        user_id: scopedId,
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
