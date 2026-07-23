-- Run this FIRST in Supabase SQL Editor (standalone fix)

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create extension first
-- (extensions already created above)

-- 3. Drop ALL tables first (so enum types can be dropped)
DROP TABLE IF EXISTS sample_batch_items CASCADE;
DROP TABLE IF EXISTS sample_batches CASCADE;
DROP TABLE IF EXISTS sample_kit_events CASCADE;
DROP TABLE IF EXISTS sample_kits CASCADE;
DROP TABLE IF EXISTS telehealth_messages CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS chat_contacts CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS consent_log CASCADE;
DROP TABLE IF EXISTS scheduled_actions CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS followups CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS lab_results CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS vaccines CASCADE;
DROP TABLE IF EXISTS screenings CASCADE;
DROP TABLE IF EXISTS sync_log CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- 4. Now drop old enum types (safe since no tables reference them)
DROP TYPE IF EXISTS risk_tier CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS vaccine_status CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS kit_status CASCADE;
DROP TYPE IF EXISTS batch_status CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;
DROP TYPE IF EXISTS clinician_specialty CASCADE;
DROP TYPE IF EXISTS sender_type CASCADE;

-- 5. Create enum types with correct values
CREATE TYPE user_role AS ENUM ('patient','lab_technician','clinician','facility_admin','county_admin','national_admin','system_admin');
CREATE TYPE risk_tier AS ENUM ('low','medium','high','critical');
CREATE TYPE vaccine_status AS ENUM ('scheduled','done','missed','cancelled');
CREATE TYPE appointment_status AS ENUM ('pending','upcoming','completed','cancelled');
CREATE TYPE notification_type AS ENUM ('info','reminder','alert','appointment','screening','admin','provider');
CREATE TYPE message_type AS ENUM ('text','image','audio');
CREATE TYPE kit_status AS ENUM ('UNREGISTERED','REGISTERED','PAIRED','COLLECTED','IN_TRANSIT','IN_LAB','PROCESSED');
CREATE TYPE batch_status AS ENUM ('receiving','testing','submitted');
CREATE TYPE approval_status AS ENUM ('pending','approved','rejected');
CREATE TYPE clinician_specialty AS ENUM ('oncologist','gynecologist','nurse_practitioner','public_health_officer','pathologist','general_practitioner','other');
CREATE TYPE sender_type AS ENUM ('patient','staff','system');

-- 6. Create tables in correct FK order

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
  approval_status approval_status DEFAULT 'pending',
  approved_by     uuid,
  approved_at     timestamptz,
  specialization  clinician_specialty DEFAULT 'general_practitioner',
  county          text DEFAULT '',
  sub_county      text DEFAULT '',
  ward            text DEFAULT '',
  bio             text DEFAULT '',
  photo           text DEFAULT '',
  years_experience integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS notifications (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT '',
  message     text NOT NULL DEFAULT '',
  type        notification_type DEFAULT 'info',
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_results (
  id            bigserial PRIMARY KEY,
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  patient_name  text DEFAULT '',
  result        text DEFAULT '',
  notes         text DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_results (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  result      text DEFAULT '',
  date        text DEFAULT '',
  image_path  text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS followups (
  id            bigserial PRIMARY KEY,
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  screening_id  bigint,
  completed     boolean DEFAULT false,
  completed_at  text,
  notes         text DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id          bigserial PRIMARY KEY,
  admin_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  type        text DEFAULT '',
  content     text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  category    text DEFAULT '',
  message     text DEFAULT '',
  contact     text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS consent_log (
  id              bigserial PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  consent_type    text DEFAULT '',
  consent_terms   boolean DEFAULT false,
  consent_medical boolean DEFAULT false,
  accepted        boolean DEFAULT false,
  accepted_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS facilities (
  id              bigserial PRIMARY KEY,
  name            text NOT NULL DEFAULT '',
  location        text DEFAULT '',
  distance        real DEFAULT 0,
  phone           text DEFAULT '',
  hours           text DEFAULT '',
  services        text DEFAULT '',
  county          text DEFAULT '',
  sub_county      text DEFAULT '',
  ward            text DEFAULT '',
  facility_type   text DEFAULT 'clinic',
  last_updated    timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS telehealth_messages (
  id              bigserial PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  sender          text DEFAULT '',
  message         text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS sync_log (
  id              bigserial PRIMARY KEY,
  table_name      text UNIQUE NOT NULL,
  last_synced_at  timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_patient_id ON users (patient_id);
CREATE INDEX IF NOT EXISTS idx_users_county ON users (county);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_risk_index ON users (risk_index);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screenings_profile_id ON screenings (profile_id);
CREATE INDEX IF NOT EXISTS idx_screenings_risk_tier ON screenings (risk_tier);
CREATE INDEX IF NOT EXISTS idx_screenings_created_at ON screenings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vaccines_user_id ON vaccines (user_id);
CREATE INDEX IF NOT EXISTS idx_vaccines_status ON vaccines (status);
CREATE INDEX IF NOT EXISTS idx_vaccines_date ON vaccines (date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_results_user_id ON lab_results (user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_result ON lab_results (result);
CREATE INDEX IF NOT EXISTS idx_lab_results_created_at ON lab_results (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_followups_user_id ON followups (user_id);
CREATE INDEX IF NOT EXISTS idx_followups_completed ON followups (completed);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_user_id ON scheduled_actions (user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_completed ON scheduled_actions (completed);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_scheduled_date ON scheduled_actions (scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_admin_id ON reports (admin_id);
CREATE INDEX IF NOT EXISTS idx_facilities_name_trgm ON facilities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_facilities_county ON facilities (county);
CREATE INDEX IF NOT EXISTS idx_facilities_sub_county ON facilities (sub_county);
CREATE INDEX IF NOT EXISTS idx_facilities_ward ON facilities (ward);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities (facility_type);
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON articles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_contact_name_trgm ON chat_conversations USING gin (contact_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sample_kits_barcode ON sample_kits (barcode);
CREATE INDEX IF NOT EXISTS idx_sample_kits_patient_id ON sample_kits (patient_id);
CREATE INDEX IF NOT EXISTS idx_sample_kits_status ON sample_kits (status);
CREATE INDEX IF NOT EXISTS idx_sample_kits_created_at ON sample_kits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sample_kit_events_kit_id ON sample_kit_events (kit_id);
CREATE INDEX IF NOT EXISTS idx_sample_batches_lab_tech ON sample_batches (lab_tech_id);
CREATE INDEX IF NOT EXISTS idx_sample_batches_status ON sample_batches (status);
CREATE INDEX IF NOT EXISTS idx_sample_batches_code ON sample_batches (batch_code);
CREATE INDEX IF NOT EXISTS idx_sample_batches_created_at ON sample_batches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_items_batch_id ON sample_batch_items (batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_kit_barcode ON sample_batch_items (kit_barcode);
CREATE INDEX IF NOT EXISTS idx_batch_items_patient_id ON sample_batch_items (patient_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_status ON sample_batch_items (status);
CREATE INDEX IF NOT EXISTS idx_providers_approval ON providers (approval_status);
CREATE INDEX IF NOT EXISTS idx_providers_specialization ON providers (specialization);
CREATE INDEX IF NOT EXISTS idx_providers_hospital ON providers (hospital);
CREATE INDEX IF NOT EXISTS idx_providers_county ON providers (county);
CREATE INDEX IF NOT EXISTS idx_providers_sub_county ON providers (sub_county);
CREATE INDEX IF NOT EXISTS idx_providers_ward ON providers (ward);
CREATE INDEX IF NOT EXISTS idx_appointments_clinician_id ON appointments (clinician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments (provider_id);

-- RPC Functions
CREATE OR REPLACE FUNCTION increment_screenings(uid uuid) RETURNS void AS $$ BEGIN UPDATE users SET total_screenings = total_screenings + 1, last_screening_date = now()::text WHERE id = uid; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION increment_vaccines(uid uuid) RETURNS void AS $$ BEGIN UPDATE users SET total_vaccines = total_vaccines + 1, last_vaccine_date = now()::text WHERE id = uid; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
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

-- Public read
CREATE POLICY "Public read facilities" ON facilities FOR SELECT USING (true);
CREATE POLICY "Public read articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read chat_contacts" ON chat_contacts FOR SELECT USING (true);

-- Service role
CREATE POLICY "Service role all users" ON users FOR ALL USING (auth.role() = 'service_role');

-- User policies
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users read all profiles" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users upsert own profile" ON users FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
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
CREATE POLICY "Users read own kit_events" ON sample_kit_events FOR SELECT USING (EXISTS (SELECT 1 FROM sample_kits sk WHERE sk.id = sample_kit_events.kit_id AND sk.patient_id = auth.uid()));

-- Insert policies
CREATE POLICY "Users insert own screenings" ON screenings FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users insert own vaccines" ON vaccines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own followups" ON followups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own scheduled_actions" ON scheduled_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own consent_log" ON consent_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update policies
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users update own followups" ON followups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users update own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users update own vaccines" ON vaccines FOR UPDATE USING (auth.uid() = user_id);

-- Chat policies
CREATE POLICY "Users read own conversations" ON chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own conversations" ON chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations" ON chat_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users read own chat_messages" ON chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid()));
CREATE POLICY "Users insert own chat_messages" ON chat_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid()));
CREATE POLICY "Users read own telehealth" ON telehealth_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own telehealth" ON telehealth_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Lab batch policies
CREATE POLICY "Lab techs read own batches" ON sample_batches FOR SELECT USING (auth.uid() = lab_tech_id);
CREATE POLICY "Lab techs insert batches" ON sample_batches FOR INSERT WITH CHECK (auth.uid() = lab_tech_id);
CREATE POLICY "Lab techs update own batches" ON sample_batches FOR UPDATE USING (auth.uid() = lab_tech_id);
CREATE POLICY "Lab techs read batch items" ON sample_batch_items FOR SELECT USING (EXISTS (SELECT 1 FROM sample_batches sb WHERE sb.id = sample_batch_items.batch_id AND sb.lab_tech_id = auth.uid()));
CREATE POLICY "Lab techs insert batch items" ON sample_batch_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM sample_batches sb WHERE sb.id = sample_batch_items.batch_id AND sb.lab_tech_id = auth.uid()));
CREATE POLICY "Lab techs update batch items" ON sample_batch_items FOR UPDATE USING (EXISTS (SELECT 1 FROM sample_batches sb WHERE sb.id = sample_batch_items.batch_id AND sb.lab_tech_id = auth.uid()));

-- Seed: Articles
INSERT INTO articles (title, summary, content, category, tags, read_time) VALUES
('Understanding HPV and Cervical Cancer', 'Learn about HPV and how it relates to cervical cancer.', 'Human Papillomavirus (HPV) is the most common sexually transmitted infection globally. Nearly all cervical cancers (99.7%) are caused by persistent infection with high-risk HPV types. HPV types 16 and 18 are responsible for approximately 70% of all cervical cancers.', 'HPV & Prevention', ARRAY['hpv','prevention','kenya'], '6 min read'),
('Cervical Cancer Screening Methods', 'Overview of screening methods available in Kenya.', 'Cervical cancer screening includes VIA, Pap Smear, and HPV DNA Testing. The Ministry of Health recommends screening every 3 years for women aged 25-49.', 'Screening', ARRAY['screening','via','pap-smear'], '8 min read'),
('HPV Vaccination Guide', 'Everything you know about the HPV vaccine.', 'The HPV vaccine is provided free of charge to girls aged 10-14 years through the school-based immunization program.', 'Vaccination', ARRAY['vaccine','hpv'], '5 min read'),
('Risk Factors for Cervical Cancer', 'Key risk factors include HPV infection, HIV status, smoking.', 'Persistent HPV infection is the primary cause. HIV-positive women have a 6-fold increased risk.', 'Risk Factors', ARRAY['risk','hiv','smoking'], '7 min read'),
('Understanding Your Screening Results', 'What your VIA, Pap, or HPV test results mean.', 'VIA Negative means no abnormal changes detected. VIA Positive means abnormal changes detected.', 'Results', ARRAY['results','follow-up'], '5 min read'),
('Frequently Asked Questions', 'Common questions about cervical cancer screening.', 'Q: Is screening painful? A: VIA is generally painless. Q: How often? A: Every 3 years for ages 25-49.', 'FAQ', ARRAY['faq','questions'], '4 min read')
ON CONFLICT DO NOTHING;

-- Seed: Facilities
INSERT INTO facilities (name, location, distance, phone, hours, services, county, sub_county, ward, facility_type) VALUES
('Kenyatta National Hospital', 'Upper Hill, Nairobi', 0, '+254-20-272-6300', '24/7', 'Screening, Treatment, Surgery, Vaccination', 'Nairobi', 'Nairobi West', 'Langata', 'tertiary'),
('Moi Teaching and Referral Hospital', 'Nandi Road, Eldoret', 0, '+254-53-203-3481', '24/7', 'Screening, Treatment, Surgery', 'Uasin Gishu', 'Ainabkoi', 'Ainabkoi', 'tertiary'),
('Coast General Hospital', 'Mombasa', 0, '+254-41-231-2911', '24/7', 'Screening, Treatment, Vaccination', 'Mombasa', 'Mvita', 'Mvita', 'secondary'),
('Kisumu County Hospital', 'Kisumu City', 0, '+257-57-202-5505', '8am-5pm', 'Screening, Treatment, Vaccination', 'Kisumu', 'Kisumu Central', 'Kisumu Central', 'secondary'),
('Nakuru Level 5 Hospital', 'Nakuru Town', 0, '+257-51-221-4455', '8am-5pm', 'Screening, Treatment', 'Nakuru', 'Nakuru Town', 'Nakuru Town East', 'secondary'),
('Nyeri County Referral Hospital', 'Nyeri Town', 0, '+254-61-203-2030', '8am-5pm', 'Screening, Treatment, Vaccination', 'Nyeri', 'Nyeri Central', 'Nyeri Central', 'secondary'),
('Meru County Referral Hospital', 'Meru Town', 0, '+254-64-203-0003', '8am-5pm', 'Screening, Treatment', 'Meru', 'Imenti Central', 'Imenti Central', 'secondary'),
('Machakos County Hospital', 'Machakos Town', 0, '+254-44-202-3122', '8am-5pm', 'Screening, Treatment', 'Machakos', 'Machakos Town', 'Machakos Town', 'secondary'),
('Garissa County Referral Hospital', 'Garissa Town', 0, '+254-46-210-2236', '8am-5pm', 'Screening, Treatment', 'Garissa', 'Garissa', 'Garissa Township', 'secondary'),
('Kakamega County General Hospital', 'Kakamega Town', 0, '+254-56-202-1065', '8am-5pm', 'Screening, Treatment, Vaccination', 'Kakamega', 'Kakamega Central', 'Kakamega Central', 'secondary')
ON CONFLICT DO NOTHING;

-- Seed: Chat Contacts
INSERT INTO chat_contacts (name, role, specialty, hospital, online) VALUES
('Dr. Amina Wanjiku', 'clinician', 'Oncologist', 'Kenyatta National Hospital', true),
('Dr. James Ochieng', 'clinician', 'Gynecologist', 'Moi Teaching and Referral Hospital', true),
('Nurse Sarah Kimani', 'clinician', 'Nurse Practitioner', 'Nakuru Level 5 Hospital', false),
('Lab Tech Peter Mwangi', 'lab_technician', 'Pathologist', 'Coast General Hospital', true),
('Dr. Faith Akinyi', 'clinician', 'Public Health Officer', 'Kisumu County Hospital', false),
('System Administrator', 'admin', 'IT Support', 'CerviTrack HQ', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Utility: cleanup orphaned auth users (used by /api/seed)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_orphaned_auth_users()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users
  WHERE email IN ('patient1@cervitrack.app','patient2@cervitrack.app','patient3@cervitrack.app',
    'patient4@cervitrack.app','patient5@cervitrack.app','patient6@cervitrack.app',
    'patient7@cervitrack.app','patient8@cervitrack.app','patient9@cervitrack.app',
    'patient10@cervitrack.app','nurse1@cervitrack.app','nurse2@cervitrack.app',
    'lab1@cervitrack.app','lab2@cervitrack.app','admin1@cervitrack.app',
    'admin2@cervitrack.app','clinician1@cervitrack.app','clinician2@cervitrack.app',
    'clinician3@cervitrack.app','clinician4@cervitrack.app','test_debug@cervitrack.app',
    'zzz_test_999@cervitrack.app');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DONE
-- ============================================================
