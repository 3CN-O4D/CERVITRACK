import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser, resolveUserScope, hasConsentGrant, forbidden } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return forbidden();
    const claimed = request.nextUrl.searchParams.get('user_id');

    // Explicit patient scope — patients may only read their own thread; staff
    // must hold a consent grant for the patient they are asking about.
    if (claimed) {
      const scoped = resolveUserScope(user, claimed);
      if (!scoped) return forbidden();
      if (user.role !== 'patient' && scoped !== user.userId) {
        const granted = await hasConsentGrant(scoped, user.userId);
        if (!granted) return forbidden();
      }
      const { data, error } = await supabaseAdmin
        .from('chat_conversations')
        .select('*')
        .eq('user_id', scoped)
        .order('last_time', { ascending: false });
      if (error) throw error;
      return NextResponse.json(data || []);
    }

    // Patient default — their own conversations.
    if (user.role === 'patient') {
      const { data, error } = await supabaseAdmin
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.userId)
        .order('last_time', { ascending: false });
      if (error) throw error;
      return NextResponse.json(data || []);
    }

    // Staff default — conversations addressed to them (they are the contact)
    // plus conversations for patients who granted them consent.
    const { data: myContacts } = await supabaseAdmin
      .from('chat_contacts')
      .select('id')
      .eq('user_id', user.userId);
    const contactIds = (myContacts || []).map((c) => c.id);

    const { data: grants } = await supabaseAdmin
      .from('consent_grants')
      .select('patient_id')
      .eq('staff_id', user.userId)
      .eq('status', 'granted');
    const patientIds = (grants || []).map((g) => g.patient_id);

    const results = new Map<string, any>();

    if (contactIds.length) {
      const { data } = await supabaseAdmin
        .from('chat_conversations')
        .select('*')
        .in('contact_id', contactIds);
      (data || []).forEach((c) => results.set(String(c.id), c));
    }
    if (patientIds.length) {
      const { data } = await supabaseAdmin
        .from('chat_conversations')
        .select('*')
        .in('user_id', patientIds);
      (data || []).forEach((c) => results.set(String(c.id), c));
    }

    const merged = Array.from(results.values()).sort(
      (a, b) => new Date(b.last_time || 0).getTime() - new Date(a.last_time || 0).getTime()
    );
    return NextResponse.json(merged);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
