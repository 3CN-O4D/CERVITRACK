import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, ownsPatientRow, hasConsentGrant, forbidden } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const conversation_id = request.nextUrl.searchParams.get('conversation_id');

    const { data: conv } = await supabaseAdmin
      .from('chat_conversations')
      .select('user_id')
      .eq('id', conversation_id)
      .maybeSingle();
    if (!ownsPatientRow(user, conv?.user_id)) return forbidden();
    if (user.role !== 'patient') {
      const granted = await hasConsentGrant(conv?.user_id, user.userId);
      if (!granted) return forbidden();
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    const rows = data || [];
    const visible = user.role === 'patient'
      ? rows.filter((m) => !(Array.isArray(m.hidden_for) && m.hidden_for.includes(user.userId)))
      : rows;
    return NextResponse.json(visible);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
