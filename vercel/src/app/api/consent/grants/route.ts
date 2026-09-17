import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, forbidden } from '@/lib/api-auth';

const STAFF_ROLES = ['provider', 'clinician', 'lab_technician', 'facility_admin', 'county_admin', 'national_admin', 'system_admin', 'admin'];

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();

    if (user.role === 'patient') {
      const { data: grants, error } = await supabaseAdmin
        .from('consent_grants')
        .select('*, staff:staff_id(id, name, role)')
        .eq('patient_id', user.userId)
        .order('granted_at', { ascending: false });

      if (error) throw error;

      const { data: staff, error: staffErr } = await supabaseAdmin
        .from('users')
        .select('id, name, role, county')
        .in('role', STAFF_ROLES)
        .order('name');

      if (staffErr) throw staffErr;

      return NextResponse.json({
        grants: grants || [],
        staff: staff || [],
      });
    }

    const { data: grants, error } = await supabaseAdmin
      .from('consent_grants')
      .select('*, patient:patient_id(id, name, role)')
      .eq('staff_id', user.userId)
      .eq('status', 'granted')
      .order('granted_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ grants: grants || [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user || user.role !== 'patient') return forbidden();

    const { staff_id } = await request.json();
    if (!staff_id) {
      return NextResponse.json({ error: 'staff_id is required' }, { status: 400 });
    }

    const { data: staff } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', staff_id)
      .maybeSingle();

    if (!staff || !STAFF_ROLES.includes(staff.role)) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const { data: grant, error } = await supabaseAdmin
      .from('consent_grants')
      .upsert(
        {
          patient_id: user.userId,
          staff_id,
          status: 'granted',
          revoked_at: null,
        },
        { onConflict: 'patient_id,staff_id' }
      )
      .select('*, staff:staff_id(id, name, role)')
      .single();

    if (error) throw error;
    return NextResponse.json(grant, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}