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
  saveTestResult,
  markSynced,
  now,
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
        const { error } = await supabase.from('notifications').update({ read: !!row.read }).eq('id', row.remote_id);
        if (!error) markSynced('notifications', row.id);
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
        .insert({ user_id: row.user_id || null, category: row.category, message: row.message, contact: row.contact })
        .select('id')
        .single();
      if (!error && data) {
        db.runSync('UPDATE feedback SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
      }
    } catch { incrementRetry(row.id); }
  }
}

async function pushUsers(session: Session) {
  const { getUnsyncedUsers, markUserSynced } = await import('./localDb');
  const pending = getUnsyncedUsers();
  for (const row of pending) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: row.name, phone: row.phone, email: row.email,
          birth_date: row.birth_date, last_healed_date: row.last_healed_date,
          photo: row.photo, county: row.county, sub_county: row.sub_county, ward: row.ward,
        })
        .eq('id', row.id);
      if (!error) markUserSynced(row.id);
    } catch { /* keep pending for next sync */ }
  }
}

async function pushTestResults(session: Session) {
  const { getDb } = await import('./localDb');
  const db = getDb();
  const pending = db.getAllSync(
    "SELECT * FROM test_results WHERE sync_status = 'pending'"
  ) as any[];
  for (const row of pending) {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .insert({ user_id: row.user_id, result: row.result, date: row.date })
        .select('id')
        .single();
      if (!error && data) {
        db.runSync('UPDATE test_results SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
      }
    } catch { incrementRetry(row.id); }
  }
}

async function pushSampleKits(session: Session) {
  const { getDb } = await import('./localDb');
  const db = getDb();
  const pending = db.getAllSync(
    "SELECT * FROM sample_kits WHERE sync_status = 'pending'"
  ) as any[];
  for (const row of pending) {
    try {
      if (row.remote_id) {
        const { error } = await supabase
          .from('sample_kits')
          .update({
            status: row.status, result: row.result, result_notes: row.result_notes,
            processed_at: row.processed_at, collected_at: row.collected_at,
          })
          .eq('id', row.remote_id);
        if (!error) markSynced('sample_kits', row.id);
        continue;
      }
      const { data, error } = await supabase
        .from('sample_kits')
        .insert({
          barcode: row.barcode, kit_type: row.kit_type || 'HPV_SELF',
          status: (row.status || 'REGISTERED').toUpperCase(),
          facility_id: row.facility_id, patient_id: row.patient_id, patient_name: row.patient_name,
          collection_method: row.collection_method, result: row.result, result_notes: row.result_notes,
          collected_at: row.collected_at, processed_at: row.processed_at,
        })
        .select('id')
        .single();
      if (!error && data) {
        db.runSync('UPDATE sample_kits SET remote_id = ?, sync_status = ? WHERE id = ?', String(data.id), 'synced', row.id);
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
  if (lastSync) query.gte('updated_at', lastSync);
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  let maxUpdated = lastSync;
  for (const row of data) {
    const updated = row.updated_at || row.created_at;
    if (updated && (!maxUpdated || new Date(updated).getTime() > new Date(maxUpdated).getTime())) {
      maxUpdated = updated;
    }
    const existing = db.getFirstSync(
      'SELECT id, sync_status FROM screenings WHERE remote_id = ?',
      String(row.id)
    ) as any;
    if (existing) {
      if (existing.sync_status === 'pending') continue;
      db.runSync(
        `UPDATE screenings SET verdict = ?, risk_tier = ?, hpv_result = ?, score = ?, updated_at = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.verdict, row.risk_tier, row.hpv_result ?? '', row.score ?? null, now(), String(row.id)
      );
    } else {
      saveScreening({ ...row, remote_id: String(row.id), profile_id: row.profile_id, user_id: row.user_id }, 'synced');
    }
  }
  if (maxUpdated) setSyncMeta('screenings_synced_at', maxUpdated);
}

async function pullVaccines(userId: string) {
  const lastSync = getSyncMeta('vaccines_synced_at');
  const query = supabase
    .from('vaccines')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (lastSync) query.gte('updated_at', lastSync);
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  let maxUpdated = lastSync;
  for (const row of data) {
    const updated = row.updated_at || row.created_at;
    if (updated && (!maxUpdated || new Date(updated).getTime() > new Date(maxUpdated).getTime())) {
      maxUpdated = updated;
    }
    const existing = db.getFirstSync('SELECT id, sync_status FROM vaccines WHERE remote_id = ?', String(row.id)) as any;
    if (existing) {
      if (existing.sync_status === 'pending') continue;
      db.runSync(
        `UPDATE vaccines SET name = ?, hospital = ?, date = ?, status = ?, reminder_day = ?, reminder_before = ?, updated_at = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.name, row.hospital ?? '', row.date ?? '', row.status, row.reminder_day ? 1 : 0, row.reminder_before ? 1 : 0, now(), String(row.id)
      );
    } else {
      saveVaccine({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
  if (maxUpdated) setSyncMeta('vaccines_synced_at', maxUpdated);
}

async function pullAppointments(userId: string) {
  const lastSync = getSyncMeta('appointments_synced_at');
  const query = supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (lastSync) query.gte('updated_at', lastSync);
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  let maxUpdated = lastSync;
  for (const row of data) {
    const updated = row.updated_at || row.created_at;
    if (updated && (!maxUpdated || new Date(updated).getTime() > new Date(maxUpdated).getTime())) {
      maxUpdated = updated;
    }
    const existing = db.getFirstSync('SELECT id, sync_status FROM appointments WHERE remote_id = ?', String(row.id)) as any;
    if (existing) {
      if (existing.sync_status === 'pending') continue;
      db.runSync(
        `UPDATE appointments SET title = ?, status = ?, date = ?, time = ?, notes = ?, updated_at = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.title ?? '', row.status, row.date ?? '', row.time ?? '', row.notes ?? '', now(), String(row.id)
      );
    } else {
      saveAppointment({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
  if (maxUpdated) setSyncMeta('appointments_synced_at', maxUpdated);
}

async function pullNotifications(userId: string) {
  const lastSync = getSyncMeta('notifications_synced_at');
  const query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (lastSync) query.gte('updated_at', lastSync);
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  let maxUpdated = lastSync;
  for (const row of data) {
    const updated = row.updated_at || row.created_at;
    if (updated && (!maxUpdated || new Date(updated).getTime() > new Date(maxUpdated).getTime())) {
      maxUpdated = updated;
    }
    const existing = db.getFirstSync('SELECT id, sync_status FROM notifications WHERE remote_id = ?', String(row.id)) as any;
    if (existing) {
      if (existing.sync_status === 'pending') continue;
      db.runSync(
        `UPDATE notifications SET title = ?, message = ?, type = ?, read = ?, updated_at = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.title ?? '', row.message ?? '', row.type ?? '', row.read ? 1 : 0, now(), String(row.id)
      );
    } else {
      saveNotification({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
  if (maxUpdated) setSyncMeta('notifications_synced_at', maxUpdated);
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
  const lastSync = getSyncMeta('lab_results_synced_at');
  const query = supabase
    .from('lab_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (lastSync) query.gte('updated_at', lastSync);
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  let maxUpdated = lastSync;
  for (const row of data) {
    const updated = row.updated_at || row.created_at;
    if (updated && (!maxUpdated || new Date(updated).getTime() > new Date(maxUpdated).getTime())) {
      maxUpdated = updated;
    }
    const existing = db.getFirstSync('SELECT id, sync_status FROM lab_results WHERE remote_id = ?', String(row.id)) as any;
    if (existing) {
      if (existing.sync_status === 'pending') continue;
      db.runSync(
        `UPDATE lab_results SET result = ?, notes = ?, updated_at = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.result ?? '', row.notes ?? '', now(), String(row.id)
      );
    } else {
      saveLabResult({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
  if (maxUpdated) setSyncMeta('lab_results_synced_at', maxUpdated);
}

async function pullTestResults(userId: string) {
  const lastSync = getSyncMeta('test_results_synced_at');
  const query = supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (lastSync) query.gte('updated_at', lastSync);
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  let maxUpdated = lastSync;
  for (const row of data) {
    const updated = row.updated_at || row.created_at;
    if (updated && (!maxUpdated || new Date(updated).getTime() > new Date(maxUpdated).getTime())) {
      maxUpdated = updated;
    }
    const existing = db.getFirstSync('SELECT id, sync_status FROM test_results WHERE remote_id = ?', String(row.id)) as any;
    if (existing) {
      if (existing.sync_status === 'pending') continue;
      db.runSync(
        `UPDATE test_results SET result = ?, date = ?, updated_at = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.result ?? '', row.date ?? '', now(), String(row.id)
      );
    } else {
      saveTestResult({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
  if (maxUpdated) setSyncMeta('test_results_synced_at', maxUpdated);
}

async function pullSampleKits(userId: string) {
  const lastSync = getSyncMeta('sample_kits_synced_at');
  const query = supabase
    .from('sample_kits')
    .select('*')
    .eq('patient_id', userId)
    .order('created_at', { ascending: false });
  if (lastSync) query.gte('updated_at', lastSync);
  const { data, error } = await query;
  if (error || !data) return;

  const { getDb } = await import('./localDb');
  const db = getDb();
  let maxUpdated = lastSync;
  for (const row of data) {
    const updated = row.updated_at || row.created_at;
    if (updated && (!maxUpdated || new Date(updated).getTime() > new Date(maxUpdated).getTime())) {
      maxUpdated = updated;
    }
    const existing = db.getFirstSync('SELECT id, sync_status FROM sample_kits WHERE remote_id = ?', String(row.id)) as any;
    if (existing) {
      if (existing.sync_status === 'pending') continue;
      db.runSync(
        `UPDATE sample_kits SET status = ?, result = ?, result_notes = ?, processed_at = ?, collected_at = ?, updated_at = ?, sync_status = 'synced' WHERE remote_id = ?`,
        row.status, row.result ?? '', row.result_notes ?? '', row.processed_at ?? '', row.collected_at ?? '', now(), String(row.id)
      );
    } else {
      saveSampleKit({ ...row, remote_id: String(row.id) }, 'synced');
    }
  }
  if (maxUpdated) setSyncMeta('sample_kits_synced_at', maxUpdated);
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

    // Phase 1: Push conversations first (messages depend on remote conversation IDs)
    await pushConversations(session);

    // Phase 2: Push remaining pending local changes
    await Promise.allSettled([
      pushScreenings(session),
      pushVaccines(session),
      pushAppointments(session),
      pushNotifications(session),
      pushMessages(session),
      pushFeedback(session),
      pushLabResults(session),
      pushKitRequests(session),
      pushUsers(session),
      pushTestResults(session),
      pushSampleKits(session),
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
      pullTestResults(uid),
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
