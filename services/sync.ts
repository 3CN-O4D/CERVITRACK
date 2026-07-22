import { supabase, type Session } from '../lib/supabase/client';

export async function syncAll(_userId?: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await Promise.all([
    syncFacilities(session),
    syncArticles(session),
    syncScreenings(session),
    syncVaccines(session),
    syncAppointments(session),
    syncNotifications(session),
  ]);
}

export async function syncFacilities(_session?: Session) {
  const { data } = await supabase.from('facilities').select('*');
  if (data && data.length) return;
  // if empty (rare), the local seed in db.ts would be used before
}

export async function syncArticles(_session?: Session) {
  const { data } = await supabase.from('articles').select('*');
  if (data && data.length) return;
}

export async function syncScreenings(session: Session) {
  // the insight is that in Supabase data is always fresh, no local delta
  await supabase
    .from('screenings')
    .select('*')
    .eq('profile_id', session.user.id);
}

export async function syncVaccines(session: Session) {
  await supabase
    .from('vaccines')
    .select('*')
    .eq('user_id', session.user.id);
}

export async function syncAppointments(session: Session) {
  await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', session.user.id);
}

export async function syncNotifications(session: Session) {
  await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', session.user.id);
}

export async function getLastFullSync() {
  const { data } = await supabase
    .from('sync_log')
    .select('last_synced_at')
    .eq('table_name', 'all')
    .maybeSingle();
  return data?.last_synced_at ?? null;
}

export default {
  syncAll,
  syncFacilities,
  syncArticles,
  syncScreenings,
  syncVaccines,
  syncAppointments,
  syncNotifications,
  getLastFullSync,
};
