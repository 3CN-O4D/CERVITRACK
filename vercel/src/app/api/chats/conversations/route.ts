import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, hasConsentGrant, forbidden } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const claimed = request.nextUrl.searchParams.get('user_id');
    const user_id = resolveUserScope(user, claimed);
    if (!user_id) return forbidden();

    if (user.role !== 'patient' && claimed) {
      const granted = await hasConsentGrant(claimed, user.userId);
      if (!granted) return forbidden();
    }

    let query = supabaseAdmin
      .from('chat_conversations')
      .select('*')
      .order('last_time', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
