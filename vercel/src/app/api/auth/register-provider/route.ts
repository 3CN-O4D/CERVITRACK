import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, role, specialty, hospital, license_number } = body;

    const { data: provider, error } = await supabaseAdmin
      .from('providers')
      .insert({
        name,
        email,
        phone,
        password,
        role: role || 'provider',
        specialty,
        hospital,
        license_number,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(provider, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
