import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, patient_name, result, notes } = body;

    const { data: labResult, error } = await supabaseAdmin
      .from('lab_results')
      .insert({
        user_id,
        patient_name,
        result,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(labResult, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
