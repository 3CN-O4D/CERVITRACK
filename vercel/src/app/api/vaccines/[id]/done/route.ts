import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: vaccine, error } = await supabaseAdmin
      .from('vaccines')
      .update({ status: 'done' })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(vaccine, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
