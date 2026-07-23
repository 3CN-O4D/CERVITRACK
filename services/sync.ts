import { supabase, type Session } from '../lib/supabase/client';
import {
  getSyncQueue,
  removeSyncQueueItem,
  incrementRetry,
  getSyncMeta,
  setSyncMeta,
  saveScreening,
  saveVaccine,
  saveAppointment,
  saveNotification,
  saveMessage,
  saveConversation,
  saveArticle,
  deleteArticle,
  saveFacilities,
  saveLabResult,
  saveKitRequest,
  saveSampleKit,
  saveChatContacts,
  markSynced,
} from './localDb';

let isSyncing = false;
let syncListeners: Array<() => void> = [];

export function onSyncStateChange(cb: () => void) {
  syncListeners.push(cb);
  return () => { syncListeners = syncListeners.filter(l => l !== cb); };
}

function notifyListeners() {
  syncListeners.forEach(l => l());
}

export function getIsSyncing() {
  return isSyncing;
}

// ─── Push: Send pending local changes to Supabase ─────────────

async function pushScreenings(session: Session) {
  const { getDb } = await import('./localDb');
  const db = getDb();
  const pending = db.getAllSync(
    "SELECT * FROM screenings WHERE sync_status = 'pending'"
  ) as any[];
  for (const row of pending) {
    try {
      if (row.remote_id) {
        const { error } = await supabase
          .from('screenings')
          .update({
            verdict: row.verdict,
            risk_tier: row.risk_tier,
            age: row.age,
            parity: row.parity,
            vaccination: row.vaccination,
            previous_screening: row.previous_screening,
            hiv_status: row.hiv_status,
            smoking: row.smoking,
            symptoms: row.symptoms,
            family_history: row.family_history,
            hpv_result: row.hpv_result,
            score: row.score,
          })
          .eq('id', row.remote_id);
        if (!error) markSynced('screenings', row.id);
      } else {
        const { data, error } = await supabase
          .from('screenings')
          .insert({
            profile_id: row.profile_id,
            user_id: row.user_id,
            verdict: row.verdict,
            risk_tier: row.risk_tier,
            age: row.age,
            parity: row.parity,
            vaccination: row.vaccination,
            previous_screening: row.previous_screening,
            hiv_status: row.hiv_status,
            smoking: row.smoking,
            symptoms: row.symptoms,
            family_history: row.family_history,
            hpv_result: row.hpv_result,
            score: row.score,
          })
          .select('id')
          .single();
        if (!error && data) {
          db.runSync('UPDATE screenings SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
        }
      }
    } catch { incrementRetry(row.id); }
  }
}

async function pushVaccines(session: Session) {
  const { getDb } = await import('./localDb');
  const db = getDb();
  const pending = db.getAllSync(
    "SELECT * FROM vaccines WHERE sync_status = 'pending'"
  ) as any[];
  for (const row of pending) {
    try {
      if (row.remote_id) {
        const { error } = await supabase
          .from('vaccines')
          .update({ status: row.status, reminder_day: !!row.reminder_day, reminder_before: !!row.reminder_before })
          .eq('id', row.remote_id);
        if (!error) markSynced('vaccines', row.id);
      } else {
        const { data, error } = await supabase
          .from('vaccines')
          .insert({ user_id: row.user_id, name: row.name, hospital: row.hospital, date: row.date, status: row.status })
          .select('id')
          .single();
        if (!error && data) {
          db.runSync('UPDATE vaccines SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
        }
      }
    } catch { incrementRetry(row.id); }
  }
}

async function pushAppointments(session: Session) {
  const { getDb } = await import('./localDb');
  const db = getDb();
  const pending = db.getAllSync(
    "SELECT * FROM appointments WHERE sync_status = 'pending'"
  ) as any[];
  for (const row of pending) {
    try {
      if (row.remote_id) {
        const { error } = await supabase
          .from('appointments')
          .update({ status: row.status, notes: row.notes })
          .eq('id', row.remote_id);
        if (!error) markSynced('appointments', row.id);
      } else {
        const { data, error } = await supabase
          .from('appointments')
          .insert({
            user_id: row.user_id, clinician_id: row.clinician_id, provider_id: row.provider_id,
            title: row.title, facility: row.facility, facility_name: row.facility_name,
            facility_location: row.facility_location, date: row.date, time: row.time,
            notes: row.notes, custom_text: row.custom_text, status: row.status,
          })
          .select('id')
          .single();
        if (!error && data) {
          db.runSync('UPDATE appointments SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
        }
      }
    } catch { incrementRetry(row.id); }
  }
}

async function pushNotifications(session: Session) {
  const { getDb } = await import('./localDb');
  const db = getDb();
  const pending = db.getAllSync(
    "SELECT * FROM notifications WHERE sync_status = 'pending'"
  ) as any[];
  for (const row of pending) {
    try {
      if (row.remote_id) {
        await supabase.from('notifications').update({ read: !!row.read }).eq('id', row.remote_id);
        markSynced('notifications', row.id);
      } else if (row.user_id) {
        const { data, error } = await supabase
          .from('notifications')
          .insert({ user_id: row.user_id, title: row.title, message: row.message, type: row.type, read: !!row.read })
          .select('id')
          .single();
        if (!error && data) {
          db.runSync('UPDATE notifications SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
        }
      }
    } catch { incrementRetry(row.id); }
  }
}

async function pushMessages(session: Session) {
  const { getDb } = await import('./localDb');
  const db = getDb();
  const pending = db.getAllSync(
    "SELECT * FROM messages WHERE sync_status = 'pending'"
  ) as any[];
  for (const row of pending) {
    try {
      if (row.remote_id) continue; // already synced
      const convId = row.conversation_remote_id || (() => {
        const conv = db.getFirstSync('SELECT remote_id FROM conversations WHERE id = ?', row.conversation_id) as any;
        return conv?.remote_id;
      })();
      if (!convId) continue;

      const insertPayload: any = {
        conversation_id: convId,
        sender_id: row.sender_id,
        sender_type: row.sender_type,
        message_type: row.message_type,
        content: row.content,
      };
      if (row.file_url) insertPayload.file_url = row.file_url;
      if (row.duration) insertPayload.duration = row.duration;

      const { data, error } = await supabase
        .from('messages')
        .insert(insertPayload)
        .select('id')
        .single();
      if (!error && data) {
        db.runSync('UPDATE messages SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
      }
    } catch { incrementRetry(row.id); }
  }
}

async function pushConversations(session: Session) {
  const { getDb } = await import('./localDb');
  const db = getDb();
  const pending = db.getAllSync(
    "SELECT * FROM conversations WHERE sync_status = 'pending'"
  ) as any[];
  for (const row of pending) {
    try {
      if (row.remote_id) continue;
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: row.user_id,
          contact_id: row.contact_id,
          contact_name: row.contact_name,
          contact_role: row.contact_role,
          online: !!row.online,
          last_message: row.last_message,
          last_time: row.last_time,
        })
        .select('id')
        .single();
      if (!error && data) {
        db.runSync('UPDATE conversations SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
      }
    } catch { incrementRetry(row.id); }
  }
}

async function pushFeedback(session: Session) {
  const { getDb } = await import('./localDb');
  const db = getDb();
  const pending = db.getAllSync(
    "SELECT * FROM feedback WHERE sync_status = 'pending'"
  ) as any[];
  for (const row of pending) {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert({ user_id: row.user_id, category: row.category, message: row.message, contact: row.contact })
        .select('id')
        .single();
      if (!error && data) {
        db.runSync('UPDATE feedback SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
      }
    } catch { incrementRetry(row.id); }
  }
}

async function pushLabResults(session: Session) {
  const { getDb } = await import('./localDb');
  const db = getDb();
  const pending = db.getAllSync(
    "SELECT * FROM lab_results WHERE sync_status = 'pending'"
  ) as any[];
  for (const row of pending) {
    try {
      const { data, error } = await supabase
        .from('lab_results')
        .insert({ user_id: row.user_id, patient_name: row.patient_name, result: row.result, notes: row.notes })
        .select('id')
        .single();
      if (!error && data) {
        db.runSync('UPDATE lab_results SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
      }
    } catch { incrementRetry(row.id); }
  }
}

async function pushKitRequests(session: Session) {
  const { getDb } = await import('./localDb');
  const db = getDb();
  const pending = db.getAllSync(
    "SELECT * FROM kit_requests WHERE sync_status = 'pending'"
  ) as any[];
  for (const row of pending) {
    try {
      if (row.remote_id) {
        const { error } = await supabase
          .from('kit_requests')
          .update({ status: row.status, admin_notes: row.admin_notes, notes: row.notes })
          .eq('id', row.remote_id);
        if (!error) markSynced('kit_requests', row.id);
      } else {
        const { data, error } = await supabase
          .from('kit_requests')
          .insert({
            user_id: row.user_id, user_name: row.user_name, user_phone: row.user_phone,
            user_county: row.user_county, user_sub_county: row.user_sub_county,
            user_ward: row.user_ward, status: row.status, notes: row.notes,
          })
          .select('id')
          .single();
        if (!error && data) {
          db.runSync('UPDATE kit_requests SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
        }
      }
    } catch { incrementRetry(row.id); }
  }
}

// ─── Pull: Fetch remote changes to local SQLite ───────────────

async function pullScreenings(userId: string) {
  const lastSync = getSyncMeta('screenings_synced_at');
  const query = supabase
    .from('screenings')
    .select('*')
    .or(`profile_id.eq.${userId},user_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (lastSync) query.gt('created_at', lastSync);
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  for (const row of data) {
    const existing = db.getFirstSync(
      'SELECT id FROM screenings WHERE remote_id = ?',
      String(row.id)
    ) as any;
    if (existing) {
      db.runSync(
        `UPDATE screenings SET verdict = ?, risk_tier = ?, hpv_result = ?, score = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.verdict, row.risk_tier, row.hpv_result ?? '', row.score ?? null, String(row.id)
      );
    } else {
      saveScreening({ ...row, remote_id: String(row.id), profile_id: row.profile_id, user_id: row.user_id }, 'synced');
    }
  }
  setSyncMeta('screenings_synced_at', new Date().toISOString());
}

async function pullVaccines(userId: string) {
  const lastSync = getSyncMeta('vaccines_synced_at');
  const query = supabase
    .from('vaccines')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (lastSync) query.gt('created_at', lastSync);
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  for (const row of data) {
    const existing = db.getFirstSync('SELECT id FROM vaccines WHERE remote_id = ?', String(row.id)) as any;
    if (existing) {
      db.runSync(
        `UPDATE vaccines SET name = ?, hospital = ?, date = ?, status = ?, reminder_day = ?, reminder_before = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.name, row.hospital ?? '', row.date ?? '', row.status, row.reminder_day ? 1 : 0, row.reminder_before ? 1 : 0, String(row.id)
      );
    } else {
      saveVaccine({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
  setSyncMeta('vaccines_synced_at', new Date().toISOString());
}

async function pullAppointments(userId: string) {
  const lastSync = getSyncMeta('appointments_synced_at');
  const query = supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (lastSync) query.gt('created_at', lastSync);
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  for (const row of data) {
    const existing = db.getFirstSync('SELECT id FROM appointments WHERE remote_id = ?', String(row.id)) as any;
    if (existing) {
      db.runSync(
        `UPDATE appointments SET title = ?, status = ?, date = ?, time = ?, notes = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.title ?? '', row.status, row.date ?? '', row.time ?? '', row.notes ?? '', String(row.id)
      );
    } else {
      saveAppointment({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
  setSyncMeta('appointments_synced_at', new Date().toISOString());
}

async function pullNotifications(userId: string) {
  const lastSync = getSyncMeta('notifications_synced_at');
  const query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (lastSync) query.gt('created_at', lastSync);
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  for (const row of data) {
    const existing = db.getFirstSync('SELECT id FROM notifications WHERE remote_id = ?', String(row.id)) as any;
    if (existing) {
      db.runSync(
        `UPDATE notifications SET title = ?, message = ?, type = ?, read = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.title ?? '', row.message ?? '', row.type ?? '', row.read ? 1 : 0, String(row.id)
      );
    } else {
      saveNotification({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
  setSyncMeta('notifications_synced_at', new Date().toISOString());
}

async function pullArticles() {
  const lastSync = getSyncMeta('articles_synced_at');
  const query = supabase
    .from('articles')
    .select('id, title, summary, content, image, category, read_time')
    .order('id', { ascending: true });
  if (lastSync) query.gt('updated_at', lastSync).or('updated_at.is.null');
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  for (const row of data) {
    const existing = db.getFirstSync('SELECT id FROM articles WHERE id = ?', row.id) as any;
    if (existing) {
      db.runSync(
        `UPDATE articles SET title = ?, summary = ?, content = ?, image = ?, category = ?, read_time = ? WHERE id = ?`,
        row.title, row.summary ?? '', row.content ?? '', row.image ?? '', row.category ?? '', row.read_time ?? '', row.id
      );
    } else {
      saveArticle(row);
    }
  }
  setSyncMeta('articles_synced_at', new Date().toISOString());
}

async function pullFacilities() {
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .order('distance', { ascending: true });
  if (error || !data) return;

  saveFacilities(data);
  setSyncMeta('facilities_synced_at', new Date().toISOString());
}

async function pullConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('last_time', { ascending: false });
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  for (const row of data) {
    const existing = db.getFirstSync('SELECT id FROM conversations WHERE remote_id = ?', String(row.id)) as any;
    if (existing) {
      db.runSync(
        `UPDATE conversations SET contact_name = ?, contact_role = ?, online = ?, last_message = ?, last_time = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.contact_name ?? '', row.contact_role ?? '', row.online ? 1 : 0,
        row.last_message ?? '', row.last_time ?? '', String(row.id)
      );
    } else {
      saveConversation({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
}

async function pullMessages(userId: string) {
  // Pull messages for all conversations
  const { getDb } = await import('./localDb');
  const db = getDb();
  const conversations = db.getAllSync(
    'SELECT * FROM conversations WHERE user_id = ?', userId
  ) as any[];

  for (const conv of conversations) {
    if (!conv.remote_id) continue;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.remote_id)
      .order('created_at', { ascending: true });
    if (error || !data) continue;

    for (const row of data) {
      const existing = db.getFirstSync('SELECT id FROM messages WHERE remote_id = ?', String(row.id)) as any;
      if (!existing) {
        saveMessage({
          ...row,
          remote_id: String(row.id),
          conversation_id: conv.id,
          conversation_remote_id: conv.remote_id,
        }, 'synced');
      }
    }
  }
}

async function pullChatContacts() {
  const { data, error } = await supabase
    .from('providers')
    .select('id, name, specialty, hospital, approval_status')
    .eq('approval_status', 'approved')
    .order('name', { ascending: true });
  if (error || !data) return;

  saveChatContacts(data.map(p => ({
    id: p.id,
    name: p.name,
    role: 'clinician',
    specialty: p.specialty || '',
    hospital: p.hospital || '',
    online: false,
  })));
}

async function pullLabResults(userId: string) {
  const { data, error } = await supabase
    .from('lab_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  for (const row of data) {
    const existing = db.getFirstSync('SELECT id FROM lab_results WHERE remote_id = ?', String(row.id)) as any;
    if (!existing) {
      saveLabResult({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
}

async function pullSampleKits(userId: string) {
  const { data, error } = await supabase
    .from('sample_kits')
    .select('*')
    .eq('patient_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  for (const row of data) {
    const existing = db.getFirstSync('SELECT id FROM sample_kits WHERE remote_id = ?', String(row.id)) as any;
    if (existing) {
      db.runSync(
        `UPDATE sample_kits SET status = ?, result = ?, result_notes = ?, processed_at = ?, collected_at = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.status, row.result ?? '', row.result_notes ?? '', row.processed_at ?? '', row.collected_at ?? '', String(row.id)
      );
    } else {
      saveSampleKit({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
}

// ─── Main Sync Function ───────────────────────────────────────

export async function syncAll(userId?: string): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;
  notifyListeners();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      isSyncing = false;
      notifyListeners();
      return;
    }

    const uid = userId || session.user.id;

    // Phase 1: Push pending local changes
    await Promise.allSettled([
      pushScreenings(session),
      pushVaccines(session),
      pushAppointments(session),
      pushNotifications(session),
      pushMessages(session),
      pushConversations(session),
      pushFeedback(session),
      pushLabResults(session),
      pushKitRequests(session),
    ]);

    // Phase 2: Pull remote changes
    await Promise.allSettled([
      pullScreenings(uid),
      pullVaccines(uid),
      pullAppointments(uid),
      pullNotifications(uid),
      pullArticles(),
      pullFacilities(),
      pullConversations(uid),
      pullChatContacts(),
      pullLabResults(uid),
      pullSampleKits(uid),
    ]);

    // Phase 3: Pull messages after conversations are synced
    await pullMessages(uid);

    setSyncMeta('last_full_sync', new Date().toISOString());
  } catch (err) {
    console.warn('Sync error:', err);
  } finally {
    isSyncing = false;
    notifyListeners();
  }
}

export async function syncArticlesOnly(): Promise<void> {
  try {
    await pullArticles();
    setSyncMeta('articles_synced_at', new Date().toISOString());
  } catch { /* silent */ }
}

// ─── Article Update Commands ──────────────────────────────────
// Server sends commands via a content_updates table or Realtime
// Format: { action: 'create' | 'update' | 'delete', article: {...} }

export function handleArticleCommand(command: { action: string; article?: any; article_id?: number }) {
  switch (command.action) {
    case 'create':
    case 'update':
      if (command.article) saveArticle(command.article);
      break;
    case 'delete':
      if (command.article_id) deleteArticle(command.article_id);
      break;
  }
}

// ─── Realtime Subscriptions ───────────────────────────────────

export function subscribeToArticleUpdates(userId: string) {
  return supabase
    .channel('article-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'articles',
    }, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        saveArticle(payload.new);
      } else if (payload.eventType === 'DELETE') {
        const old = payload.old as any;
        if (old?.id) deleteArticle(old.id);
      }
    })
    .subscribe();
}

export function subscribeToMessages(conversationId: number, remoteId: string, cb: (msg: any) => void) {
  return supabase
    .channel(`conv:${remoteId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${remoteId}`,
    }, (payload) => {
      const msg = payload.new as any;
      saveMessage({
        ...msg,
        remote_id: String(msg.id),
        conversation_id: conversationId,
        conversation_remote_id: remoteId,
      }, 'synced');
      cb(msg);
    })
    .subscribe();
}

export function subscribeToNotifications(userId: string, cb: (notif: any) => void) {
  return supabase
    .channel(`user:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      const notif = payload.new as any;
      saveNotification({ ...notif, remote_id: String(notif.id) }, 'synced');
      cb(notif);
    })
    .subscribe();
}

export function getLastFullSync() {
  return getSyncMeta('last_full_sync');
}

export default {
  syncAll,
  syncArticlesOnly,
  handleArticleCommand,
  subscribeToArticleUpdates,
  subscribeToMessages,
  subscribeToNotifications,
  getLastFullSync,
  getIsSyncing,
  onSyncStateChange,
};
