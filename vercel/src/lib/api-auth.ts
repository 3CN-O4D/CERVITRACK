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

// Patients may only ever operate on their own records. Staff pass the target
// user id explicitly (unchanged behaviour). Returns null when a patient
// attempts to act on another user's data.
export function resolveUserScope(user: RequestUser, claimed: string | null | undefined): string | null {
  const c = (claimed ?? '').trim();
  if (user.role === 'patient') {
    if (c && c !== user.userId) return null;
    return user.userId;
  }
  return c || user.userId;
}

// True when a 'patient' role's target row belongs to them. Staff are always allowed.
export function ownsPatientRow(user: RequestUser, rowUserId: string | null | undefined): boolean {
  if (user.role !== 'patient') return true;
  return !!rowUserId && rowUserId === user.userId;
}

// True when a staff member has an active consent grant from the given patient.
// Chat routes must not let a staff member read or write a patient's messages
// without a grant.
export async function hasConsentGrant(patientId: string | null | undefined, staffId: string): Promise<boolean> {
  if (!patientId) return false;
  const { data, error } = await getSupabaseAdmin()
    .from('consent_grants')
    .select('id')
    .eq('patient_id', patientId)
    .eq('staff_id', staffId)
    .eq('status', 'granted')
    .maybeSingle();
  return !error && !!data;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}