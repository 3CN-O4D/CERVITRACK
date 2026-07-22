import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followup_id, notes } = body;

    const { data: followup, error } = await supabaseAdmin
      .from('followups')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        notes,
      })
      .eq('id', followup_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(followup, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
