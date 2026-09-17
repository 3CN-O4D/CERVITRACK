import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, forbidden } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();

    const search = request.nextUrl.searchParams.get('q');

    let query = supabaseAdmin
      .from('chat_contacts')
      .select('id, user_id, name, role, specialty, hospital, online')
      .not('user_id', 'is', null)
      .neq('user_id', user.userId)
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,specialty.ilike.%${search}%,hospital.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
