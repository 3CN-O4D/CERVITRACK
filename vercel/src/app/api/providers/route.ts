import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, forbidden } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();

    const { searchParams } = request.nextUrl;
    const county = searchParams.get('county');
    const specialty = searchParams.get('specialty');
    const hospital = searchParams.get('hospital');
    const query = searchParams.get('q');

    let q = supabaseAdmin
      .from('providers')
      .select('id, name, specialty, hospital, county, years_experience, photo, bio')
      .eq('approval_status', 'approved');

    if (county) q = q.eq('county', county);
    if (specialty) q = q.eq('specialty', specialty);
    if (hospital) q = q.eq('hospital', hospital);
    if (query) q = q.or(`name.ilike.%${query}%,hospital.ilike.%${query}%,specialty.ilike.%${query}%`);

    const { data, error } = await q.order('name', { ascending: true });
    if (error) throw error;

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
