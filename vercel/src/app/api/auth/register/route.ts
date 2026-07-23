import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone, role } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required.' }, { status: 400 });
    }

    const userRole = role || 'patient';

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

    const userId = authData.user.id;
    const patientId = userRole === 'patient' ? `PT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}` : null;

    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: userId,
      name,
      email,
      phone: phone || null,
      role: userRole,
      patient_id: patientId,
      consent_terms: true,
      consent_medical: true,
      consent_at: new Date().toISOString(),
      county: null,
      sub_county: null,
      ward: null,
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (signInError) {
      return NextResponse.json({
        user: authData.user,
        profile: { id: userId, name, email, role: userRole },
        message: 'Account created. Please sign in.',
      });
    }

    return NextResponse.json({
      user: authData.user,
      profile: { id: userId, name, email, role: userRole },
      message: 'Account created successfully.',
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
