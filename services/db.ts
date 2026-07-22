import * as api from './api';
import type { Session } from '@supabase/supabase-js';

let currentSession: Session | null = null;

export function setSession(session: Session | null) {
  currentSession = session;
}

async function requireUser() {
  const { data: { session } } = await (await import('../lib/supabase/client')).supabase.auth.getSession();
  return session?.user;
}

// ─── Facilities ───────────────────────────────────────────────
export async function getFacilities() {
  return api.getFacilities(); // falls back to seeded data inside
}

export async function replaceFacilities(facilities: any[]) {
  const { data, error } = await (await import('../lib/supabase/client')).supabase
    .from('facilities')
    .upsert(facilities, { onConflict: 'id' });
  if (error) throw error;
  return data ?? [];
}

export async function getArticles() {
  return api.getArticles();
}

export async function getArticleById(id: number) {
  return api.getArticleById(id);
}

export async function replaceArticles(articles: any[]) {
  const supabase = (await import('../lib/supabase/client')).supabase;
  const { error } = await supabase
    .from('articles')
    .upsert(articles, { onConflict: 'id' });
  if (error) throw error;
}

// ─── Screenings ───────────────────────────────────────────────
export async function getScreenings(profileId: number) {
  const uid = (await requireUser())?.id ?? String(profileId);
  return api.getScreenings(uid);
}

export async function saveScreening(s: any) {
  const user = await requireUser();
  if (!user) throw new Error('Not authenticated');
  const payload: api.ScreeningPayload = {
    profile_id: user.id,
    verdict: s.verdict ?? 'NEGATIVE',
    risk_tier: s.risk_tier ?? 'LOW',
    age: s.age,
    parity: s.parity,
    vaccination: s.vaccination,
    previous_screening: s.previous_screening,
    hiv_status: s.hiv_status,
    smoking: s.smoking,
    symptoms: s.symptoms,
    family_history: s.family_history,
    score: s.score,
  };
  const result = await api.submitScreening(user.id, payload);
  return result;
}

export async function getUnsyncedScreenings() {
  return [];
}

export async function markScreeningSynced(_id: number) {
  // no-op with Supabase — data is always synced
}

// ─── Vaccines ─────────────────────────────────────────────────
export async function getVaccines(userId: number) {
  const uid = (await requireUser())?.id ?? String(userId);
  return api.getVaccines(uid);
}

export async function saveVaccine(v: any) {
  const user = await requireUser();
  if (!user) throw new Error('Not authenticated');
  return api.addVaccine({ ...v, user_id: user.id });
}

export async function updateVaccineStatus(id: number, status: string) {
  return api.updateVaccineStatus(id, status);
}

// ─── Appointments ─────────────────────────────────────────────
export async function getAppointments(userId: number) {
  const uid = (await requireUser())?.id ?? String(userId);
  return api.getAppointments(uid);
}

export async function saveAppointment(a: any) {
  const user = await requireUser();
  if (!user) throw new Error('Not authenticated');
  return api.bookAppointment({ ...a, user_id: user.id, date: a.date ?? a.created_at });
}

// ─── Notifications ────────────────────────────────────────────
export async function getNotifications(userId: number) {
  const uid = (await requireUser())?.id ?? String(userId);
  return api.getNotifications(uid);
}

export async function saveNotification(n: any) {
  const user = await requireUser();
  if (!user) throw new Error('Not authenticated');
  await (await import('../lib/supabase/client')).supabase
    .from('notifications')
    .insert({ ...n, user_id: user.id });
}

export async function markNotificationRead(id: number) {
  const user = await requireUser();
  if (!user) return;
  await api.markNotificationRead(id, user.id);
}

// ─── Chat contacts ────────────────────────────────────────────
export async function getChatContacts() {
  return api.getChatContacts();
}

export async function getConversations(userId: number) {
  const uid = (await requireUser())?.id ?? String(userId);
  return api.getConversations(uid);
}

export async function getOrCreateConversation(userId: string | number, contactId: number, contactName: string, contactRole: string, online: boolean | number) {
  const uid = (await requireUser())?.id ?? String(userId);
  return api.getOrCreateConversation(uid, contactId, contactName, contactRole, online === 1);
}

export async function getMessages(conversationId: number) {
  return api.getMessages(conversationId);
}

export async function saveMessage(m: any) {
  const user = await requireUser();
  if (!user) throw new Error('Not authenticated');
  const { conversation_id, sender_type = 'user', content, file_url, duration, message_type = 'text' } = m;
  if (message_type === 'image' && file_url) {
    return api.sendImageMessage(content ?? '', conversation_id, user.id, file_url, sender_type);
  }
  if (message_type === 'audio' && file_url) {
    return api.sendAudioMessage(conversation_id, user.id, file_url, duration, sender_type);
  }
  return api.sendMessage(content ?? '', conversation_id, user.id, sender_type);
}

export async function updateConversationLastMessage(conversationId: number, lastMessage: string) {
  const supabase = (await import('../lib/supabase/client')).supabase;
  await supabase
    .from('conversations')
    .update({ last_message: lastMessage, last_time: new Date().toISOString() })
    .eq('id', conversationId);
}

// ─── Sync tracking ────────────────────────────────────────────
export async function getLastSync(tableName: string) {
  return api.getLastFullSync();
}

export async function setLastSync(tableName: string) {
  // no-op: not needed with Supabase real-time
}

// ─── Legacy initDatabase entry point ──────────────────────────
export async function initDatabase() {
  // no-op: kept for App.tsx compatibility
}

export async function getDatabase() {
  throw new Error('getDatabase() is deprecated — use services/api.ts instead');
}

export default {
  initDatabase,
  getDatabase,
  getFacilities,
  replaceFacilities,
  getArticles,
  getArticleById,
  replaceArticles,
  getScreenings,
  saveScreening,
  getUnsyncedScreenings,
  markScreeningSynced,
  getVaccines,
  saveVaccine,
  updateVaccineStatus,
  getAppointments,
  saveAppointment,
  getNotifications,
  saveNotification,
  markNotificationRead,
  getChatContacts,
  getConversations,
  getOrCreateConversation,
  getMessages,
  saveMessage,
  updateConversationLastMessage,
  getLastSync,
  setLastSync,
};
