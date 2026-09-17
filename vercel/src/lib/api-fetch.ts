'use client';

import { supabase } from '@/lib/supabase-browser';

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init?.headers || {});
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  try {
    const res = await fetch(input, { ...init, headers });
    if (res.status === 401 || res.status === 403) {
      if (session) await supabase.auth.signOut().catch(() => {});
    }
    return res;
  } catch (err) {
    const errRes = new Response(null, {
      status: 0,
      statusText: (err as Error)?.message || 'Network error',
    });
    return errRes;
  }
}