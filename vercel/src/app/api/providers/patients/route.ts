import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search');

    let query = supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'patient');

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,patient_id.ilike.%${search}%`);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
