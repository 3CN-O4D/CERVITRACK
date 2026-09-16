import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: SQLite.SQLiteDatabase | null = null;
let webNoDb = false;

function noopDb(): any {
  return new Proxy({}, {
    get: () => noopDb,
    apply: () => undefined,
  });
}

export function getDb(): SQLite.SQLiteDatabase | any {
  if (Platform.OS === 'web') return noopDb();
  if (webNoDb) return noopDb();
  if (!db) {
    try {
      db = SQLite.openDatabaseSync('cervitrack.db');
    } catch {
      webNoDb = true;
      return noopDb();
    }
  }
  return db;
}

// ─── Schema ───────────────────────────────────────────────────

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    password TEXT,
    role TEXT DEFAULT 'patient',
    photo TEXT,
    birth_date TEXT,
    last_healed_date TEXT,
    county TEXT,
    sub_county TEXT,
    ward TEXT,
    patient_id TEXT,
    risk_index TEXT DEFAULT 'low',
    consent_terms INTEGER DEFAULT 0,
    consent_medical INTEGER DEFAULT 0,
    consent_at TEXT,
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS screenings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    profile_id TEXT,
    user_id TEXT,
    verdict TEXT DEFAULT 'NEGATIVE',
    risk_tier TEXT DEFAULT 'LOW',
    age INTEGER,
    parity INTEGER,
    vaccination TEXT,
    previous_screening TEXT,
    hiv_status TEXT,
    smoking TEXT,
    symptoms TEXT,
    family_history TEXT,
    hpv_result TEXT,
    score INTEGER,
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS vaccines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    user_id TEXT,
    name TEXT,
    hospital TEXT,
    date TEXT,
    status TEXT DEFAULT 'upcoming',
    reminder_day INTEGER DEFAULT 0,
    reminder_before INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    user_id TEXT,
    clinician_id TEXT,
    provider_id TEXT,
    title TEXT,
    facility TEXT,
    facility_name TEXT,
    facility_location TEXT,
    date TEXT,
    time TEXT,
    notes TEXT,
    custom_text TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    user_id TEXT,
    title TEXT,
    message TEXT,
    type TEXT,
    read INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY,
    title TEXT,
    summary TEXT,
    content TEXT,
    image TEXT,
    category TEXT,
    read_time TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    name TEXT,
    county TEXT,
    sub_county TEXT,
    ward TEXT,
    lat REAL,
    lng REAL,
    distance REAL,
    phone TEXT,
    services TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    user_id TEXT,
    contact_id INTEGER,
    contact_name TEXT,
    contact_role TEXT,
    online INTEGER DEFAULT 0,
    last_message TEXT,
    last_time TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    conversation_id INTEGER,
    conversation_remote_id TEXT,
    sender_id TEXT,
    sender_type TEXT DEFAULT 'user',
    message_type TEXT DEFAULT 'text',
    content TEXT,
    file_url TEXT,
    local_uri TEXT,
    duration TEXT,
    read INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS chat_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    name TEXT,
    role TEXT,
    specialty TEXT,
    hospital TEXT,
    online INTEGER DEFAULT 0,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS lab_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    user_id TEXT,
    patient_name TEXT,
    result TEXT,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    user_id TEXT,
    result TEXT,
    date TEXT,
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS kit_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    user_id TEXT,
    user_name TEXT,
    user_phone TEXT,
    user_county TEXT,
    user_sub_county TEXT,
    user_ward TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    admin_notes TEXT,
    contacted_at TEXT,
    delivered_at TEXT,
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS sample_kits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    barcode TEXT UNIQUE,
    kit_type TEXT DEFAULT 'hpv',
    status TEXT DEFAULT 'REGISTERED',
    patient_id TEXT,
    patient_name TEXT,
    facility_id TEXT,
    facility_name TEXT,
    batch_id TEXT,
    collection_method TEXT,
    result TEXT,
    result_notes TEXT,
    processed_at TEXT,
    collected_at TEXT,
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id TEXT,
    user_id TEXT,
    category TEXT,
    message TEXT,
    contact TEXT,
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    row_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    retries INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_screenings_profile ON screenings(profile_id);
  CREATE INDEX IF NOT EXISTS idx_screenings_user ON screenings(user_id);
  CREATE INDEX IF NOT EXISTS idx_screenings_sync ON screenings(sync_status);
  CREATE INDEX IF NOT EXISTS idx_vaccines_user ON vaccines(user_id);
  CREATE INDEX IF NOT EXISTS idx_vaccines_sync ON vaccines(sync_status);
  CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
  CREATE INDEX IF NOT EXISTS idx_appointments_sync ON appointments(sync_status);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_sync ON notifications(sync_status);
  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_messages_sync ON messages(sync_status);
  CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
  CREATE INDEX IF NOT EXISTS idx_sample_kits_barcode ON sample_kits(barcode);
  CREATE INDEX IF NOT EXISTS idx_sample_kits_patient ON sample_kits(patient_id);
`;

export function initLocalDb() {
  try {
    const database = getDb();
    if (!database) return;
    database.execSync(SCHEMA);
    migrateLocalDb(database);
  } catch { /* local DB not available (e.g. web) */ }
}

function migrateLocalDb(database: any) {
  try {
    const cols = database.getAllSync('PRAGMA table_info(users)') as Array<{ name: string }>;
    if (!cols.some((c) => c.name === 'sync_status')) {
      database.runSync("ALTER TABLE users ADD COLUMN sync_status TEXT DEFAULT 'synced'");
    }
  } catch { /* column already present */ }
}

// ─── Helpers ──────────────────────────────────────────────────

export function now() {
  return new Date().toISOString();
}

function addToQueue(tableName: string, rowId: string, operation: string, payload?: any) {}

export function markSynced(tableName: string, localId: number | string) {
  try {
    const database = getDb();
    database.runSync(
      `UPDATE ${tableName} SET sync_status = 'synced' WHERE id = ?`,
      localId
    );
  } catch { /* no-op */ }
}

// ─── Users ────────────────────────────────────────────────────

export function saveUser(user: any) {
  const database = getDb();
  database.runSync(
    `INSERT OR REPLACE INTO users (id, name, email, phone, password, role, photo, birth_date, last_healed_date, county, sub_county, ward, patient_id, risk_index, consent_terms, consent_medical, consent_at, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    user.id, user.name || '', user.email || '', user.phone || '',
    user.role || 'patient', user.photo || '', user.birth_date || '', user.last_healed_date || '',
    user.county || '', user.sub_county || '', user.ward || '', user.patient_id || '',
    user.risk_index || 'low', user.consent_terms ? 1 : 0, user.consent_medical ? 1 : 0,
    user.consent_at || '', user.created_at || now(), now(),
    user.sync_status || 'synced'
  );
}

export function updateUserLocally(userId: string, updates: any) {
  const database = getDb();
  const sets: string[] = [];
  const vals: any[] = [];
  if (updates.name !== undefined) { sets.push('name = ?'); vals.push(updates.name); }
  if (updates.phone !== undefined) { sets.push('phone = ?'); vals.push(updates.phone); }
  if (updates.email !== undefined) { sets.push('email = ?'); vals.push(updates.email); }
  if (updates.birth_date !== undefined) { sets.push('birth_date = ?'); vals.push(updates.birth_date); }
  if (updates.last_healed_date !== undefined) { sets.push('last_healed_date = ?'); vals.push(updates.last_healed_date); }
  if (updates.photo !== undefined) { sets.push('photo = ?'); vals.push(updates.photo); }
  if (updates.county !== undefined) { sets.push('county = ?'); vals.push(updates.county); }
  if (updates.sub_county !== undefined) { sets.push('sub_county = ?'); vals.push(updates.sub_county); }
  if (updates.ward !== undefined) { sets.push('ward = ?'); vals.push(updates.ward); }
  if (sets.length === 0) return;
  sets.push('updated_at = ?', 'sync_status = ?');
  vals.push(now(), 'pending', userId);
  database.runSync(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, ...vals);
}

export function markUserSynced(userId: string) {
  const database = getDb();
  database.runSync("UPDATE users SET sync_status = 'synced' WHERE id = ?", userId);
}

export function getUnsyncedUsers(): any[] {
  try {
    const database = getDb();
    return database.getAllSync("SELECT * FROM users WHERE sync_status = 'pending'");
  } catch { return []; }
}

export function getUser(userId: string): any | null {
  try {
    const database = getDb();
    return database.getFirstSync('SELECT * FROM users WHERE id = ?', userId) ?? null;
  } catch { return null; }
}

export function getCurrentUser(): any | null {
  try {
    const database = getDb();
    return database.getFirstSync('SELECT * FROM users LIMIT 1') ?? null;
  } catch { return null; }
}

// ─── Screenings ───────────────────────────────────────────────

export function saveScreening(s: any, syncStatus: string = 'synced') {
  const database = getDb();
  const result = database.runSync(
    `INSERT INTO screenings (remote_id, profile_id, user_id, verdict, risk_tier, age, parity, vaccination, previous_screening, hiv_status, smoking, symptoms, family_history, hpv_result, score, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    s.remote_id || null, s.profile_id || s.user_id || '', s.user_id || s.profile_id || '',
    s.verdict || 'NEGATIVE', s.risk_tier || 'LOW', s.age ?? null, s.parity ?? null,
    s.vaccination || '', s.previous_screening || '', s.hiv_status || '', s.smoking || '',
    s.symptoms || '', s.family_history || '', s.hpv_result || '', s.score ?? null,
    s.created_at || now(), now(), syncStatus
  );
  return result.lastInsertRowId;
}

export function getScreenings(profileId: string): any[] {
  try {
    const database = getDb();
    return database.getAllSync(
      'SELECT * FROM screenings WHERE profile_id = ? OR user_id = ? ORDER BY created_at DESC',
      profileId, profileId
    );
  } catch { return []; }
}

// ─── Vaccines ─────────────────────────────────────────────────

export function saveVaccine(v: any, syncStatus: string = 'synced') {
  const database = getDb();
  const result = database.runSync(
    `INSERT INTO vaccines (remote_id, user_id, name, hospital, date, status, reminder_day, reminder_before, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    v.remote_id || null, v.user_id || '', v.name || '', v.hospital || '',
    v.date || '', v.status || 'upcoming', v.reminder_day ? 1 : 0, v.reminder_before ? 1 : 0,
    v.created_at || now(), now(), syncStatus
  );
  return result.lastInsertRowId;
}

export function getVaccines(userId: string): any[] {
  try {
    const database = getDb();
    return database.getAllSync(
      'SELECT * FROM vaccines WHERE user_id = ? ORDER BY date DESC',
      userId
    );
  } catch { return []; }
}

export function updateVaccineStatus(id: number, status: string) {
  const database = getDb();
  database.runSync(
    'UPDATE vaccines SET status = ?, updated_at = ?, sync_status = ? WHERE id = ?',
    status, now(), 'pending', id
  );
  addToQueue('vaccines', String(id), 'update', { id, status });
}

export function updateVaccineReminder(id: number, reminderDay: boolean, reminderBefore: boolean) {
  const database = getDb();
  database.runSync(
    'UPDATE vaccines SET reminder_day = ?, reminder_before = ?, updated_at = ?, sync_status = ? WHERE id = ?',
    reminderDay ? 1 : 0, reminderBefore ? 1 : 0, now(), 'pending', id
  );
  addToQueue('vaccines', String(id), 'update', { id, reminder_day: reminderDay, reminder_before: reminderBefore });
}

// ─── Appointments ─────────────────────────────────────────────

export function saveAppointment(a: any, syncStatus: string = 'synced') {
  const database = getDb();
  const result = database.runSync(
    `INSERT INTO appointments (remote_id, user_id, clinician_id, provider_id, title, facility, facility_name, facility_location, date, time, notes, custom_text, status, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    a.remote_id || null, a.user_id || '', a.clinician_id || '', a.provider_id || '',
    a.title || '', a.facility || '', a.facility_name || '', a.facility_location || '',
    a.date || '', a.time || '', a.notes || '', a.custom_text || '',
    a.status || 'pending', a.created_at || now(), now(), syncStatus
  );
  return result.lastInsertRowId;
}

export function getAppointments(userId: string): any[] {
  try {
    const database = getDb();
    return database.getAllSync(
      'SELECT * FROM appointments WHERE user_id = ? ORDER BY date DESC',
      userId
    );
  } catch { return []; }
}

// ─── Notifications ────────────────────────────────────────────

export function saveNotification(n: any, syncStatus: string = 'synced') {
  const database = getDb();
  const result = database.runSync(
    `INSERT INTO notifications (remote_id, user_id, title, message, type, read, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    n.remote_id || null, n.user_id || '', n.title || '', n.message || '',
    n.type || '', n.read ? 1 : 0, n.created_at || now(), now(), syncStatus
  );
  return result.lastInsertRowId;
}

export function getNotifications(userId: string): any[] {
  try {
    const database = getDb();
    return database.getAllSync(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      userId
    );
  } catch { return []; }
}

export function markNotificationRead(id: number) {
  const database = getDb();
  database.runSync('UPDATE notifications SET read = 1, sync_status = ? WHERE id = ?', 'pending', id);
  addToQueue('notifications', String(id), 'update', { id, read: true });
}

export function markAllNotificationsRead(userId: string) {
  const database = getDb();
  database.runSync('UPDATE notifications SET read = 1, sync_status = ? WHERE user_id = ?', 'pending', userId);
  addToQueue('notifications', userId, 'update_all', { user_id: userId, read: true });
}

export function deleteNotification(id: number) {
  const database = getDb();
  database.runSync('DELETE FROM notifications WHERE id = ?', id);
  addToQueue('notifications', String(id), 'delete', { id });
}

// ─── Articles ─────────────────────────────────────────────────

export function saveArticle(article: any) {
  const database = getDb();
  database.runSync(
    `INSERT OR REPLACE INTO articles (id, title, summary, content, image, category, read_time, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    article.id, article.title || '', article.summary || '', article.content || '',
    article.image || '', article.category || '', article.read_time || '', now()
  );
}

export function saveArticles(articles: any[]) {
  const database = getDb();
  for (const a of articles) {
    database.runSync(
      `INSERT OR REPLACE INTO articles (id, title, summary, content, image, category, read_time, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      a.id, a.title || '', a.summary || '', a.content || '',
      a.image || '', a.category || '', a.read_time || '', now()
    );
  }
}

export function getArticles(): any[] {
  try {
    const database = getDb();
    return database.getAllSync('SELECT * FROM articles ORDER BY id ASC');
  } catch { return []; }
}

export function getArticleById(id: number): any | null {
  try {
    const database = getDb();
    return database.getFirstSync('SELECT * FROM articles WHERE id = ?', id) ?? null;
  } catch { return null; }
}

export function deleteArticle(id: number) {
  const database = getDb();
  database.runSync('DELETE FROM articles WHERE id = ?', id);
}

// ─── Facilities ───────────────────────────────────────────────

export function saveFacilities(facilities: any[]) {
  const database = getDb();
  for (const f of facilities) {
    database.runSync(
      `INSERT OR REPLACE INTO facilities (remote_id, name, county, sub_county, ward, lat, lng, distance, phone, services, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      f.id || f.remote_id || null, f.name || '', f.county || '', f.sub_county || '',
      f.ward || '', f.lat ?? null, f.lng ?? null, f.distance ?? null,
      f.phone || '', f.services || '', now()
    );
  }
}

export function getFacilities(): any[] {
  try {
    const database = getDb();
    return database.getAllSync('SELECT * FROM facilities ORDER BY distance ASC');
  } catch { return []; }
}

// ─── Conversations ────────────────────────────────────────────

export function saveConversation(c: any, syncStatus: string = 'synced') {
  const database = getDb();
  const result = database.runSync(
    `INSERT INTO conversations (remote_id, user_id, contact_id, contact_name, contact_role, online, last_message, last_time, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    c.remote_id || null, c.user_id || '', c.contact_id ?? null, c.contact_name || '',
    c.contact_role || '', c.online ? 1 : 0, c.last_message || '', c.last_time || '',
    now(), syncStatus
  );
  return result.lastInsertRowId;
}

export function getConversations(userId: string): any[] {
  try {
    const database = getDb();
    return database.getAllSync(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY last_time DESC',
      userId
    );
  } catch { return []; }
}

export function getConversationByRemoteId(remoteId: string): any | null {
  try {
    const database = getDb();
    return database.getFirstSync('SELECT * FROM conversations WHERE remote_id = ?', remoteId) ?? null;
  } catch { return null; }
}

export function updateConversationLastMessage(conversationId: number, lastMessage: string) {
  const database = getDb();
  database.runSync(
    'UPDATE conversations SET last_message = ?, last_time = ? WHERE id = ?',
    lastMessage, now(), conversationId
  );
}

// ─── Messages ─────────────────────────────────────────────────

export function saveMessage(m: any, syncStatus: string = 'synced') {
  const database = getDb();
  const result = database.runSync(
    `INSERT INTO messages (remote_id, conversation_id, conversation_remote_id, sender_id, sender_type, message_type, content, file_url, local_uri, duration, read, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    m.remote_id || null, m.conversation_id ?? null, m.conversation_remote_id || null,
    m.sender_id || '', m.sender_type || 'user', m.message_type || 'text',
    m.content || '', m.file_url || '', m.local_uri || '', m.duration || '', m.read ? 1 : 0,
    m.created_at || now(), now(), syncStatus
  );
  return result.lastInsertRowId;
}

export function getMessages(conversationId: number): any[] {
  try {
    const database = getDb();
    return database.getAllSync(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      conversationId
    );
  } catch { return []; }
}

export function getUnsyncedMessages(): any[] {
  try {
    const database = getDb();
    return database.getAllSync(
      "SELECT * FROM messages WHERE sync_status = 'pending'"
    );
  } catch { return []; }
}

// ─── Chat Contacts ────────────────────────────────────────────

export function saveChatContacts(contacts: any[]) {
  const database = getDb();
  for (const c of contacts) {
    database.runSync(
      `INSERT OR REPLACE INTO chat_contacts (remote_id, name, role, specialty, hospital, online, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      c.id || c.remote_id || null, c.name || '', c.role || '', c.specialty || '',
      c.hospital || '', c.online ? 1 : 0, now()
    );
  }
}

export function getChatContacts(): any[] {
  try {
    const database = getDb();
    return database.getAllSync('SELECT * FROM chat_contacts ORDER BY name ASC');
  } catch { return []; }
}

// ─── Lab Results ──────────────────────────────────────────────

export function saveLabResult(r: any, syncStatus: string = 'synced') {
  const database = getDb();
  database.runSync(
    `INSERT INTO lab_results (remote_id, user_id, patient_name, result, notes, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    r.remote_id || null, r.user_id || '', r.patient_name || '', r.result || '',
    r.notes || '', r.created_at || now(), now(), syncStatus
  );
}

export function getLabResults(userId: string): any[] {
  try {
    const database = getDb();
    return database.getAllSync(
      'SELECT * FROM lab_results WHERE user_id = ? ORDER BY created_at DESC',
      userId
    );
  } catch { return []; }
}

// ─── Test Results ─────────────────────────────────────────────

export function saveTestResult(r: any, syncStatus: string = 'synced') {
  const database = getDb();
  database.runSync(
    `INSERT INTO test_results (remote_id, user_id, result, date, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    r.remote_id || null, r.user_id || '', r.result || '', r.date || '',
    r.created_at || now(), now(), syncStatus
  );
}

export function getTestResults(userId: string): any[] {
  try {
    const database = getDb();
    return database.getAllSync(
      'SELECT * FROM test_results WHERE user_id = ? ORDER BY created_at DESC',
      userId
    );
  } catch { return []; }
}

// ─── Kit Requests ─────────────────────────────────────────────

export function saveKitRequest(r: any, syncStatus: string = 'synced') {
  const database = getDb();
  const result = database.runSync(
    `INSERT INTO kit_requests (remote_id, user_id, user_name, user_phone, user_county, user_sub_county, user_ward, status, notes, admin_notes, contacted_at, delivered_at, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    r.remote_id || null, r.user_id || '', r.user_name || '', r.user_phone || '',
    r.user_county || '', r.user_sub_county || '', r.user_ward || '', r.status || 'pending',
    r.notes || '', r.admin_notes || '', r.contacted_at || '', r.delivered_at || '',
    r.created_at || now(), now(), syncStatus
  );
  return result.lastInsertRowId;
}

export function getKitRequests(userId?: string): any[] {
  try {
    const database = getDb();
    if (userId) {
      return database.getAllSync(
        'SELECT * FROM kit_requests WHERE user_id = ? ORDER BY created_at DESC',
        userId
      );
    }
    return database.getAllSync('SELECT * FROM kit_requests ORDER BY created_at DESC');
  } catch { return []; }
}

export function updateKitRequest(id: number, updates: any) {
  const database = getDb();
  const sets: string[] = [];
  const vals: any[] = [];
  if (updates.status !== undefined) { sets.push('status = ?'); vals.push(updates.status); }
  if (updates.admin_notes !== undefined) { sets.push('admin_notes = ?'); vals.push(updates.admin_notes); }
  if (updates.notes !== undefined) { sets.push('notes = ?'); vals.push(updates.notes); }
  if (updates.contacted_at !== undefined) { sets.push('contacted_at = ?'); vals.push(updates.contacted_at); }
  if (updates.delivered_at !== undefined) { sets.push('delivered_at = ?'); vals.push(updates.delivered_at); }
  sets.push('updated_at = ?', 'sync_status = ?');
  vals.push(now(), 'pending', id);
  database.runSync(`UPDATE kit_requests SET ${sets.join(', ')} WHERE id = ?`, ...vals);
  addToQueue('kit_requests', String(id), 'update', { id, ...updates });
}

// ─── Sample Kits ──────────────────────────────────────────────

export function saveSampleKit(k: any, syncStatus: string = 'synced') {
  const database = getDb();
  database.runSync(
    `INSERT OR REPLACE INTO sample_kits (remote_id, barcode, kit_type, status, patient_id, patient_name, facility_id, facility_name, batch_id, collection_method, result, result_notes, processed_at, collected_at, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    k.remote_id || null, k.barcode || '', k.kit_type || 'hpv', k.status || 'REGISTERED',
    k.patient_id || '', k.patient_name || '', k.facility_id || '', k.facility_name || '',
    k.batch_id || '', k.collection_method || '', k.result || '', k.result_notes || '',
    k.processed_at || '', k.collected_at || '', k.created_at || now(), now(), syncStatus
  );
}

export function getSampleKits(userId?: string): any[] {
  try {
    const database = getDb();
    if (userId) {
      return database.getAllSync(
        'SELECT * FROM sample_kits WHERE patient_id = ? ORDER BY created_at DESC',
        userId
      );
    }
    return database.getAllSync('SELECT * FROM sample_kits ORDER BY created_at DESC');
  } catch { return []; }
}

export function getSampleKitByBarcode(barcode: string): any | null {
  try {
    const database = getDb();
    return database.getFirstSync('SELECT * FROM sample_kits WHERE barcode = ?', barcode) ?? null;
  } catch { return null; }
}

// ─── Feedback ─────────────────────────────────────────────────

export function saveFeedback(f: any, syncStatus: string = 'synced') {
  const database = getDb();
  database.runSync(
    `INSERT INTO feedback (remote_id, user_id, category, message, contact, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    f.remote_id || null, f.user_id || '', f.category || '', f.message || '',
    f.contact || '', f.created_at || now(), now(), syncStatus
  );
}

// ─── Sync Queue ───────────────────────────────────────────────

export function getSyncQueue(): any[] {
  try {
    const database = getDb();
    return database.getAllSync(
      'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 100'
    );
  } catch { return []; }
}

export function getSyncQueueCount(): number {
  try {
    const database = getDb();
    const tables = ['screenings', 'vaccines', 'appointments', 'notifications', 'messages', 'conversations', 'lab_results', 'test_results', 'kit_requests', 'sample_kits', 'feedback', 'users'];
    let total = 0;
    for (const t of tables) {
      const result = database.getFirstSync(
        `SELECT COUNT(*) as count FROM ${t} WHERE sync_status = 'pending'`
      ) as any;
      total += result?.count ?? 0;
    }
    return total;
  } catch { return 0; }
}

export function removeSyncQueueItem(id: number) {
  const database = getDb();
  database.runSync('DELETE FROM sync_queue WHERE id = ?', id);
}

export function clearSyncQueue() {
  const database = getDb();
  database.runSync('DELETE FROM sync_queue');
}

export function incrementRetry(id: number) {
  const database = getDb();
  database.runSync('UPDATE sync_queue SET retries = retries + 1 WHERE id = ?', id);
}

// ─── Sync Meta ────────────────────────────────────────────────

export function getSyncMeta(key: string): string | null {
  try {
    const database = getDb();
    const result = database.getFirstSync('SELECT value FROM sync_meta WHERE key = ?', key) as any;
    return result?.value ?? null;
  } catch { return null; }
}

export function setSyncMeta(key: string, value: string) {
  const database = getDb();
  database.runSync(
    'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
    key, value
  );
}

// ─── Pending Counts ───────────────────────────────────────────

export function getPendingCounts(): Record<string, number> {
  try {
    const database = getDb();
    const tables = ['screenings', 'vaccines', 'appointments', 'notifications', 'messages', 'conversations', 'lab_results', 'test_results', 'kit_requests', 'sample_kits', 'feedback', 'users'];
    const counts: Record<string, number> = {};
    for (const t of tables) {
      const result = database.getFirstSync(
        `SELECT COUNT(*) as count FROM ${t} WHERE sync_status = 'pending'`
      ) as any;
      counts[t] = result?.count ?? 0;
    }
    return counts;
  } catch { return {}; }
}

// ─── Full Replace (for initial sync) ──────────────────────────

export function clearAllData() {
  const database = getDb();
  const tables = ['users', 'screenings', 'vaccines', 'appointments', 'notifications', 'messages', 'conversations', 'lab_results', 'test_results', 'kit_requests', 'sample_kits', 'feedback', 'sync_queue'];
  for (const t of tables) {
    try { database.runSync(`DELETE FROM ${t}`); } catch {}
  }
}

export function replaceTable(tableName: string, rows: any[], columns: string[]) {
  const database = getDb();
  database.runSync(`DELETE FROM ${tableName}`);
  for (const row of rows) {
    const vals = columns.map(c => row[c] ?? row[c.replace(/_([a-z])/g, (_: string, l: string) => l.toUpperCase())] ?? null);
    const placeholders = columns.map(() => '?').join(', ');
    database.runSync(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
      ...vals
    );
  }
}

export default {
  getDb,
  initLocalDb,
  clearAllData,
  saveUser,
  getUser,
  getCurrentUser,
  updateUserLocally,
  markUserSynced,
  getUnsyncedUsers,
  saveScreening,
  getScreenings,
  saveVaccine,
  getVaccines,
  updateVaccineStatus,
  updateVaccineReminder,
  saveAppointment,
  getAppointments,
  saveNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  saveArticle,
  saveArticles,
  getArticles,
  getArticleById,
  deleteArticle,
  saveFacilities,
  getFacilities,
  saveConversation,
  getConversations,
  getConversationByRemoteId,
  updateConversationLastMessage,
  saveMessage,
  getMessages,
  getUnsyncedMessages,
  saveChatContacts,
  getChatContacts,
  saveLabResult,
  getLabResults,
  saveTestResult,
  getTestResults,
  saveKitRequest,
  getKitRequests,
  updateKitRequest,
  saveSampleKit,
  getSampleKits,
  getSampleKitByBarcode,
  saveFeedback,
  getSyncQueue,
  getSyncQueueCount,
  removeSyncQueueItem,
  clearSyncQueue,
  incrementRetry,
  getSyncMeta,
  setSyncMeta,
  getPendingCounts,
  replaceTable,
};
