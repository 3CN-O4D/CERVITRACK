import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const body = await request.json();
    const { user_id, facility_name, facility_location, date, notes } = body;

    const scopedId = resolveUserScope(user, user_id);
    if (!scopedId) return forbidden();

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        user_id: scopedId,
        facility_name,
        facility_location,
        date,
        notes,
        status: 'upcoming',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
