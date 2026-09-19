import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, forbidden } from '@/lib/api-auth';

function isAdmin(user: any) {
  return ['admin', 'national_admin', 'system_admin', 'county_admin', 'facility_admin'].includes(user.role);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isAdmin(user)) return forbidden();

    const body = await request.json();
    const patch: any = {};
    for (const key of ['title', 'summary', 'content', 'image', 'video_url', 'category', 'read_time', 'featured', 'published']) {
      if (key in body) patch[key] = body[key];
    }
    if (body.tags !== undefined) patch.tags = Array.isArray(body.tags) ? body.tags : [body.tags];

    const { data, error } = await supabaseAdmin
      .from('articles')
      .update({ ...patch, last_updated: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isAdmin(user)) return forbidden();

    const { error } = await supabaseAdmin
      .from('articles')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}