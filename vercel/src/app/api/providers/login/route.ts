import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const STAFF_ROLES = [
  'clinician', 'officer', 'county_officer', 'lab_staff', 'admin', 'super_admin', 'staff',
];

function safeProvider(p: any) {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    role: p.role,
    specialty: p.specialty,
    hospital: p.hospital,
    license_number: p.license_number,
    approval_status: p.approval_status,
    county: p.county,
    sub_county: p.sub_county,
    ward: p.ward,
    photo: p.photo,
    created_at: p.created_at,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('providers')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !data || !STAFF_ROLES.includes(data.role) || data.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json(safeProvider(data));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}