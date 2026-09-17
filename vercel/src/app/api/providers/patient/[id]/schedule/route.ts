import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireRole, hasConsentGrant, forbidden } from '@/lib/api-auth';

const STAFF_ROLES = [
  'clinician', 'officer', 'county_officer', 'lab_staff', 'admin', 'super_admin', 'staff',
];

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const staff = await requireRole(request, STAFF_ROLES);
    if (!staff) return forbidden();

    const { id } = params;
    const { action_type, date, notes } = await request.json();

    const { data: patient, error: pErr } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', id)
      .single();
    if (pErr || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    if (!(await hasConsentGrant(patient.id, staff.userId))) return forbidden();

    const { data, error } = await supabaseAdmin
      .from('scheduled_actions')
      .insert({
        user_id: patient.id,
        action_type,
        date,
        notes,
      })
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}