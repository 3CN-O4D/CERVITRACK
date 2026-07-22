import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, role, county, sub_county, ward, consent_terms, consent_medical } = body;

    const patient_id = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        patient_id,
        name,
        email,
        phone,
        password,
        role: role || 'patient',
        county,
        sub_county,
        ward,
        total_screenings: 0,
        total_vaccines: 0,
      })
      .select()
      .single();

    if (error) throw error;

    if (consent_terms || consent_medical) {
      await supabaseAdmin.from('consent_log').insert({
        user_id: user.id,
        consent_terms: !!consent_terms,
        consent_medical: !!consent_medical,
      });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
