import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireRole, forbidden } from '@/lib/api-auth';

const STAFF_ROLES = [
  'clinician', 'officer', 'county_officer', 'lab_staff', 'admin', 'super_admin', 'staff',
];

export async function GET(request: NextRequest) {
  try {
    const staff = await requireRole(request, STAFF_ROLES);
    if (!staff) return forbidden();

    const search = request.nextUrl.searchParams.get('search');

    let query = supabaseAdmin
      .from('users')
      .select('id, patient_id, name, phone, county, birth_date, created_at')
      .eq('role', 'patient');

    if (search) {
      query = query.or(`name.ilike.%${search}%,patient_id.ilike.%${search}%`);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}