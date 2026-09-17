import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const { user_id } = await request.json();

    const scopedId = resolveUserScope(user, user_id);
    if (!scopedId) return forbidden();

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', scopedId)
      .eq('read', false);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'All notifications marked as read' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
