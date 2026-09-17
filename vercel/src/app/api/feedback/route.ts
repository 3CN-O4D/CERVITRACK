import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, forbidden } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const body = await request.json();
    const { user_id, category, message, contact } = body;

    const scopedId = resolveUserScope(user, user_id);
    if (!scopedId) return forbidden();

    const { error } = await supabaseAdmin
      .from('feedback')
      .insert({
        user_id: scopedId,
        category,
        message,
        contact,
      });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Feedback submitted' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
