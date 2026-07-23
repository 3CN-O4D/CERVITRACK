import { supabase } from '../lib/supabase/client';
import * as localDb from './localDb';

// ─── Types ────────────────────────────────────────────────────

export interface ScreeningPayload {
  profile_id?: string;
  verdict: string;
  risk_tier: 'LOW' | 'MODERATE' | 'HIGH';
  age?: number;
  parity?: number;
  vaccination?: string;
  previous_screening?: string;
  hiv_status?: string;
  smoking?: string;
  symptoms?: string;
  family_history?: string;
  score?: number;
}

export interface Screening {
  id: number;
  profile_id: string;
  verdict: string;
  risk_tier: string;
  age?: number;
  parity?: number;
  vaccination?: string;
  previous_screening?: string;
  hiv_status?: string;
  smoking?: string;
  symptoms?: string;
  family_history?: string;
  score?: number;
  created_at: string;
}

export interface Vaccine {
  id: number;
  user_id: string;
  name: string;
  hospital?: string;
  date?: string;
  status: string;
  reminder_day?: boolean;
  reminder_before?: boolean;
}

export interface Appointment {
  id: number;
  user_id: string;
  clinician_id?: string;
  provider_id?: string;
  title?: string;
  facility?: string;
  facility_name?: string;
  facility_location?: string;
  date?: string;
  time?: string;
  notes?: string;
  custom_text?: string;
  status: string;
  provider?: { name?: string; specialty?: string; hospital?: string };
}

export interface Notification {
  id: number;
  user_id: string;
  title?: string;
  message?: string;
  type?: string;
  read: boolean;
  created_at: string;
}

export interface Article {
  id: number;
  title: string;
  summary: string;
  content: string;
  image?: string;
  category?: string;
  read_time?: string;
}

export interface Clinician {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  county: string;
  years_experience: number;
  photo: string;
  bio: string;
  approval_status: string;
}

export interface Kit {
  id: string;
  barcode: string;
  kitType: string;
  status: string;
  patientName?: string;
  collectionMethod?: string;
  result?: string;
  events: KitEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface KitEvent {
  id: string;
  action: string;
  scannedBy: string;
  scannedByName: string;
  location?: string;
  notes?: string;
  timestamp: string;
}

// ─── Offline-first helper: try network, fall back to local ────

async function withFallback<T>(
  networkFn: () => Promise<T>,
  localFn: () => T,
  saveLocal?: (data: T) => void
): Promise<T> {
  try {
    const result = await networkFn();
    if (saveLocal && result) saveLocal(result);
    return result;
  } catch {
    return localFn();
  }
}

// ─── Articles ─────────────────────────────────────────────────

export async function getArticles(): Promise<Article[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, summary, content, image, category, read_time')
        .order('id', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Article[];
    },
    () => localDb.getArticles() as Article[],
    (articles) => localDb.saveArticles(articles)
  );
}

export async function getArticleById(id: number) {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => localDb.getArticleById(id),
    (article) => { if (article) localDb.saveArticle(article); }
  );
}

// ─── Facilities ───────────────────────────────────────────────

export async function getFacilities() {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('distance', { ascending: true });
      if (error) throw error;
      localDb.saveFacilities(data ?? []);
      return data ?? [];
    },
    () => localDb.getFacilities()
  );
}

// ─── Screenings ───────────────────────────────────────────────

export async function getScreenings(profileId: string): Promise<Screening[]> {
  const local = localDb.getScreenings(profileId) as Screening[];
  try {
    const { data, error } = await supabase
      .from('screenings')
      .select('*')
      .or(`profile_id.eq.${profileId},user_id.eq.${profileId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const remote = (data ?? []) as Screening[];
    // Merge: remote wins for duplicates, new ones get saved locally
    const merged = new Map<string, Screening>();
    for (const s of local) {
      const key = s.remote_id || String(s.id);
      merged.set(key, s);
    }
    for (const s of remote) {
      merged.set(String(s.id), { ...s, id: s.id } as Screening);
      // Save to local if not present
      if (!local.find(l => l.remote_id === String(s.id))) {
        localDb.saveScreening({ ...s, remote_id: String(s.id), profile_id: s.profile_id, user_id: s.profile_id }, 'synced');
      }
    }
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return local;
  }
}

export async function submitScreening(profileId: string, p: ScreeningPayload): Promise<Screening> {
  // Save locally first (offline-first)
  const localId = localDb.saveScreening({
    ...p,
    profile_id: profileId,
    user_id: profileId,
    sync_status: 'pending',
  }, 'pending');

  // Try to push to network
  try {
    const { data, error } = await supabase
      .from('screenings')
      .insert({ ...p, profile_id: profileId })
      .select()
      .single();
    if (error) throw error;
    // Update local with remote_id
    const { getDb } = await import('./localDb');
    const db = getDb();
    db.runSync('UPDATE screenings SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', localId);
    return data as Screening;
  } catch {
    // Return local version
    return {
      id: localId,
      profile_id: profileId,
      verdict: p.verdict,
      risk_tier: p.risk_tier,
      age: p.age,
      parity: p.parity,
      vaccination: p.vaccination,
      previous_screening: p.previous_screening,
      hiv_status: p.hiv_status,
      smoking: p.smoking,
      symptoms: p.symptoms,
      family_history: p.family_history,
      score: p.score,
      created_at: new Date().toISOString(),
    };
  }
}

// ─── Vaccines ─────────────────────────────────────────────────

export async function getVaccines(userId: string): Promise<Vaccine[]> {
  const local = localDb.getVaccines(userId) as Vaccine[];
  try {
    const { data, error } = await supabase
      .from('vaccines')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    const remote = (data ?? []) as Vaccine[];
    for (const v of remote) {
      if (!local.find(l => l.remote_id === String(v.id))) {
        localDb.saveVaccine({ ...v, remote_id: String(v.id) }, 'synced');
      }
    }
    return remote.length > 0 ? remote : local;
  } catch {
    return local;
  }
}

export async function addVaccine(v: Partial<Vaccine> & { user_id: string }) {
  const localId = localDb.saveVaccine({ ...v, sync_status: 'pending' }, 'pending');
  try {
    const { data, error } = await supabase
      .from('vaccines')
      .insert(v)
      .select()
      .single();
    if (error) throw error;
    const { getDb } = await import('./localDb');
    const db = getDb();
    db.runSync('UPDATE vaccines SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', localId);
    return data;
  } catch {
    return { id: localId, ...v, status: v.status || 'upcoming' };
  }
}

export async function updateVaccineStatus(id: number, status: string) {
  localDb.updateVaccineStatus(id, status);
  try {
    const { data, error } = await supabase
      .from('vaccines')
      .update({ status, reminder_day: status !== 'upcoming', reminder_before: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const { getDb } = await import('./localDb');
    const db = getDb();
    db.runSync('UPDATE vaccines SET sync_status = ? WHERE id = ?', 'synced', id);
    return data;
  } catch {
    return { id, status };
  }
}

// ─── Appointments ─────────────────────────────────────────────

export async function getAppointments(userId: string): Promise<Appointment[]> {
  const local = localDb.getAppointments(userId) as Appointment[];
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    const remote = (data ?? []) as Appointment[];
    for (const a of remote) {
      if (!local.find(l => l.remote_id === String(a.id))) {
        localDb.saveAppointment({ ...a, remote_id: String(a.id) }, 'synced');
      }
    }
    return remote.length > 0 ? remote : local;
  } catch {
    return local;
  }
}

export async function bookAppointment(a: Partial<Appointment> & { user_id: string; date: string }) {
  const localId = localDb.saveAppointment({ ...a, sync_status: 'pending' }, 'pending');
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        user_id: a.user_id, clinician_id: a.clinician_id, provider_id: a.provider_id,
        title: a.title, facility: a.facility, facility_name: a.facility_name,
        facility_location: a.facility_location, date: a.date, time: a.time,
        notes: a.notes, custom_text: a.custom_text, status: a.status || 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    const { getDb } = await import('./localDb');
    const db = getDb();
    db.runSync('UPDATE appointments SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', localId);
    return data;
  } catch {
    return { id: localId, ...a, status: a.status || 'pending' };
  }
}

// ─── Notifications ────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  const local = localDb.getNotifications(userId) as Notification[];
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const remote = (data ?? []) as Notification[];
    for (const n of remote) {
      if (!local.find(l => l.remote_id === String(n.id))) {
        localDb.saveNotification({ ...n, remote_id: String(n.id) }, 'synced');
      }
    }
    return remote.length > 0 ? remote : local;
  } catch {
    return local;
  }
}

export async function markNotificationRead(id: number, userId: string) {
  localDb.markNotificationRead(id);
  try {
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId);
    const { getDb } = await import('./localDb');
    const db = getDb();
    db.runSync('UPDATE notifications SET sync_status = ? WHERE id = ?', 'synced', id);
  } catch { /* queued for sync */ }
}

export async function markAllNotificationsRead(userId: string) {
  localDb.markAllNotificationsRead(userId);
  try {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  } catch { /* queued */ }
}

// ─── Lab Results ──────────────────────────────────────────────

export async function getLabResults(userId: string) {
  const local = localDb.getLabResults(userId);
  try {
    const { data, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? local;
  } catch {
    return local;
  }
}

// ─── Clinicians ───────────────────────────────────────────────

export async function searchClinicians(query?: string, county?: string, specialty?: string): Promise<Clinician[]> {
  try {
    let q = supabase
      .from('providers')
      .select('id, name, specialty, hospital, county, years_experience, photo, bio, approval_status')
      .eq('approval_status', 'approved');
    if (query) q = q.or(`name.ilike.%${query}%,hospital.ilike.%${query}%,specialty.ilike.%${query}%`);
    if (county) q = q.eq('county', county);
    if (specialty) q = q.eq('specialization', specialty);
    const { data, error } = await q.order('name', { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return localDb.getChatContacts().filter((c: any) => c.role === 'clinician');
  }
}

export async function getClinicianById(id: string): Promise<Clinician | null> {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('id, name, specialty, hospital, county, years_experience, photo, bio, approval_status')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch { return null; }
}

// ─── Chat Contacts ────────────────────────────────────────────

export async function getChatContacts() {
  const local = localDb.getChatContacts();
  try {
    const { data: providers, error } = await supabase
      .from('providers')
      .select('id, name, specialty, hospital, approval_status')
      .eq('approval_status', 'approved')
      .order('name', { ascending: true });
    if (!error && providers && providers.length > 0) {
      const contacts = providers.map((p: any) => ({
        id: p.id, name: p.name, role: 'clinician',
        specialty: p.specialty || '', hospital: p.hospital || '', online: false,
      }));
      localDb.saveChatContacts(contacts);
      return contacts;
    }
  } catch { /* fall through */ }
  if (local.length > 0) return local;
  // Fallback to chat_contacts
  try {
    const { data, error } = await supabase
      .from('chat_contacts')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    localDb.saveChatContacts(data ?? []);
    return data ?? [];
  } catch { return local; }
}

export async function getProvidersForChat(): Promise<Clinician[]> {
  return searchClinicians();
}

// ─── Conversations ────────────────────────────────────────────

export async function getConversations(userId: string) {
  const local = localDb.getConversations(userId);
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_time', { ascending: false });
    if (error) throw error;
    return (data ?? local);
  } catch { return local; }
}

export async function getOrCreateConversation(userId: string, contactId: number, contactName: string, contactRole: string, online: boolean) {
  // Check local first
  const { getDb } = await import('./localDb');
  const db = getDb();
  const existing = db.getFirstSync(
    'SELECT * FROM conversations WHERE user_id = ? AND contact_id = ?',
    userId, contactId
  ) as any;
  if (existing) return existing;

  // Try network
  try {
    const { data: remoteExisting } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('contact_id', contactId)
      .maybeSingle();
    if (remoteExisting) {
      localDb.saveConversation({ ...remoteExisting, remote_id: String(remoteExisting.id) }, 'synced');
      return remoteExisting;
    }
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, contact_id: contactId, contact_name: contactName, contact_role: contactRole, online })
      .select()
      .single();
    if (error) throw error;
    localDb.saveConversation({ ...data, remote_id: String(data.id) }, 'synced');
    return data;
  } catch {
    // Create locally
    const localId = localDb.saveConversation({
      user_id: userId, contact_id: contactId, contact_name: contactName,
      contact_role: contactRole, online: online ? 1 : 0,
    }, 'pending');
    return { id: localId, user_id: userId, contact_id: contactId, contact_name: contactName, contact_role: contactRole, online };
  }
}

// ─── Messages ─────────────────────────────────────────────────

export async function getMessages(conversationId: number) {
  const local = localDb.getMessages(conversationId);
  try {
    // Find remote_id for this conversation
    const { getDb } = await import('./localDb');
    const db = getDb();
    const conv = db.getFirstSync('SELECT remote_id FROM conversations WHERE id = ?', conversationId) as any;
    if (!conv?.remote_id) return local;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.remote_id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      for (const m of data) {
        if (!local.find(l => l.remote_id === String(m.id))) {
          localDb.saveMessage({
            ...m, remote_id: String(m.id),
            conversation_id: conversationId, conversation_remote_id: conv.remote_id,
          }, 'synced');
        }
      }
      return localDb.getMessages(conversationId);
    }
    return local;
  } catch { return local; }
}

export async function sendMessage(contentOrOpts: string | { message?: string; content?: string; conversationId?: number; senderId?: string; senderType?: string; expertId?: number }, conversationId?: number, senderId?: string, senderType: string = 'user') {
  const opts = typeof contentOrOpts === 'object' ? contentOrOpts : null;
  const messageContent = opts?.message ?? opts?.content ?? (typeof contentOrOpts === 'string' ? contentOrOpts : '');
  const convId = opts?.conversationId ?? conversationId;
  const sId = opts?.senderId ?? senderId;
  const sType = opts?.senderType ?? senderType;

  if (!convId || !sId) return null;

  // Save locally first
  const localId = localDb.saveMessage({
    conversation_id: convId, sender_id: sId, sender_type: sType,
    message_type: 'text', content: messageContent, sync_status: 'pending',
  }, 'pending');

  // Update conversation last message locally
  localDb.updateConversationLastMessage(convId, messageContent);

  // Try to push
  try {
    const { getDb } = await import('./localDb');
    const db = getDb();
    const conv = db.getFirstSync('SELECT remote_id FROM conversations WHERE id = ?', convId) as any;
    if (!conv?.remote_id) throw new Error('No remote conversation');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conv.remote_id, sender_id: sId, sender_type: sType,
        message_type: 'text', content: messageContent,
      })
      .select()
      .single();
    if (error) throw error;
    db.runSync('UPDATE messages SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', localId);
    return data;
  } catch {
    return { id: localId, conversation_id: convId, sender_id: sId, sender_type: sType, message_type: 'text', content: messageContent, created_at: new Date().toISOString() };
  }
}

export async function sendImageMessage(content: string, conversationId: number, senderId: string, fileUrl: string, senderType: string = 'user') {
  const localId = localDb.saveMessage({
    conversation_id: conversationId, sender_id: senderId, sender_type: senderType,
    message_type: 'image', content, file_url: fileUrl, sync_status: 'pending',
  }, 'pending');

  try {
    const { getDb } = await import('./localDb');
    const db = getDb();
    const conv = db.getFirstSync('SELECT remote_id FROM conversations WHERE id = ?', conversationId) as any;
    if (!conv?.remote_id) throw new Error('No remote conversation');

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conv.remote_id, sender_id: senderId, sender_type: senderType, message_type: 'image', content, file_url: fileUrl })
      .select()
      .single();
    if (error) throw error;
    db.runSync('UPDATE messages SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', localId);
    return data;
  } catch {
    return { id: localId, conversation_id: conversationId, sender_id: senderId, message_type: 'image', content, file_url: fileUrl, created_at: new Date().toISOString() };
  }
}

export async function sendAudioMessage(conversationId: number, senderId: string, fileUrl: string, duration?: string, senderType: string = 'user') {
  const localId = localDb.saveMessage({
    conversation_id: conversationId, sender_id: senderId, sender_type: senderType,
    message_type: 'audio', file_url: fileUrl, duration: duration || '', sync_status: 'pending',
  }, 'pending');

  try {
    const { getDb } = await import('./localDb');
    const db = getDb();
    const conv = db.getFirstSync('SELECT remote_id FROM conversations WHERE id = ?', conversationId) as any;
    if (!conv?.remote_id) throw new Error('No remote conversation');

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conv.remote_id, sender_id: senderId, sender_type: senderType, message_type: 'audio', file_url: fileUrl, duration })
      .select()
      .single();
    if (error) throw error;
    db.runSync('UPDATE messages SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', localId);
    return data;
  } catch {
    return { id: localId, conversation_id: conversationId, sender_id: senderId, message_type: 'audio', file_url: fileUrl, duration, created_at: new Date().toISOString() };
  }
}

// ─── User Stats ───────────────────────────────────────────────

export async function getUserStats(userId: string) {
  const localScreenings = localDb.getScreenings(userId);
  const localVaccines = localDb.getVaccines(userId);
  const localUser = localDb.getUser(userId);

  try {
    const [screeningsRes, vaccinesRes, userRes] = await Promise.all([
      supabase.from('screenings').select('id, verdict, hpv_result', { count: 'exact', head: false }).eq('user_id', userId),
      supabase.from('vaccines').select('id, status', { count: 'exact', head: false }).eq('user_id', userId),
      supabase.from('users').select('risk_index').eq('id', userId).maybeSingle(),
    ]);
    return {
      total_screenings: screeningsRes.count ?? localScreenings.length,
      total_vaccines: vaccinesRes.count ?? localVaccines.length,
      vaccines_done: (vaccinesRes.data ?? []).filter((v: any) => v.status === 'done').length,
      hpv_positive: (screeningsRes.data ?? []).filter((s: any) => s.verdict === 'POSITIVE' || s.hpv_result === 'positive').length,
      risk_index: userRes.data?.risk_index || localUser?.risk_index || 'low',
    };
  } catch {
    return {
      total_screenings: localScreenings.length,
      total_vaccines: localVaccines.length,
      vaccines_done: localVaccines.filter((v: any) => v.status === 'done').length,
      hpv_positive: localScreenings.filter((s: any) => s.verdict === 'POSITIVE' || s.hpv_result === 'positive').length,
      risk_index: localUser?.risk_index || 'low',
    };
  }
}

// ─── Appointments (patient) ─────────────────────────────────

export async function getPatientAppointments(userId: string): Promise<Appointment[]> {
  return getAppointments(userId);
}

export async function requestAppointment(userId: string, providerId: string, date: string, time: string, title: string, notes: string, customText: string) {
  return bookAppointment({ user_id: userId, provider_id: providerId, date, time, title, notes, custom_text: customText });
}

// ─── Sample Kit Results ──────────────────────────────────────

export async function getKitResults(userId: string) {
  const local = localDb.getSampleKits(userId).filter((k: any) => k.result);
  try {
    const { data, error } = await supabase
      .from('sample_kits')
      .select('id, barcode, kit_type, status, result, result_notes, processed_at, created_at')
      .eq('patient_id', userId)
      .not('result', 'eq', '')
      .order('processed_at', { ascending: false });
    if (error) throw error;
    return data ?? local;
  } catch { return local; }
}

// ─── Consent ──────────────────────────────────────────────────

export async function syncConsent(userId: string) {
  try {
    const { error } = await supabase
      .from('consent_log')
      .insert({ user_id: userId, consent_type: 'registration', consent_terms: true, consent_medical: true, accepted: true });
    if (error) throw error;
  } catch { /* queued */ }
}

// ─── Admin helpers ─────────────────────────────────────────────

export async function getAdminDashboard() {
  try {
    const [usersRes, screeningsRes, vaccinesRes, notificationsRes] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact' }),
      supabase.from('screenings').select('*', { count: 'exact' }),
      supabase.from('vaccines').select('*', { count: 'exact' }),
      supabase.from('notifications').select('*', { count: 'exact' }),
    ]);
    if (usersRes.error) throw usersRes.error;
    const { data: totalScreenings, count: tsCount }: any = screeningsRes;
    const { data: vaccineRows }: any = vaccinesRes;
    const { data: notifRows }: any = notificationsRes;
    return {
      totalUsers: usersRes.count ?? 0,
      screeningsToday: notifRows?.filter((r: any) => r.type === 'screening' && r.created_at === new Date().toISOString().slice(0, 10)).length ?? 0,
      riskAlerts: (totalScreenings ?? []).filter((r: any) => r.risk_tier === 'HIGH').length,
      atRisk: (totalScreenings ?? []).filter((r: any) => r.risk_tier === 'HIGH').length,
      healthy: (totalScreenings ?? []).filter((r: any) => r.risk_tier === 'LOW').length,
      registered: usersRes.count ?? 0,
      screenings: tsCount ?? 0,
      hpvPositive: (totalScreenings ?? []).filter((r: any) => r.verdict === 'POSITIVE').length,
      totalVaccines: vaccineRows?.length ?? 0,
    };
  } catch { return { totalUsers: 0, screeningsToday: 0, riskAlerts: 0, atRisk: 0, healthy: 0, registered: 0, screenings: 0, hpvPositive: 0, totalVaccines: 0 }; }
}

export async function getAllUsers() {
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch { return []; }
}

export async function getUsersForAdmin() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, latest_screening:screenings!inner(verdict, risk_tier, created_at)')
      .order('created_at', { ascending: false });
    if (error) return await getAllUsers();
    return data ?? [];
  } catch { return []; }
}

export async function sendAdminNotification(userId: string, title: string, message: string) {
  localDb.saveNotification({ user_id: userId, title, message, type: 'admin', sync_status: 'pending' }, 'pending');
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, title, message, type: 'admin' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch { return { id: Date.now(), user_id: userId, title, message }; }
}

export async function createNotification(userId: string, title: string, message: string, type: string = 'info') {
  localDb.saveNotification({ user_id: userId, title, message, type, sync_status: 'pending' }, 'pending');
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, title, message, type })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch { return { id: Date.now(), user_id: userId, title, message, type }; }
}

export async function addLabResult(r: { user_id: string; patient_name: string; result: string; notes?: string }) {
  localDb.saveLabResult({ ...r, sync_status: 'pending' }, 'pending');
  try {
    const { data, error } = await supabase.from('lab_results').insert(r).select().single();
    if (error) throw error;
    return data;
  } catch { return { id: Date.now(), ...r }; }
}

export async function getTestResults(userId: string) {
  try {
    const { data, error } = await supabase.from('test_results').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch { return []; }
}

export async function addTestResult(r: { user_id: string; result: string; date: string }) {
  try {
    const { data, error } = await supabase.from('test_results').insert(r).select().single();
    if (error) throw error;
    return data;
  } catch { return { id: Date.now(), ...r }; }
}

export async function submitFeedback(payload: { user_id: string; category: string; message: string; contact?: string }) {
  localDb.saveFeedback({ ...payload, sync_status: 'pending' }, 'pending');
  try {
    const { data, error } = await supabase.from('feedback').insert(payload).select().single();
    if (error) throw error;
    return data;
  } catch { return { id: Date.now(), ...payload }; }
}

// ─── AI Assistant ─────────────────────────────────────────────

export interface AssistantResult {
  response: string;
  followUps: string[];
}

const ASSISTANT_RESPONSES: Array<{ keywords: string[]; response: string; followUps: string[] }> = [
  { keywords: ['what is hpv', 'what\'s hpv', 'hpv meaning'], response: 'HPV (Human Papillomavirus) is a very common virus. Most sexually active people get it at some point. There are over 100 types — some cause genital warts, others can cause cancer.', followUps: ['How do you get HPV?', 'Can HPV be cured?', 'What are high-risk HPV types?'] },
  { keywords: ['cervical cancer screening', 'pap smear', 'get screened'], response: 'Cervical screening checks for abnormal cells on the cervix before they become cancer. In Kenya, screening is recommended every 3-5 years for women 25-49.', followUps: ['How is a Pap smear done?', 'Does Pap smear hurt?', 'Where to get screened in Kenya?'] },
  { keywords: ['hpv vaccine', 'vaccination', 'gardasil'], response: 'The HPV vaccine protects against the most common cancer-causing HPV types. In Kenya, the vaccine is free for 9-14 year old girls through the national program.', followUps: ['Is HPV vaccine safe?', 'HPV vaccine side effects', 'Where to get HPV vaccine in Kenya?'] },
  { keywords: ['cervical cancer', 'cervical cancer symptoms'], response: 'Cervical cancer starts in the cells lining the cervix. Nearly all cases are caused by persistent high-risk HPV infection. Early cervical cancer has NO symptoms — that\'s why screening is critical.', followUps: ['Cervical cancer treatment', 'Cervical cancer survival rate', 'Cervical cancer in Kenya statistics'] },
  { keywords: ['how to prevent cervical cancer', 'prevent cervical cancer'], response: 'Cervical cancer is one of the most preventable cancers! 1) Get the HPV vaccine, 2) Get regular screening, 3) Don\'t smoke, 4) Use condoms, 5) Limit sexual partners.', followUps: ['Best diet for cervical health', 'Exercise and cancer prevention', 'How often to screen for prevention?'] },
];

export async function getAssistantResponse(question: string): Promise<AssistantResult> {
  await new Promise((r) => setTimeout(r, 600));
  const q = question.toLowerCase().trim();
  for (const entry of ASSISTANT_RESPONSES) {
    if (entry.keywords.some((kw) => q.includes(kw))) {
      return { response: entry.response, followUps: entry.followUps };
    }
  }
  return {
    response: 'I\'m still learning! For specific medical advice, please consult a healthcare provider or use the Telehealth chat.',
    followUps: ['What is HPV?', 'How to prevent?', 'When to screen?', 'Vaccine info', 'HPV symptoms'],
  };
}

// ─── Vaccines (supabase-backed) ────────────────────────────────

export async function getVaccineData(userId?: string) {
  if (userId) {
    const data = await getVaccines(userId);
    if (data.length > 0) return data.map((v: any) => ({ ...v, dueDate: v.date }));
  }
  return [
    { id: 1, name: 'HPV Dose 1', hospital: 'Kenyatta National Hospital', dueDate: '2026-08-15', status: 'upcoming' },
    { id: 2, name: 'HPV Dose 2', hospital: 'Kenyatta National Hospital', dueDate: '2026-10-15', status: 'upcoming' },
  ];
}

export async function syncVaccineReminder(data: { vaccineId: number; remindBeforeDays: number; remindDayOf?: boolean }) {
  localDb.updateVaccineReminder(data.vaccineId, !!data.remindDayOf, data.remindBeforeDays > 0);
  try {
    const { error } = await supabase
      .from('vaccines')
      .update({ reminder_before: data.remindBeforeDays > 0, reminder_day: Boolean(data.remindDayOf) })
      .eq('id', data.vaccineId);
    if (error) throw error;
    const { getDb } = await import('./localDb');
    const db = getDb();
    db.runSync('UPDATE vaccines SET sync_status = ? WHERE id = ?', 'synced', data.vaccineId);
    return { success: true };
  } catch { return { success: true }; }
}

// ─── Kit Requests ─────────────────────────────────────────────

export async function createKitRequest(userId: string) {
  const localUser = localDb.getUser(userId);
  const userName = localUser?.name || '';
  const userPhone = localUser?.phone || '';
  const userCounty = localUser?.county || '';
  const userSubCounty = localUser?.sub_county || '';
  const userWard = localUser?.ward || '';

  localDb.saveKitRequest({
    user_id: userId, user_name: userName, user_phone: userPhone,
    user_county: userCounty, user_sub_county: userSubCounty, user_ward: userWard,
    sync_status: 'pending',
  }, 'pending');

  try {
    const { data: user, error: userErr } = await supabase
      .from('users').select('name, phone, county, sub_county, ward').eq('id', userId).single();
    if (userErr) throw userErr;
    const { data, error } = await supabase
      .from('kit_requests')
      .insert({ user_id: userId, user_name: user?.name || '', user_phone: user?.phone || '', user_county: user?.county || '', user_sub_county: user?.sub_county || '', user_ward: user?.ward || '' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch { return { id: Date.now(), user_id: userId }; }
}

export async function getKitRequests() {
  try {
    const { data, error } = await supabase.from('kit_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch { return localDb.getKitRequests(); }
}

export async function updateKitRequest(id: number, updates: { status?: string; admin_notes?: string; notes?: string }) {
  localDb.updateKitRequest(id, updates);
  try {
    const { data, error } = await supabase
      .from('kit_requests')
      .update({ ...updates, ...(updates.status === 'contacted' ? { contacted_at: new Date().toISOString() } : {}), ...(updates.status === 'delivered' ? { delivered_at: new Date().toISOString() } : {}) })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const { getDb } = await import('./localDb');
    const db = getDb();
    db.runSync('UPDATE kit_requests SET sync_status = ? WHERE id = ?', 'synced', id);
    return data;
  } catch { return { id, ...updates }; }
}

// ─── Sample Kit Tracking ─────────────────────────────────────

const KIT_API = 'https://cervitrack.vercel.app/api/sample-kits';

export async function scanKit(barcode: string): Promise<Kit | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${KIT_API}/scan/${encodeURIComponent(barcode)}`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const kit = await res.json();
      localDb.saveSampleKit({ ...kit, remote_id: kit.id, barcode: kit.barcode || barcode }, 'synced');
      return kit;
    }
    return localDb.getSampleKitByBarcode(barcode);
  } catch { return localDb.getSampleKitByBarcode(barcode); }
}

export async function registerKit(barcode: string, data: { facilityId?: string; registeredBy?: string; registeredByName?: string; kitType?: string }): Promise<Kit | null> {
  localDb.saveSampleKit({ barcode, kit_type: data.kitType || 'hpv', status: 'REGISTERED', facility_id: data.facilityId || '', sync_status: 'pending' }, 'pending');
  try {
    const res = await fetch(KIT_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', barcode, ...data }) });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

export async function pairKit(barcode: string, data: { patientId: string; patientName: string; pairedBy: string; pairedByName: string }): Promise<Kit | null> {
  try {
    const res = await fetch(KIT_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pair', barcode, ...data }) });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

export async function collectKit(barcode: string, data: { collectedBy: string; collectedByName: string; collectionMethod: string; location?: string; notes?: string }): Promise<Kit | null> {
  try {
    const res = await fetch(KIT_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'collect', barcode, ...data }) });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

export async function linkKit(barcode: string, data: { patientId: string; patientName: string; linkedBy: string; linkedByName: string }): Promise<{ kit: Kit; notification: boolean } | null> {
  try {
    const res = await fetch(`${KIT_API}/link`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barcode, ...data }) });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

export async function searchPatients(query: string): Promise<Array<{ id: string; name: string; patient_id: string; phone: string; county: string }>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, patient_id, phone, county')
      .eq('role', 'patient')
      .or(`name.ilike.%${query}%,patient_id.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(20);
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

export async function getKitStats() {
  try {
    const res = await fetch(`${KIT_API}/stats`);
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

// ─── Self-sampling guide ───────────────────────────────────────

export async function getSamplingGuide() {
  return [
    { step: 1, title: 'Prepare', description: 'Avoid sexual intercourse, douching, or using vaginal medications for 48 hours before your test.', icon: 'clipboard', duration: '48 hours before' },
    { step: 2, title: 'Visit a Facility', description: 'Visit any of our partner health facilities. The procedure takes about 10-15 minutes.', icon: 'hospital', duration: '10-15 min' },
    { step: 3, title: 'Sample Collection', description: 'A health worker will collect a sample from your cervix using a small brush or spatula.', icon: 'flask', duration: '2-3 min' },
    { step: 4, title: 'Lab Analysis', description: 'Your sample is sent to a laboratory for analysis. Results are typically ready within 2 weeks.', icon: 'microscope', duration: '1-2 weeks' },
    { step: 5, title: 'Get Results', description: 'Receive your results through the app. Our team will contact you if follow-up is needed.', icon: 'file-text', duration: 'Instant' },
  ];
}

// Re-export sync helpers
export { getLastFullSync } from './sync';
