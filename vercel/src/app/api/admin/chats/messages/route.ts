import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, hasConsentGrant, forbidden } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const conversation_id = request.nextUrl.searchParams.get('conversation_id');

    const { data: conv } = await supabaseAdmin
      .from('chat_conversations')
      .select('user_id, users:user_id(name)')
      .eq('id', conversation_id)
      .maybeSingle();
    if (!conv) return forbidden();
    const granted = await hasConsentGrant(conv.user_id, user.userId);
    if (!granted) return forbidden();

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    const rows = data || [];
    const patientName = (conv.users as any)?.name || 'Patient';
    const mapped = rows.map((m) => ({
      ...m,
      is_own: m.sender_id === user.userId,
      sender_name: m.sender_type === 'patient' ? patientName : 'Staff',
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}