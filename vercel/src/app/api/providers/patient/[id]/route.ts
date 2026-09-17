import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, hasConsentGrant, forbidden } from '@/lib/api-auth';

const STAFF_ROLES = [
  'clinician', 'officer', 'county_officer', 'lab_staff', 'admin', 'super_admin', 'staff',
];

function publicPatientRecord(user: any) {
  return {
    id: user.id,
    patient_id: user.patient_id,
    name: user.name,
    role: user.role,
    phone: user.phone,
    county: user.county,
    dob: user.dob ?? user.date_of_birth ?? null,
    gender: user.gender ?? null,
    created_at: user.created_at,
  };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const user = await getRequestUser(request);
    if (!user) return forbidden();

    let patient: any = null;
    const { data: byId, error: byIdErr } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', id)
      .single();
    if (!byIdErr && byId) patient = byId;
    else {
      const { data: byPatient, error: pidErr } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('patient_id', id)
        .single();
      if (!pidErr && byPatient) patient = byPatient;
    }

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    if (user.role === 'patient') {
      if (patient.id !== user.userId) return forbidden();
    } else if (!STAFF_ROLES.includes(user.role)) {
      return forbidden();
    } else if (!(await hasConsentGrant(patient.id, user.userId))) {
      return forbidden();
    }

    const { data: full } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', patient.id)
      .single();

    const [screenings, vaccines, appointments, testResults, labResults] = await Promise.all([
      supabaseAdmin.from('screenings').select('*').eq('profile_id', patient.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('vaccines').select('*').eq('user_id', patient.id),
      supabaseAdmin.from('appointments').select('*').eq('user_id', patient.id),
      supabaseAdmin.from('test_results').select('*').eq('user_id', patient.id),
      supabaseAdmin.from('lab_results').select('*').eq('user_id', patient.id),
    ]);

    return NextResponse.json({
      ...publicPatientRecord(full || patient),
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