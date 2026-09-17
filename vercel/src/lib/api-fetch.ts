'use client';

import { supabase } from '@/lib/supabase-browser';

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init?.headers || {});
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 || res.status === 403) {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') window.location.href = '/auth';
    throw new Error(`Session expired (${res.status})`);
  }
  return res;
}