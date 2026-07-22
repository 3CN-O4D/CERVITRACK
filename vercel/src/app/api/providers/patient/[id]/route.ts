import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    let { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userErr || !user) {
      const { data: byPatient, error: pidErr } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('patient_id', id)
        .single();

      if (pidErr || !byPatient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
      user = byPatient;
    }

    const [screenings, vaccines, appointments, testResults, labResults] = await Promise.all([
      supabaseAdmin.from('screenings').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('vaccines').select('*').eq('user_id', user.id),
      supabaseAdmin.from('appointments').select('*').eq('user_id', user.id),
      supabaseAdmin.from('test_results').select('*').eq('user_id', user.id),
      supabaseAdmin.from('lab_results').select('*').eq('user_id', user.id),
    ]);

    return NextResponse.json({
      ...user,
      screenings: screenings.data || [],
      vaccines: vaccines.data || [],
      appointments: appointments.data || [],
      test_results: testResults.data || [],
      lab_results: labResults.data || [],
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
