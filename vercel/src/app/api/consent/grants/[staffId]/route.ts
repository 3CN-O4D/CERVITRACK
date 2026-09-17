import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, forbidden } from '@/lib/api-auth';

export async function DELETE(request: NextRequest, { params }: { params: { staffId: string } }) {
  try {
    const user = await getRequestUser(request);
    if (!user || user.role !== 'patient') return forbidden();

    const { data, error } = await supabaseAdmin
      .from('consent_grants')
      .delete()
      .eq('patient_id', user.userId)
      .eq('staff_id', params.staffId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ revoked: !!data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}