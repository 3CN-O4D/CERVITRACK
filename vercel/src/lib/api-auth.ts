import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export interface RequestUser {
  userId: string;
  email: string;
  role: string;
}

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

export async function getRequestUser(req: NextRequest): Promise<RequestUser | null> {
  const token = bearerToken(req);
  if (!token) return null;
  try {
    const { data, error } = await anonClient().auth.getUser(token);
    if (error || !data.user) return null;
    const { data: profile } = await getSupabaseAdmin()
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    const role =
      profile?.role ||
      data.user.user_metadata?.role ||
      data.user.app_metadata?.role ||
      '';
    return { userId: data.user.id, email: data.user.email || '', role };
  } catch {
    return null;
  }
}

export async function requireRole(
  req: NextRequest,
  roles: string[]
): Promise<RequestUser | null> {
  const user = await getRequestUser(req);
  if (!user) return null;
  return roles.includes(user.role) ? user : null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}