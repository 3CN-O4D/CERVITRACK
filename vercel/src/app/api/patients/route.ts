import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'patient';

    let q = supabaseAdmin
      .from('users')
      .select('id, name, email, phone, county, sub_county, ward, patient_id, photo, role, risk_index, total_screenings, total_vaccines, last_screening_date, last_vaccine_date, created_at')
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (search) {
      q = q.or(`name.ilike.%${search}%,patient_id.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ patients: data || [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message, patients: [] }, { status: 500 });
  }
}
