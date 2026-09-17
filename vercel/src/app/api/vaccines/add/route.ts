import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const body = await request.json();
    const { user_id, name, hospital, date } = body;

    const scopedId = resolveUserScope(user, user_id);
    if (!scopedId) return forbidden();

    const { data: vaccine, error } = await supabaseAdmin
      .from('vaccines')
      .insert({
        user_id: scopedId,
        name,
        hospital,
        date,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.rpc('increment_vaccines', { uid: scopedId });

    return NextResponse.json(vaccine, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
