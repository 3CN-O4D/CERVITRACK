import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, forbidden } from '@/lib/api-auth';

function isAdmin(user: any) {
  return ['admin', 'national_admin', 'system_admin', 'county_admin', 'facility_admin'].includes(user.role);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isAdmin(user)) return forbidden();

    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('id, title, summary, content, image, video_url, category, tags, read_time, featured, published, last_updated')
      .order('featured', { ascending: false })
      .order('last_updated', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isAdmin(user)) return forbidden();

    const body = await request.json();
    const { title, summary, content, image, video_url, category, tags, read_time, featured, published } = body;
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('articles')
      .insert({
        title,
        summary: summary || '',
        content: content || '',
        image: image || '',
        video_url: video_url || '',
        category: category || 'General',
        tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
        read_time: read_time || '5 min read',
        featured: !!featured,
        published: published !== false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}