import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/auth-store';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone, role, county, sub_county, ward } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required.' }, { status: 400 });
    }

    const userRole = role || 'patient';
    if (userRole !== 'patient') {
      return NextResponse.json(
        { error: 'Public registration is only available for patients. Staff accounts are created by an administrator.' },
        { status: 403 },
      );
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: phone || undefined,
      user_metadata: {
        name,
        role: userRole,
        consent_terms: true,
        consent_medical: true,
        consent_at: new Date().toISOString(),
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = createUser({ email, password, name, phone, role, county, sub_county, ward });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        patient_id: user.patient_id,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
