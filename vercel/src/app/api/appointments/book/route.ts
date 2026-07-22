import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, facility_name, facility_location, date, notes } = body;

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        user_id,
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
