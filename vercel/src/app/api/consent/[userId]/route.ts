import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const user_id = resolveUserScope(user, params.userId);
    if (!user_id) return forbidden();

    const { data, error } = await supabaseAdmin
      .from('consent_log')
      .select('*')
      .eq('user_id', user_id)
      .order('accepted_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
