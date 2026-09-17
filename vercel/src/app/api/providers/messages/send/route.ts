import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireRole, hasConsentGrant, forbidden } from '@/lib/api-auth';

const STAFF_ROLES = [
  'clinician', 'officer', 'county_officer', 'lab_staff', 'admin', 'super_admin', 'staff',
];

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole(request, STAFF_ROLES);
    if (!staff) return forbidden();

    const { user_id, sender, message } = await request.json();
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    if (!(await hasConsentGrant(user_id, staff.userId))) return forbidden();

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id,
        sender,
        message,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}