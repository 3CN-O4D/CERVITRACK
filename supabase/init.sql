-- ============================================================
-- CerviTrack — Complete Database Initialization
-- Run this ONCE in Supabase SQL Editor to create all tables,
-- indexes, functions, RLS policies, and seed data.
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'patient','lab_technician','clinician',
    'facility_admin','county_admin','national_admin','system_admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_tier AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vaccine_status AS ENUM ('scheduled','done','missed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending','upcoming','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('info','reminder','alert','appointment','screening','admin','provider');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sender_type AS ENUM ('patient','staff','system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text','image','audio');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kit_status AS ENUM (
    'UNREGISTERED','REGISTERED','PAIRED','COLLECTED',
    'IN_TRANSIT','IN_LAB','PROCESSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE batch_status AS ENUM ('receiving','testing','submitted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE clinician_specialty AS ENUM (
    'oncologist','gynecologist','nurse_practitioner',
    'public_health_officer','pathologist','general_practitioner','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. CORE TABLES
-- ============================================================

-- USERS (patients + admins)
CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL DEFAULT '',
  email           text UNIQUE,
  phone           text,
  password        text,
  role            user_role NOT NULL DEFAULT 'patient',
  photo           text,
  birth_date      text,
  last_healed_date text,
  county          text DEFAULT '',
  sub_county      text DEFAULT '',
  ward            text DEFAULT '',
  patient_id      text UNIQUE,
  consent_terms   boolean DEFAULT false,
  consent_medical boolean DEFAULT false,
  consent_at      text,
  total_screenings integer DEFAULT 0,
  total_vaccines  integer DEFAULT 0,
  last_screening_date text,
  last_vaccine_date   text,
  risk_index      risk_tier DEFAULT 'low',
  created_at      timestamptz DEFAULT now()
);

-- SCREENINGS
CREATE TABLE IF NOT EXISTS screenings (
  id            bigserial PRIMARY KEY,
  profile_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  verdict       text DEFAULT '',
  risk_tier     risk_tier DEFAULT 'low',
  age           integer,
  parity        integer,
  vaccination   text DEFAULT '',
  previous_screening text DEFAULT '',
  hiv_status    text DEFAULT '',
  smoking       text DEFAULT '',
  symptoms      text DEFAULT '',
  family_history text DEFAULT '',
  score         integer DEFAULT 0,
  hpv_result    text DEFAULT '',
  cytology_result text DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

-- VACCINES
CREATE TABLE IF NOT EXISTS vaccines (
  id            bigserial PRIMARY KEY,
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  name          text NOT NULL DEFAULT '',
  hospital      text DEFAULT '',
  date          text DEFAULT '',
  status        vaccine_status DEFAULT 'scheduled',
  reminder_day  boolean DEFAULT false,
  reminder_before boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
  id               bigserial PRIMARY KEY,
  user_id          uuid REFERENCES users(id) ON DELETE CASCADE,
  clinician_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  provider_id      uuid REFERENCES providers(id) ON DELETE SET NULL,
  title            text DEFAULT '',
  facility         text DEFAULT '',
  facility_name    text DEFAULT '',
  facility_location text DEFAULT '',
  date             text DEFAULT '',
  time             text DEFAULT '',
  notes            text DEFAULT '',
  custom_text      text DEFAULT '',
  status           appointment_status DEFAULT 'pending',
  created_at       timestamptz DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT '',
  message     text NOT NULL DEFAULT '',
  type        notification_type DEFAULT 'info',
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- LAB RESULTS
CREATE TABLE IF NOT EXISTS lab_results (
  id            bigserial PRIMARY KEY,
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  patient_name  text DEFAULT '',
  result        text DEFAULT '',
  notes         text DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

-- TEST RESULTS
CREATE TABLE IF NOT EXISTS test_results (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  result      text DEFAULT '',
  date        text DEFAULT '',
  image_path  text,
  created_at  timestamptz DEFAULT now()
);

-- FOLLOW-UPS
CREATE TABLE IF NOT EXISTS followups (
  id            bigserial PRIMARY KEY,
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  screening_id  bigint,
  completed     boolean DEFAULT false,
  completed_at  text,
  notes         text DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

-- REPORTS (admin-generated)
CREATE TABLE IF NOT EXISTS reports (
  id          bigserial PRIMARY KEY,
  admin_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  type        text DEFAULT '',
  content     text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

-- FEEDBACK
CREATE TABLE IF NOT EXISTS feedback (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  category    text DEFAULT '',
  message     text DEFAULT '',
  contact     text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

-- SCHEDULED ACTIONS (fixed: has both naming conventions for compatibility)
CREATE TABLE IF NOT EXISTS scheduled_actions (
  id              bigserial PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  type            text DEFAULT '',
  action_type     text DEFAULT '',
  title           text DEFAULT '',
  scheduled_date  text DEFAULT '',
  date            text DEFAULT '',
  notes           text DEFAULT '',
  completed       boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- CONSENT LOG (fixed: has both column styles for compatibility)
CREATE TABLE IF NOT EXISTS consent_log (
  id              bigserial PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  consent_type    text DEFAULT '',
  consent_terms   boolean DEFAULT false,
  consent_medical boolean DEFAULT false,
  accepted        boolean DEFAULT false,
  accepted_at     timestamptz DEFAULT now()
);

-- PROVIDERS (clinician login, separate from users)
CREATE TABLE IF NOT EXISTS providers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL DEFAULT '',
  email           text UNIQUE,
  phone           text DEFAULT '',
  password        text,
  role            text DEFAULT 'clinician',
  specialty       text DEFAULT '',
  hospital        text DEFAULT '',
  license_number  text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

-- FACILITIES
CREATE TABLE IF NOT EXISTS facilities (
  id              bigserial PRIMARY KEY,
  name            text NOT NULL DEFAULT '',
  location        text DEFAULT '',
  distance        real DEFAULT 0,
  phone           text DEFAULT '',
  hours           text DEFAULT '',
  services        text DEFAULT '',
  county          text DEFAULT '',
  facility_type   text DEFAULT 'clinic',
  last_updated    timestamptz DEFAULT now()
);

-- ARTICLES (health library)
CREATE TABLE IF NOT EXISTS articles (
  id              bigserial PRIMARY KEY,
  title           text NOT NULL DEFAULT '',
  summary         text DEFAULT '',
  content         text DEFAULT '',
  image           text DEFAULT '',
  category        text DEFAULT '',
  tags            text[] DEFAULT '{}',
  read_time       text DEFAULT '5 min read',
  last_updated    timestamptz DEFAULT now()
);

-- ============================================================
-- 3. CHAT TABLES (fixed naming to match API: chat_*)
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_contacts (
  id              bigserial PRIMARY KEY,
  name            text NOT NULL DEFAULT '',
  role            text DEFAULT '',
  specialty       text DEFAULT '',
  hospital        text DEFAULT '',
  online          boolean DEFAULT false,
  last_updated    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id              bigserial PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  contact_id      bigint REFERENCES chat_contacts(id) ON DELETE CASCADE,
  contact_name    text DEFAULT '',
  contact_role    text DEFAULT '',
  last_message    text DEFAULT '',
  last_time       timestamptz DEFAULT now(),
  unread          integer DEFAULT 0,
  online          boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id              bigserial PRIMARY KEY,
  conversation_id bigint REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  sender_type     sender_type DEFAULT 'patient',
  message_type    message_type DEFAULT 'text',
  content         text DEFAULT '',
  file_url        text,
  duration        text,
  status          text DEFAULT 'sent',
  created_at      timestamptz DEFAULT now(),
  synced          boolean DEFAULT true
);

-- ============================================================
-- 4. TELEHEALTH MESSAGES (separate from chat)
-- ============================================================

CREATE TABLE IF NOT EXISTS telehealth_messages (
  id              bigserial PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  sender          text DEFAULT '',
  message         text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 5. SAMPLE KITS (replaces in-memory kit-store)
-- ============================================================

CREATE TABLE IF NOT EXISTS sample_kits (
  id                bigserial PRIMARY KEY,
  barcode           text UNIQUE NOT NULL,
  kit_type          text DEFAULT 'HPV_SELF',
  status            kit_status DEFAULT 'UNREGISTERED',
  facility_id       text,
  registered_by     uuid,
  registered_by_name text DEFAULT '',
  patient_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  patient_name      text DEFAULT '',
  collection_method text,
  collected_at      timestamptz,
  current_location  text DEFAULT '',
  received_at_lab   timestamptz,
  result            text DEFAULT '',
  result_notes      text DEFAULT '',
  processed_at      timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sample_kit_events (
  id              bigserial PRIMARY KEY,
  kit_id          bigint REFERENCES sample_kits(id) ON DELETE CASCADE,
  event_type      text NOT NULL,
  event_data      jsonb DEFAULT '{}',
  performed_by    uuid,
  performed_by_name text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 5b. SAMPLE BATCHES (lab tech receives + processes batches)
-- ============================================================

CREATE TABLE IF NOT EXISTS sample_batches (
  id              bigserial PRIMARY KEY,
  batch_code      text UNIQUE NOT NULL,
  lab_tech_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  lab_tech_name   text DEFAULT '',
  status          batch_status DEFAULT 'receiving',
  sample_count    integer DEFAULT 0,
  processed_count integer DEFAULT 0,
  facility_id     text,
  notes           text DEFAULT '',
  submitted_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sample_batch_items (
  id              bigserial PRIMARY KEY,
  batch_id        bigint REFERENCES sample_batches(id) ON DELETE CASCADE,
  kit_barcode     text NOT NULL,
  kit_id          bigint REFERENCES sample_kits(id) ON DELETE SET NULL,
  patient_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  patient_name    text DEFAULT '',
  status          text DEFAULT 'pending',
  result          text DEFAULT '',
  result_notes    text DEFAULT '',
  processed_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 5c. CLINICIAN PROFILES (approval + specialization)
-- ============================================================

-- Add clinician approval columns to providers table
ALTER TABLE providers ADD COLUMN IF NOT EXISTS approval_status approval_status DEFAULT 'pending';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS specialization clinician_specialty DEFAULT 'general_practitioner';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS county text DEFAULT '';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS sub_county text DEFAULT '';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS photo text DEFAULT '';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS years_experience integer DEFAULT 0;

-- ============================================================
-- 6. SYNC LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS sync_log (
  id              bigserial PRIMARY KEY,
  table_name      text UNIQUE NOT NULL,
  last_synced_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 7. FULL-TEXT SEARCH INDEXES (for search/filter/sort)
-- ============================================================

-- Users: search by name, email, patient_id, county
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_patient_id ON users (patient_id);
CREATE INDEX IF NOT EXISTS idx_users_county ON users (county);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_risk_index ON users (risk_index);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);

-- Screenings: search by profile_id, risk_tier, verdict, date
CREATE INDEX IF NOT EXISTS idx_screenings_profile_id ON screenings (profile_id);
CREATE INDEX IF NOT EXISTS idx_screenings_risk_tier ON screenings (risk_tier);
CREATE INDEX IF NOT EXISTS idx_screenings_created_at ON screenings (created_at DESC);

-- Vaccines: search by user_id, status, date
CREATE INDEX IF NOT EXISTS idx_vaccines_user_id ON vaccines (user_id);
CREATE INDEX IF NOT EXISTS idx_vaccines_status ON vaccines (status);
CREATE INDEX IF NOT EXISTS idx_vaccines_date ON vaccines (date DESC);

-- Appointments: search by user_id, status, date
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (date DESC);

-- Notifications: search by user_id, read, type
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

-- Lab results: search by user_id, result, date
CREATE INDEX IF NOT EXISTS idx_lab_results_user_id ON lab_results (user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_result ON lab_results (result);
CREATE INDEX IF NOT EXISTS idx_lab_results_created_at ON lab_results (created_at DESC);

-- Follow-ups: search by user_id, completed
CREATE INDEX IF NOT EXISTS idx_followups_user_id ON followups (user_id);
CREATE INDEX IF NOT EXISTS idx_followups_completed ON followups (completed);

-- Scheduled actions: search by user_id, completed, date
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_user_id ON scheduled_actions (user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_completed ON scheduled_actions (completed);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_scheduled_date ON scheduled_actions (scheduled_date DESC);

-- Reports: search by user_id, admin_id
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_admin_id ON reports (admin_id);

-- Facilities: search by name, county, type
CREATE INDEX IF NOT EXISTS idx_facilities_name_trgm ON facilities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_facilities_county ON facilities (county);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities (facility_type);

-- Articles: search by title, category, tags
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON articles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING gin (tags);

-- Chat: search conversations by contact_name
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_contact_name_trgm ON chat_conversations USING gin (contact_name gin_trgm_ops);

-- Chat messages: by conversation_id, sender_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages (created_at DESC);

-- Sample kits: search by barcode, patient_id, status
CREATE INDEX IF NOT EXISTS idx_sample_kits_barcode ON sample_kits (barcode);
CREATE INDEX IF NOT EXISTS idx_sample_kits_patient_id ON sample_kits (patient_id);
CREATE INDEX IF NOT EXISTS idx_sample_kits_status ON sample_kits (status);
CREATE INDEX IF NOT EXISTS idx_sample_kits_created_at ON sample_kits (created_at DESC);

-- Sample kit events: by kit_id
CREATE INDEX IF NOT EXISTS idx_sample_kit_events_kit_id ON sample_kit_events (kit_id);

-- Sample batches: by lab_tech_id, status, batch_code
CREATE INDEX IF NOT EXISTS idx_sample_batches_lab_tech ON sample_batches (lab_tech_id);
CREATE INDEX IF NOT EXISTS idx_sample_batches_status ON sample_batches (status);
CREATE INDEX IF NOT EXISTS idx_sample_batches_code ON sample_batches (batch_code);
CREATE INDEX IF NOT EXISTS idx_sample_batches_created_at ON sample_batches (created_at DESC);

-- Sample batch items: by batch_id, kit_barcode, patient_id
CREATE INDEX IF NOT EXISTS idx_batch_items_batch_id ON sample_batch_items (batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_kit_barcode ON sample_batch_items (kit_barcode);
CREATE INDEX IF NOT EXISTS idx_batch_items_patient_id ON sample_batch_items (patient_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_status ON sample_batch_items (status);

-- Providers: search by approval_status, specialization, hospital, county
CREATE INDEX IF NOT EXISTS idx_providers_approval ON providers (approval_status);
CREATE INDEX IF NOT EXISTS idx_providers_specialization ON providers (specialization);
CREATE INDEX IF NOT EXISTS idx_providers_hospital ON providers (hospital);
CREATE INDEX IF NOT EXISTS idx_providers_county ON providers (county);

-- Appointments: by clinician_id, provider_id
CREATE INDEX IF NOT EXISTS idx_appointments_clinician_id ON appointments (clinician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments (provider_id);

-- ============================================================
-- 8. RPC FUNCTIONS
-- ============================================================

-- Increment user's total_screenings count
CREATE OR REPLACE FUNCTION increment_screenings(uid uuid)
RETURNS void AS $$
BEGIN
  UPDATE users SET
    total_screenings = total_screenings + 1,
    last_screening_date = now()::text
  WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment user's total_vaccines count
CREATE OR REPLACE FUNCTION increment_vaccines(uid uuid)
RETURNS void AS $$
BEGIN
  UPDATE users SET
    total_vaccines = total_vaccines + 1,
    last_vaccine_date = now()::text
  WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE telehealth_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_kit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Allow anon read on public tables
CREATE POLICY "Public read facilities" ON facilities FOR SELECT USING (true);
CREATE POLICY "Public read articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read chat_contacts" ON chat_contacts FOR SELECT USING (true);

-- Authenticated users: read own data
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users read own screenings" ON screenings FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users read own vaccines" ON vaccines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own lab_results" ON lab_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own test_results" ON test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own followups" ON followups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own feedback" ON feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own scheduled_actions" ON scheduled_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own consent_log" ON consent_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own sample_kits" ON sample_kits FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users read own kit_events" ON sample_kit_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM sample_kits sk WHERE sk.id = kit_events.kit_id AND sk.patient_id = auth.uid())
);

-- Users can insert
CREATE POLICY "Users insert own screenings" ON screenings FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users insert own vaccines" ON vaccines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own followups" ON followups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own scheduled_actions" ON scheduled_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own consent_log" ON consent_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own data
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users update own followups" ON followups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users update own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users update own vaccines" ON vaccines FOR UPDATE USING (auth.uid() = user_id);

-- Chat: users read conversations they own, messages in their conversations
CREATE POLICY "Users read own conversations" ON chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own conversations" ON chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations" ON chat_conversations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users read own chat_messages" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid())
);
CREATE POLICY "Users insert own chat_messages" ON chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid())
);

-- Telehealth messages
CREATE POLICY "Users read own telehealth" ON telehealth_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own telehealth" ON telehealth_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sample batches: lab techs read/manage their own batches
CREATE POLICY "Lab techs read own batches" ON sample_batches FOR SELECT USING (auth.uid() = lab_tech_id);
CREATE POLICY "Lab techs insert batches" ON sample_batches FOR INSERT WITH CHECK (auth.uid() = lab_tech_id);
CREATE POLICY "Lab techs update own batches" ON sample_batches FOR UPDATE USING (auth.uid() = lab_tech_id);

-- Sample batch items: accessible via batch ownership
CREATE POLICY "Lab techs read batch items" ON sample_batch_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM sample_batches sb WHERE sb.id = sample_batch_items.batch_id AND sb.lab_tech_id = auth.uid())
);
CREATE POLICY "Lab techs insert batch items" ON sample_batch_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM sample_batches sb WHERE sb.id = sample_batch_items.batch_id AND sb.lab_tech_id = auth.uid())
);
CREATE POLICY "Lab techs update batch items" ON sample_batch_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM sample_batches sb WHERE sb.id = sample_batch_items.batch_id AND sb.lab_tech_id = auth.uid())
);

-- ============================================================
-- 10. SEED DATA — Articles (health library)
-- ============================================================

INSERT INTO articles (title, summary, content, category, tags, read_time) VALUES
('Understanding HPV and Cervical Cancer',
 'Learn about the Human Papillomavirus (HPV) and how it relates to cervical cancer. HPV is the leading cause of cervical cancer worldwide.',
 'Human Papillomavirus (HPV) is the most common sexually transmitted infection globally. Nearly all cervical cancers (99.7%) are caused by persistent infection with high-risk HPV types. HPV types 16 and 18 are responsible for approximately 70% of all cervical cancers. In Kenya, HPV vaccination was introduced in 2019 as part of the national immunization program, targeting girls aged 10-14 years. Early detection through regular screening can prevent up to 90% of cervical cancer cases.',
 'HPV & Prevention', ARRAY['hpv', 'prevention', 'kenya'], '6 min read'),

('Cervical Cancer Screening Methods',
 'Overview of screening methods available in Kenya including VIA, Pap smear, and HPV DNA testing.',
 'Cervical cancer screening is the process of testing for pre-cancerous changes in the cervix that could develop into cancer if left untreated. In Kenya, the most common screening methods include: Visual Inspection with Acetic Acid (VIA) - a simple, low-cost method widely available in county hospitals; Pap Smear - the traditional screening method that examines cells from the cervix; HPV DNA Testing - the most sensitive test, able to detect high-risk HPV types before cells become abnormal. The Ministry of Health recommends screening every 3 years for women aged 25-49, and every 5 years for women aged 50-65.',
 'Screening', ARRAY['screening', 'via', 'pap-smear', 'hpv-test', 'kenya'], '8 min read'),

('HPV Vaccination Guide',
 'Everything you need to know about the HPV vaccine, eligibility, schedules, and where to get vaccinated in Kenya.',
 'The HPV vaccine is a safe and effective way to prevent cervical cancer. In Kenya, the HPV vaccine is provided free of charge to girls aged 10-14 years through the school-based immunization program. The vaccine is given in two doses, 6-12 months apart. For those who miss the school program, catch-up vaccination is available at county health facilities. The vaccine protects against HPV types 16 and 18, which cause about 70% of cervical cancers. Studies show the vaccine provides protection for at least 10-15 years after vaccination.',
 'Vaccination', ARRAY['vaccine', 'hpv', 'immunization', 'kenya'], '5 min read'),

('Risk Factors for Cervical Cancer',
 'Key risk factors include HPV infection, HIV status, smoking, number of sexual partners, and family history.',
 'Several factors increase the risk of developing cervical cancer: Persistent HPV infection is the primary cause; HIV-positive women have a 6-fold increased risk due to weakened immune system; Smoking doubles the risk as chemicals damage cervical cells; Early onset of sexual activity (before age 18) increases HPV exposure; Multiple sexual partners increase HPV exposure risk; Long-term use of oral contraceptives (5+ years) may slightly increase risk; Family history of cervical cancer suggests possible genetic susceptibility. In Kenya, HIV-positive women should be screened more frequently (annually) and are eligible for enhanced screening protocols.',
 'Risk Factors', ARRAY['risk', 'hiv', 'smoking', 'family-history'], '7 min read'),

('Understanding Your Screening Results',
 'What your VIA, Pap, or HPV test results mean, and what steps to take next.',
 'Understanding your screening results is crucial for taking appropriate action: VIA Negative (-) means no abnormal changes detected; screen again in 3 years. VIA Positive (+) means abnormal changes detected; colposcopy or immediate treatment may be recommended. Pap Smear results range from Normal to ASCUS, LSIL, HSIL, or SCC. HPV test results show whether high-risk HPV types were detected. If results are abnormal, do not panic - most pre-cancerous changes can be treated successfully. Follow up with your healthcare provider within 2 weeks. In Kenya, same-day screen-and-treat protocols are available at many facilities.',
 'Results', ARRAY['results', 'interpretation', 'follow-up'], '5 min read'),

('Treatment Options for Pre-Cancerous Lesions',
 'Overview of treatment options including cryotherapy, LEEP, and cone biopsy for pre-cancerous cervical changes.',
 'Pre-cancerous cervical lesions can be effectively treated to prevent progression to cancer: Cryotherapy uses extreme cold to destroy abnormal cells - a simple outpatient procedure available in most county hospitals. LEEP (Loop Electrosurgical Excision Procedure) removes abnormal tissue using a thin wire loop with electrical current. Cone Biopsy removes a cone-shaped piece of tissue for both diagnosis and treatment. These procedures are typically quick (15-30 minutes), performed under local anesthesia, and have high success rates (>90%). Kenya has invested in training healthcare workers in screen-and-treat protocols to ensure immediate treatment after positive screening.',
 'Treatment', ARRAY['treatment', 'cryotherapy', 'leep', 'cone-biopsy'], '6 min read'),

('Cervical Cancer in Kenya: Current Status',
 'Statistics, challenges, and progress in the fight against cervical cancer in Kenya.',
 'Kenya faces a significant cervical cancer burden with approximately 5,735 new cases and 3,489 deaths annually. The country has made progress with HPV vaccination introduction in 2019, expansion of screening services to county hospitals, and adoption of WHO screen-and-treat guidelines. Challenges include limited screening coverage (estimated at 17%), healthcare worker shortages in rural areas, and cultural barriers to accessing services. The National Cancer Control Strategy 2017-2022 aims to increase screening coverage to 30% by 2025. County governments are establishing cancer screening centers and training community health workers for outreach.',
 'Kenya Context', ARRAY['kenya', 'statistics', 'policy', 'naccs'], '8 min read'),

('HIV and Cervical Cancer: Special Considerations',
 'Why HIV-positive women need more frequent screening and how HIV affects cervical cancer risk.',
 'Women living with HIV (WLHIV) face significantly higher risk of cervical cancer - up to 6 times more likely than HIV-negative women. HIV weakens the immune system, making it harder to clear HPV infections naturally. The WHO recommends: annual screening for WLHIV, starting at age 25; HPV DNA testing as the preferred method (more sensitive); immediate treatment for any positive result. In Kenya, the national program integrates cervical cancer screening into HIV care services at comprehensive care clinics (CCC). ART adherence also plays a role - well-managed HIV with undetectable viral load may reduce cervical cancer risk.',
 'HIV', ARRAY['hiv', 'wlhiv', 'coinfection', 'screening-frequency'], '6 min read'),

('Self-Sampling for HPV Testing',
 'How at-home HPV self-sampling works and its role in increasing screening access in Kenya.',
 'HPV self-sampling allows women to collect their own vaginal sample for HPV testing, increasing screening access especially in underserved areas. The process involves: requesting a self-sampling kit from a healthcare provider or community health worker; following illustrated instructions to collect the sample at home; returning the sample to the facility for laboratory analysis. Studies show self-sampling achieves similar accuracy to clinician-collected samples for HPV detection. Kenya has piloted self-sampling programs in several counties, showing promising results in reaching women who previously never screened. The CerviTrack system supports self-sampling by tracking kits from distribution to result.',
 'Self-Sampling', ARRAY['self-sampling', 'hpv', 'access', 'home-testing'], '5 min read'),

('Frequently Asked Questions',
 'Common questions about cervical cancer screening, vaccination, and the CerviTrack system.',
 'Q: Is cervical cancer screening painful? A: VIA screening is generally painless and takes less than a minute. Q: How often should I be screened? A: Every 3 years for ages 25-49, every 5 years for ages 50-65. Q: Can I get screened while pregnant? A: Yes, screening is safe during pregnancy. Q: Where can I get screened? A: Visit your nearest county hospital or health center offering cervical cancer screening. Q: Is the HPV vaccine safe? A: Yes, the HPV vaccine has been extensively studied and proven safe. Q: Does CerviTrack cost anything? A: CerviTrack is a free tool provided by the Kenyan healthcare system. Q: How do I access my results? A: Results are available through the CerviTrack app or web portal using your patient ID.',
 'FAQ', ARRAY['faq', 'questions', 'common'], '4 min read'),

('Prevention Through Healthy Living',
 'Lifestyle changes that can reduce cervical cancer risk, including nutrition and wellness tips.',
 'While HPV vaccination and regular screening are the most effective prevention methods, healthy lifestyle choices can also reduce cervical cancer risk: Maintain a balanced diet rich in fruits, vegetables, and antioxidants that support immune function; Exercise regularly to boost immune system health; Avoid smoking - quitting reduces cervical cancer risk significantly; Practice safe sex to reduce HPV exposure; Limit number of sexual partners; Manage stress through mindfulness and relaxation techniques. Remember: prevention is always better than cure. Regular screening combined with vaccination provides the best protection against cervical cancer.',
 'Prevention', ARRAY['prevention', 'lifestyle', 'nutrition', 'wellness'], '4 min read'),

('Supporting a Loved One Through Screening',
 'How to support family members and friends during cervical cancer screening and treatment.',
 'Support from family and friends plays a crucial role in cervical cancer prevention and treatment: Encourage regular screening - talk openly about the importance of cervical cancer screening; Accompany loved ones to appointments for emotional support; Help overcome cultural barriers through respectful dialogue about women''s health; Assist with transportation to screening facilities; Help manage follow-up appointments and treatment schedules; Provide emotional support during treatment; Share accurate information to combat myths and misinformation. Community health workers and peer support groups in Kenya can also provide valuable support during the screening and treatment journey.',
 'Support', ARRAY['support', 'family', 'community', 'peer'], '4 min read')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. SEED DATA — Facilities
-- ============================================================

INSERT INTO facilities (name, location, distance, phone, hours, services, county, facility_type) VALUES
('Kenyatta National Hospital', 'Upper Hill, Nairobi', 0, '+254-20-272-6300', '24/7', 'Screening, Treatment, Surgery, Vaccination', 'Nairobi', 'tertiary'),
('Moi Teaching and Referral Hospital', 'Nandi Road, Eldoret', 0, '+254-53-203-3481', '24/7', 'Screening, Treatment, Surgery', 'Uasin Gishu', 'tertiary'),
('Coast General Hospital', 'Mombasa', 0, '+254-41-231-2911', '24/7', 'Screening, Treatment, Vaccination', 'Mombasa', 'secondary'),
('Kisumu County Hospital', 'Kisumu City', 0, '+257-57-202-5505', '8am-5pm', 'Screening, Treatment, Vaccination', 'Kisumu', 'secondary'),
('Nakuru Level 5 Hospital', 'Nakuru Town', 0, '+257-51-221-4455', '8am-5pm', 'Screening, Treatment', 'Nakuru', 'secondary'),
('Nyeri County Referral Hospital', 'Nyeri Town', 0, '+254-61-203-2030', '8am-5pm', 'Screening, Treatment, Vaccination', 'Nyeri', 'secondary'),
('Meru County Referral Hospital', 'Meru Town', 0, '+254-64-203-0003', '8am-5pm', 'Screening, Treatment', 'Meru', 'secondary'),
('Machakos County Hospital', 'Machakos Town', 0, '+254-44-202-3122', '8am-5pm', 'Screening, Treatment', 'Machakos', 'secondary'),
('Garissa County Referral Hospital', 'Garissa Town', 0, '+254-46-210-2236', '8am-5pm', 'Screening, Treatment', 'Garissa', 'secondary'),
('Kakamega County General Hospital', 'Kakamega Town', 0, '+254-56-202-1065', '8am-5pm', 'Screening, Treatment, Vaccination', 'Kakamega', 'secondary'),
('Busia County Referral Hospital', 'Busia Town', 0, '+254-55-203-0066', '8am-5pm', 'Screening, Treatment', 'Busia', 'secondary'),
('Kitale County Hospital', 'Kitale Town', 0, '+254-54-202-0022', '8am-5pm', 'Screening, Treatment', 'Trans-Nzoia', 'secondary'),
('Thika Level 5 Hospital', 'Thika Town', 0, '+254-67-202-0320', '8am-5pm', 'Screening, Treatment', 'Kiambu', 'secondary'),
('Embu County Referral Hospital', 'Embu Town', 0, '+254-68-203-0221', '8am-5pm', 'Screening, Treatment', 'Embu', 'secondary'),
('Murang''a County Referral Hospital', 'Murang''a Town', 0, '+254-60-202-0030', '8am-5pm', 'Screening, Treatment', 'Murang''a', 'secondary'),
('Kericho County Hospital', 'Kericho Town', 0, '+254-52-202-0041', '8am-5pm', 'Screening, Treatment', 'Kericho', 'secondary'),
('Bomet County Referral Hospital', 'Bomet Town', 0, '+254-52-202-1100', '8am-5pm', 'Screening, Treatment', 'Bomet', 'secondary'),
('Isiolo County Referral Hospital', 'Isiolo Town', 0, '+254-64-202-1050', '8am-5pm', 'Screening, Treatment', 'Isiolo', 'secondary'),
('Marsabit County Hospital', 'Marsabit Town', 0, '+254-65-202-0050', '8am-5pm', 'Screening, Treatment', 'Marsabit', 'secondary'),
('Wajir County Hospital', 'Wajir Town', 0, '+254-232-202-0050', '8am-5pm', 'Screening, Treatment', 'Wajir', 'secondary'),
('Mandera County Hospital', 'Mandera Town', 0, '+254-202-202-0050', '8am-5pm', 'Screening, Treatment', 'Mandera', 'secondary'),
('Samburu County Hospital', 'Maralal Town', 0, '+254-63-202-0050', '8am-5pm', 'Screening, Treatment', 'Samburu', 'secondary'),
('Vihiga County Hospital', 'Mbale Town', 0, '+254-56-202-1100', '8am-5pm', 'Screening, Treatment', 'Vihiga', 'secondary'),
('Siaya County Hospital', 'Siaya Town', 0, '+254-57-202-1100', '8am-5pm', 'Screening, Treatment', 'Siaya', 'secondary'),
('Homa Bay County Hospital', 'Homa Bay Town', 0, '+254-57-202-1100', '8am-5pm', 'Screening, Treatment', 'Homa Bay', 'secondary'),
('Nyamira County Hospital', 'Nyamira Town', 0, '+254-58-202-1100', '8am-5pm', 'Screening, Treatment', 'Nyamira', 'secondary'),
('Narok County Referral Hospital', 'Narok Town', 0, '+254-202-202-1100', '8am-5pm', 'Screening, Treatment', 'Narok', 'secondary'),
('Kilifi County Hospital', 'Kilifi Town', 0, '+254-42-202-1100', '8am-5pm', 'Screening, Treatment', 'Kilifi', 'secondary'),
('Kwale County Hospital', 'Kwale Town', 0, '+254-40-202-1100', '8am-5pm', 'Screening, Treatment', 'Kwale', 'secondary'),
('Taita Taveta County Hospital', 'Voi Town', 0, '+254-43-202-1100', '8am-5pm', 'Screening, Treatment', 'Taita Taveta', 'secondary'),
('Lamu County Hospital', 'Lamu Town', 0, '+254-42-202-1100', '8am-5pm', 'Screening, Treatment', 'Lamu', 'secondary'),
('Tana River County Hospital', 'Hola Town', 0, '+254-202-202-1100', '8am-5pm', 'Screening, Treatment', 'Tana River', 'secondary'),
('Laikipia County Hospital', 'Nanyuki Town', 0, '+254-62-202-1100', '8am-5pm', 'Screening, Treatment', 'Laikipia', 'secondary'),
('Nyandarua County Hospital', 'Ol Kalou Town', 0, '+254-202-202-1100', '8am-5pm', 'Screening, Treatment', 'Nyandarua', 'secondary'),
('Elgeyo Marakwet Hospital', 'Iten Town', 0, '+254-53-202-1100', '8am-5pm', 'Screening, Treatment', 'Elgeyo Marakwet', 'secondary'),
('Nandi County Hospital', 'Kapsabet Town', 0, '+254-53-202-1100', '8am-5pm', 'Screening, Treatment', 'Nandi', 'secondary'),
('Bungoma County Hospital', 'Bungoma Town', 0, '+254-55-202-1100', '8am-5pm', 'Screening, Treatment', 'Bungoma', 'secondary'),
('Turkana County Hospital', 'Lodwar Town', 0, '+254-202-202-1100', '8am-5pm', 'Screening, Treatment', 'Turkana', 'secondary'),
('West Pokot County Hospital', 'Kapenguria Town', 0, '+254-54-202-1100', '8am-5pm', 'Screening, Treatment', 'West Pokot', 'secondary'),
('Trans Nzoia Hospital', 'Kitale Town', 0, '+254-54-202-1100', '8am-5pm', 'Screening, Treatment', 'Trans Nzoia', 'secondary'),
('Migori County Hospital', 'Migori Town', 0, '+254-57-202-1100', '8am-5pm', 'Screening, Treatment', 'Migori', 'secondary'),
('Kajiado County Hospital', 'Kajiado Town', 0, '+254-202-202-1100', '8am-5pm', 'Screening, Treatment', 'Kajiado', 'secondary'),
('Kiambu Level 5 Hospital', 'Kiambu Town', 0, '+254-67-202-1100', '8am-5pm', 'Screening, Treatment', 'Kiambu', 'secondary'),
('Makueni County Hospital', 'Wote Town', 0, '+254-44-202-1100', '8am-5pm', 'Screening, Treatment', 'Makueni', 'secondary'),
('Kitui County Hospital', 'Kitui Town', 0, '+254-44-202-1100', '8am-5pm', 'Screening, Treatment', 'Kitui', 'secondary'),
('Busia County Hospital', 'Busia Town', 0, '+254-55-202-1100', '8am-5pm', 'Screening, Treatment', 'Busia', 'secondary'),
('Bungoma County Hospital', 'Bungoma Town', 0, '+254-55-202-1100', '8am-5pm', 'Screening, Treatment', 'Bungoma', 'secondary')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. SEED DATA — Chat Contacts
-- ============================================================

INSERT INTO chat_contacts (name, role, specialty, hospital, online) VALUES
('Dr. Amina Wanjiku', 'clinician', 'Oncologist', 'Kenyatta National Hospital', true),
('Dr. James Ochieng', 'clinician', 'Gynecologist', 'Moi Teaching and Referral Hospital', true),
('Nurse Sarah Kimani', 'clinician', 'Nurse Practitioner', 'Nakuru Level 5 Hospital', false),
('Lab Tech Peter Mwangi', 'lab_technician', 'Pathologist', 'Coast General Hospital', true),
('Dr. Faith Akinyi', 'clinician', 'Public Health Officer', 'Kisumu County Hospital', false),
('System Administrator', 'admin', 'IT Support', 'CerviTrack HQ', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================
