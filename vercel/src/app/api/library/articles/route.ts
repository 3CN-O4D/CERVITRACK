import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('id, title, summary, content, image, video_url, category, tags, read_time, featured, last_updated')
      .eq('published', true)
      .order('featured', { ascending: false })
      .order('last_updated', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}