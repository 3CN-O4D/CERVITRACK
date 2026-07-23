import { supabase } from '../lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

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

// ─── Realtime helpers ─────────────────────────────────────────

export function onMessagesInsert(conversationId: number, cb: (msg: any) => void) {
  return supabase
    .channel(`conv:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload) => cb(payload.new as any))
    .subscribe();
}

export function onNotificationsChange(userId: string, cb: (notif: any) => void) {
  return supabase
    .channel(`user:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, (payload) => cb(payload.new as any))
    .subscribe();
}

// ─── Articles ─────────────────────────────────────────────────

export async function getArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, summary, image, category, read_time')
    .order('id', { ascending: true });
  if (error) throw error;
  return data as Article[];
}

export async function getArticleById(id: number) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─── Facilities ────────────────────────────────────────────────

export async function getFacilities() {
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .order('distance', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ─── Screenings ────────────────────────────────────────────────

export async function getScreenings(profileId: string): Promise<Screening[]> {
  const { data, error } = await supabase
    .from('screenings')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Screening[];
}

export async function submitScreening(profileId: string, p: ScreeningPayload): Promise<Screening> {
  const { data, error } = await supabase
    .from('screenings')
    .insert({ ...p, profile_id: profileId })
    .select()
    .single();
  if (error) throw error;
  return data as Screening;
}

// ─── Vaccines ─────────────────────────────────────────────────

export async function getVaccines(userId: string): Promise<Vaccine[]> {
  const { data, error } = await supabase
    .from('vaccines')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Vaccine[];
}

export async function addVaccine(v: Partial<Vaccine> & { user_id: string }) {
  const { data, error } = await supabase
    .from('vaccines')
    .insert(v)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateVaccineStatus(id: number, status: string) {
  const { data, error } = await supabase
    .from('vaccines')
    .update({ status, reminder_day: status !== 'upcoming', reminder_before: false })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Appointments ──────────────────────────────────────────────

export async function getAppointments(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Appointment[];
}

export async function bookAppointment(a: Partial<Appointment> & { user_id: string; date: string }) {
  const payload: any = {
    user_id: a.user_id,
    title: a.title,
    facility: a.facility,
    facility_name: a.facility_name,
    facility_location: a.facility_location,
    date: a.date,
    notes: a.notes,
    custom_text: a.custom_text,
    clinician_id: a.clinician_id,
    provider_id: a.provider_id,
    time: a.time,
    status: a.status || 'pending',
  };
  const { data, error } = await supabase
    .from('appointments')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Notifications ─────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationRead(id: number, userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Lab Results ───────────────────────────────────────────────

export async function getLabResults(userId: string) {
  const { data, error } = await supabase
    .from('lab_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─── Clinicians (providers) ──────────────────────────────────

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

export async function searchClinicians(query?: string, county?: string, specialty?: string): Promise<Clinician[]> {
  let q = supabase
    .from('providers')
    .select('id, name, specialty, hospital, county, years_experience, photo, bio, approval_status')
    .eq('approval_status', 'approved');

  if (query) {
    q = q.or(`name.ilike.%${query}%,hospital.ilike.%${query}%,specialty.ilike.%${query}%`);
  }
  if (county) {
    q = q.eq('county', county);
  }
  if (specialty) {
    q = q.eq('specialization', specialty);
  }

  const { data, error } = await q.order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getClinicianById(id: string): Promise<Clinician | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('id, name, specialty, hospital, county, years_experience, photo, bio, approval_status')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─── Chat Contacts (from providers table) ───────────────────

export async function getChatContacts() {
  // First try providers table (real clinicians)
  try {
    const { data: providers, error } = await supabase
      .from('providers')
      .select('id, name, specialty, hospital, approval_status')
      .eq('approval_status', 'approved')
      .order('name', { ascending: true });

    if (!error && providers && providers.length > 0) {
      return providers.map((p: any) => ({
        id: p.id,
        name: p.name,
        role: 'clinician',
        specialty: p.specialty || '',
        hospital: p.hospital || '',
        online: true,
      }));
    }
  } catch { /* fall through to chat_contacts */ }

  // Fallback to seeded chat_contacts
  const { data, error } = await supabase
    .from('chat_contacts')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getProvidersForChat(): Promise<Clinician[]> {
  return searchClinicians();
}

// ─── Conversations ─────────────────────────────────────────────

export async function getConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, contact:chat_contacts(*)')
    .eq('user_id', userId)
    .order('last_time', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getOrCreateConversation(userId: string, contactId: number, contactName: string, contactRole: string, online: boolean) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, contact_id: contactId, contact_name: contactName, contact_role: contactRole, online })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Messages ──────────────────────────────────────────────────

export async function getMessages(conversationId: number) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(contentOrOpts: string | { message?: string; content?: string; conversationId?: number; senderId?: string; senderType?: string; expertId?: number }, conversationId?: number, senderId?: string, senderType: string = 'user') {
  const opts = typeof contentOrOpts === 'object' ? contentOrOpts : null;
  const messageContent = opts?.message ?? opts?.content ?? (typeof contentOrOpts === 'string' ? contentOrOpts : '');
  const convId = opts?.conversationId ?? conversationId;
  const sId = opts?.senderId ?? senderId;
  const sType = opts?.senderType ?? senderType;

  if (!convId || !sId) {
    console.warn('sendMessage: missing conversationId or senderId');
    return null;
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: convId,
      sender_id: sId,
      sender_type: sType,
      message_type: 'text',
      content: messageContent,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function sendImageMessage(content: string, conversationId: number, senderId: string, fileUrl: string, senderType: string = 'user') {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      sender_type: senderType,
      message_type: 'image',
      content,
      file_url: fileUrl,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function sendAudioMessage(conversationId: number, senderId: string, fileUrl: string, duration?: string, senderType: string = 'user') {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      sender_type: senderType,
      message_type: 'audio',
      file_url: fileUrl,
      duration,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── User Stats ────────────────────────────────────────────────

export async function getUserStats(userId: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('total_screenings, total_vaccines, last_screening_date, risk_index')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return user ?? { total_screenings: 0, total_vaccines: 0, last_screening_date: null, risk_index: 'low' };
}

// ─── Appointments (patient) ─────────────────────────────────

export async function getPatientAppointments(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, provider:providers!appointments_provider_id_fkey(name, specialty, hospital)')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) {
    // Fallback without join
    const { data: fallback, error: e2 } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (e2) throw e2;
    return (fallback ?? []) as Appointment[];
  }
  return (data ?? []) as Appointment[];
}

export async function requestAppointment(userId: string, providerId: string, date: string, time: string, title: string, notes: string, customText: string) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      provider_id: providerId,
      date,
      time,
      title,
      notes,
      custom_text: customText,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;

  // Notify the provider
  try {
    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('id', providerId)
      .maybeSingle();
    if (provider) {
      const { data: patient } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .maybeSingle();
      await supabase.from('notifications').insert({
        user_id: userId, // patient gets confirmation
        title: 'Appointment Requested',
        message: `Your appointment request for ${date} has been sent.`,
        type: 'appointment',
      });
    }
  } catch { /* notification is nice-to-have */ }

  return data;
}

// ─── Sample Kit Results (for patients) ──────────────────────

export async function getKitResults(userId: string) {
  const { data, error } = await supabase
    .from('sample_kits')
    .select('id, barcode, kit_type, status, result, result_notes, processed_at, created_at')
    .eq('patient_id', userId)
    .not('result', 'eq', '')
    .order('processed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─── Consent ──────────────────────────────────────────────────

export async function syncConsent(userId: string) {
  const { error } = await supabase
    .from('consent_log')
    .insert({
      user_id: userId,
      consent_type: 'registration',
      consent_terms: true,
      consent_medical: true,
      accepted: true,
    });
  if (error) throw error;
}

// ─── Admin helpers ─────────────────────────────────────────────

export async function getAdminDashboard() {
  const [
    usersRes, screeningsRes, vaccinesRes, notificationsRes
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact' }),
    supabase.from('screenings').select('*', { count: 'exact' }),
    supabase.from('vaccines').select('*', { count: 'exact' }),
    supabase.from('notifications').select('*', { count: 'exact' }),
  ]);

  if (usersRes.error) throw usersRes.error;

  const {
    data: totalScreenings,
    count: tsCount,
  }: any = screeningsRes;
  const {
    data: vaccineRows,
  }: any = vaccinesRes;
  const {
    data: notifRows,
  }: any = notificationsRes;

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
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getUsersForAdmin() {
  const { data, error } = await supabase
    .from('users')
    .select('*, latest_screening:screenings!inner(verdict, risk_tier, created_at)')
    .order('created_at', { ascending: false });
  if (error) return await getAllUsers();
  return data ?? [];
}

export async function sendAdminNotification(userId: string, title: string, message: string) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type: 'admin' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createNotification(userId: string, title: string, message: string, type: string = 'info') {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addLabResult(r: { user_id: string; patient_name: string; result: string; notes?: string }) {
  const { data, error } = await supabase
    .from('lab_results')
    .insert(r)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTestResults(userId: string) {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addTestResult(r: { user_id: string; result: string; date: string }) {
  const { data, error } = await supabase
    .from('test_results')
    .insert(r)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitFeedback(payload: { user_id: string; category: string; message: string; contact?: string }) {
  const { data, error } = await supabase
    .from('feedback')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── AI Assistant

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

export async function syncVaccineReminder(data: { vaccineId: number; remindBeforeDays: number }) {
  const supabase = (await import('../lib/supabase/client')).supabase;
  const { error } = await supabase
    .from('vaccines')
    .update({ reminder_before: data.remindBeforeDays > 0, reminder_day: false })
    .eq('id', data.vaccineId);
  if (error) throw error;
  return { success: true };
}

// Re-export getLastFullSync from sync service
export { getLastFullSync } from '../services/sync';

// ─── Sample Kit Tracking ─────────────────────────────────────

const KIT_API = 'https://cervitrack.vercel.app/api/sample-kits';

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

export async function scanKit(barcode: string): Promise<Kit | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${KIT_API}/scan/${encodeURIComponent(barcode)}`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

export async function registerKit(barcode: string, data: { facilityId?: string; registeredBy?: string; registeredByName?: string; kitType?: string }): Promise<Kit | null> {
  try {
    const res = await fetch(KIT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', barcode, ...data }),
    });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

export async function pairKit(barcode: string, data: { patientId: string; patientName: string; pairedBy: string; pairedByName: string }): Promise<Kit | null> {
  try {
    const res = await fetch(KIT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pair', barcode, ...data }),
    });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

export async function collectKit(barcode: string, data: { collectedBy: string; collectedByName: string; collectionMethod: string; location?: string; notes?: string }): Promise<Kit | null> {
  try {
    const res = await fetch(KIT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'collect', barcode, ...data }),
    });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

export async function linkKit(barcode: string, data: {
  patientId: string;
  patientName: string;
  linkedBy: string;
  linkedByName: string;
}): Promise<{ kit: Kit; notification: boolean } | null> {
  try {
    const res = await fetch(`${KIT_API}/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode, ...data }),
    });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

export async function searchPatients(query: string): Promise<Array<{ id: string; name: string; patient_id: string; phone: string; county: string }>> {
  try {
    const { supabase } = await import('../lib/supabase/client');
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
