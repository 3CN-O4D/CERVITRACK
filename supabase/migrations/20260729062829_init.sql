-- ============================================================
-- CerviTrack - Consolidated Fresh Schema (init.sql)
-- Single source of truth: mobile app, web portals, kit-service.
-- Rerunnable: drops and recreates everything.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS sync_log CASCADE;
DROP TABLE IF EXISTS sample_batch_items CASCADE;
DROP TABLE IF EXISTS sample_batches CASCADE;
DROP TABLE IF EXISTS sample_kit_events CASCADE;
DROP TABLE IF EXISTS sample_kits CASCADE;
DROP TABLE IF EXISTS telehealth_messages CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS chat_contacts CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
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
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS kit_requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS wards CASCADE;
DROP TABLE IF EXISTS sub_counties CASCADE;
DROP TABLE IF EXISTS counties CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS risk_tier CASCADE;
DROP TYPE IF EXISTS vaccine_status CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS kit_status CASCADE;
DROP TYPE IF EXISTS batch_status CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;
DROP TYPE IF EXISTS clinician_specialty CASCADE;
DROP TYPE IF EXISTS sender_type CASCADE;

CREATE TYPE user_role AS ENUM ('patient','lab_technician','clinician','provider','facility_admin','county_admin','national_admin','system_admin','admin');
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

CREATE TABLE counties (
  id   bigserial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  code integer NOT NULL UNIQUE
);

CREATE TABLE sub_counties (
  id        bigserial PRIMARY KEY,
  name      text NOT NULL,
  county_id bigint NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  UNIQUE (name, county_id)
);

CREATE TABLE wards (
  id           bigserial PRIMARY KEY,
  name         text NOT NULL,
  sub_county_id bigint NOT NULL REFERENCES sub_counties(id) ON DELETE CASCADE,
  UNIQUE (name, sub_county_id)
);

CREATE TABLE users (
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

CREATE TABLE providers (
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

CREATE TABLE screenings (
  id            bigserial PRIMARY KEY,
  profile_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
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
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE vaccines (
  id            bigserial PRIMARY KEY,
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  name          text NOT NULL DEFAULT '',
  hospital      text DEFAULT '',
  date          text DEFAULT '',
  status        vaccine_status DEFAULT 'scheduled',
  reminder_day  boolean DEFAULT false,
  reminder_before boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE appointments (
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
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE notifications (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT '',
  message     text NOT NULL DEFAULT '',
  type        notification_type DEFAULT 'info',
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE lab_results (
  id            bigserial PRIMARY KEY,
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  patient_name  text DEFAULT '',
  result        text DEFAULT '',
  notes         text DEFAULT '',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE test_results (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  result      text DEFAULT '',
  date        text DEFAULT '',
  image_path  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE followups (
  id            bigserial PRIMARY KEY,
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  screening_id  bigint,
  completed     boolean DEFAULT false,
  completed_at  text,
  notes         text DEFAULT '',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE reports (
  id          bigserial PRIMARY KEY,
  admin_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  type        text DEFAULT '',
  content     text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE feedback (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  category    text DEFAULT '',
  message     text DEFAULT '',
  contact     text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE scheduled_actions (
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

CREATE TABLE consent_log (
  id              bigserial PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  consent_type    text DEFAULT '',
  consent_terms   boolean DEFAULT false,
  consent_medical boolean DEFAULT false,
  accepted        boolean DEFAULT false,
  accepted_at     timestamptz DEFAULT now()
);

CREATE TABLE facilities (
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

CREATE TABLE articles (
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

CREATE TABLE chat_contacts (
  id              bigserial PRIMARY KEY,
  name            text NOT NULL DEFAULT '',
  role            text DEFAULT '',
  specialty       text DEFAULT '',
  hospital        text DEFAULT '',
  online          boolean DEFAULT false,
  last_updated    timestamptz DEFAULT now()
);

CREATE TABLE chat_conversations (
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

CREATE TABLE chat_messages (
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

CREATE TABLE conversations (
  id              bigserial PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  contact_id      bigint NOT NULL,
  contact_name    text DEFAULT '',
  contact_role    text DEFAULT '',
  online          boolean DEFAULT false,
  last_message    text DEFAULT '',
  last_time       timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE messages (
  id              bigserial PRIMARY KEY,
  conversation_id bigint REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       text NOT NULL,
  sender_type     text DEFAULT 'user',
  message_type    text DEFAULT 'text',
  content         text DEFAULT '',
  file_url        text,
  duration        text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE telehealth_messages (
  id              bigserial PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  sender          text DEFAULT '',
  message         text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE sample_kits (
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

CREATE TABLE sample_kit_events (
  id              bigserial PRIMARY KEY,
  kit_id          bigint REFERENCES sample_kits(id) ON DELETE CASCADE,
  event_type      text NOT NULL,
  event_data      jsonb DEFAULT '{}',
  performed_by    uuid,
  performed_by_name text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE sample_batches (
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

CREATE TABLE sample_batch_items (
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

CREATE TABLE sync_log (
  id              bigserial PRIMARY KEY,
  table_name      text UNIQUE NOT NULL,
  last_synced_at  timestamptz DEFAULT now()
);

CREATE TABLE kit_requests (
  id              bigserial PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  user_name       text DEFAULT '',
  user_phone      text DEFAULT '',
  user_county     text DEFAULT '',
  user_sub_county text DEFAULT '',
  user_ward       text DEFAULT '',
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'arranged', 'delivered', 'cancelled')),
  notes           text DEFAULT '',
  admin_notes     text DEFAULT '',
  contacted_at    timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);CREATE INDEX IF NOT EXISTS idx_counties_code ON counties (code);
CREATE INDEX IF NOT EXISTS idx_sub_counties_county_id ON sub_counties (county_id);
CREATE INDEX IF NOT EXISTS idx_wards_sub_county_id ON wards (sub_county_id);
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_patient_id ON users (patient_id);
CREATE INDEX IF NOT EXISTS idx_users_county ON users (county);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_risk_index ON users (risk_index);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screenings_profile_id ON screenings (profile_id);
CREATE INDEX IF NOT EXISTS idx_screenings_user_id ON screenings (user_id);
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
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_time ON conversations (last_time DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
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
CREATE INDEX IF NOT EXISTS idx_kit_requests_user_id ON kit_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_kit_requests_status ON kit_requests (status);
CREATE INDEX IF NOT EXISTS idx_kit_requests_created_at ON kit_requests (created_at DESC);

CREATE OR REPLACE FUNCTION increment_screenings(uid uuid) RETURNS void AS $$ BEGIN UPDATE users SET total_screenings = total_screenings + 1, last_screening_date = now()::text WHERE id = uid; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION increment_vaccines(uid uuid) RETURNS void AS $$ BEGIN UPDATE users SET total_vaccines = total_vaccines + 1, last_vaccine_date = now()::text WHERE id = uid; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_screenings_updated_at BEFORE UPDATE ON screenings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vaccines_updated_at BEFORE UPDATE ON vaccines FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lab_results_updated_at BEFORE UPDATE ON lab_results FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_test_results_updated_at BEFORE UPDATE ON test_results FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_followups_updated_at BEFORE UPDATE ON followups FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_kit_requests_updated_at BEFORE UPDATE ON kit_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sample_kits_updated_at BEFORE UPDATE ON sample_kits FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sample_batches_updated_at BEFORE UPDATE ON sample_batches FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION can_access_patient(target_patient_id uuid)
RETURNS boolean AS $$
DECLARE
  my_role text;
  my_county text;
  my_sub_county text;
BEGIN
  SELECT role::text, county, sub_county INTO my_role, my_county, my_sub_county
  FROM public.users WHERE id = auth.uid();
  IF my_role IS NULL THEN RETURN false; END IF;
  IF my_role = 'patient' THEN RETURN target_patient_id = auth.uid(); END IF;
  IF my_role IN ('system_admin','national_admin','admin') THEN RETURN true; END IF;
  IF my_role = 'county_admin' THEN
    RETURN EXISTS (SELECT 1 FROM public.users p WHERE p.id = target_patient_id AND p.county = my_county);
  END IF;
  IF my_role IN ('clinician','provider','lab_technician','facility_admin') THEN
    RETURN EXISTS (SELECT 1 FROM public.users p
      WHERE p.id = target_patient_id
        AND p.sub_county = my_sub_county
        AND (my_sub_county <> '' OR p.sub_county IS NULL));
  END IF;
  RETURN false;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE telehealth_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_kit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read counties" ON counties FOR SELECT USING (true);
CREATE POLICY "Public read sub_counties" ON sub_counties FOR SELECT USING (true);
CREATE POLICY "Public read wards" ON wards FOR SELECT USING (true);
CREATE POLICY "Public read facilities" ON facilities FOR SELECT USING (true);
CREATE POLICY "Public read articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read chat_contacts" ON chat_contacts FOR SELECT USING (true);
CREATE POLICY "Public read approved providers" ON providers FOR SELECT USING (approval_status = 'approved');

CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff read in-scope users" ON users FOR SELECT USING (can_access_patient(id));
CREATE POLICY "Service role all users" ON users FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users read own screenings" ON screenings FOR SELECT USING (auth.uid() = profile_id OR auth.uid() = user_id);
CREATE POLICY "Users insert own screenings" ON screenings FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Staff read in-scope screenings" ON screenings FOR SELECT USING (can_access_patient(user_id) OR can_access_patient(profile_id));

CREATE POLICY "Users read own vaccines" ON vaccines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own vaccines" ON vaccines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own vaccines" ON vaccines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope vaccines" ON vaccines FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope appointments" ON appointments FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope notifications" ON notifications FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own lab_results" ON lab_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope lab_results" ON lab_results FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own test_results" ON test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope test_results" ON test_results FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own followups" ON followups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own followups" ON followups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own followups" ON followups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope followups" ON followups FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope reports" ON reports FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own feedback" ON feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope feedback" ON feedback FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own scheduled_actions" ON scheduled_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scheduled_actions" ON scheduled_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope scheduled_actions" ON scheduled_actions FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own consent_log" ON consent_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own consent_log" ON consent_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope consent_log" ON consent_log FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own telehealth" ON telehealth_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own telehealth" ON telehealth_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope telehealth" ON telehealth_messages FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope conversations" ON conversations FOR SELECT USING (can_access_patient(user_id));

CREATE POLICY "Users read own messages" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users insert own messages" ON messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Staff read in-scope messages" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND can_access_patient(c.user_id)));

CREATE POLICY "Users read own chat_conversations" ON chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own chat_conversations" ON chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own chat_conversations" ON chat_conversations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users read own chat_messages" ON chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid()));
CREATE POLICY "Users insert own chat_messages" ON chat_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid()));

CREATE POLICY "Users read own kit_requests" ON kit_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own kit_requests" ON kit_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own kit_requests" ON kit_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff read in-scope kit_requests" ON kit_requests FOR SELECT USING (can_access_patient(user_id));
CREATE POLICY "Service role all kit_requests" ON kit_requests FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users read own sample_kits" ON sample_kits FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users insert own sample_kits" ON sample_kits FOR INSERT WITH CHECK (auth.uid() = patient_id OR patient_id IS NULL);
CREATE POLICY "Users update own sample_kits" ON sample_kits FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Staff read in-scope sample_kits" ON sample_kits FOR SELECT USING (can_access_patient(patient_id));
CREATE POLICY "Service role all sample_kits" ON sample_kits FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users read own kit events" ON sample_kit_events FOR SELECT USING (EXISTS (SELECT 1 FROM sample_kits sk WHERE sk.id = sample_kit_events.kit_id AND sk.patient_id = auth.uid()));
CREATE POLICY "Service role all sample_kit_events" ON sample_kit_events FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Lab techs read own batches" ON sample_batches FOR SELECT USING (auth.uid() = lab_tech_id);
CREATE POLICY "Lab techs insert batches" ON sample_batches FOR INSERT WITH CHECK (auth.uid() = lab_tech_id);
CREATE POLICY "Lab techs update own batches" ON sample_batches FOR UPDATE USING (auth.uid() = lab_tech_id);

CREATE POLICY "Lab techs read batch items" ON sample_batch_items FOR SELECT USING (EXISTS (SELECT 1 FROM sample_batches sb WHERE sb.id = sample_batch_items.batch_id AND sb.lab_tech_id = auth.uid()));
CREATE POLICY "Lab techs insert batch items" ON sample_batch_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM sample_batches sb WHERE sb.id = sample_batch_items.batch_id AND sb.lab_tech_id = auth.uid()));
CREATE POLICY "Lab techs update batch items" ON sample_batch_items FOR UPDATE USING (EXISTS (SELECT 1 FROM sample_batches sb WHERE sb.id = sample_batch_items.batch_id AND sb.lab_tech_id = auth.uid()));

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO authenticated, service_role;

INSERT INTO articles (title, summary, content, category, tags, read_time) VALUES
('Understanding HPV and Cervical Cancer', 'Learn about HPV and how it relates to cervical cancer.', 'Human Papillomavirus (HPV) is the most common sexually transmitted infection globally. Nearly all cervical cancers (99.7%) are caused by persistent infection with high-risk HPV types. HPV types 16 and 18 are responsible for approximately 70% of all cervical cancers.', 'HPV & Prevention', ARRAY['hpv','prevention','kenya'], '6 min read'),
('Cervical Cancer Screening Methods', 'Overview of screening methods available in Kenya.', 'Cervical cancer screening includes VIA, Pap Smear, and HPV DNA Testing. The Ministry of Health recommends screening every 3 years for women aged 25-49.', 'Screening', ARRAY['screening','via','pap-smear'], '8 min read'),
('HPV Vaccination Guide', 'Everything you know about the HPV vaccine.', 'The HPV vaccine is provided free of charge to girls aged 10-14 years through the school-based immunization program.', 'Vaccination', ARRAY['vaccine','hpv'], '5 min read'),
('Risk Factors for Cervical Cancer', 'Key risk factors include HPV infection, HIV status, smoking.', 'Persistent HPV infection is the primary cause. HIV-positive women have a 6-fold increased risk.', 'Risk Factors', ARRAY['risk','hiv','smoking'], '7 min read'),
('Understanding Your Screening Results', 'What your VIA, Pap, or HPV test results mean.', 'VIA Negative means no abnormal changes detected. VIA Positive means abnormal changes detected.', 'Results', ARRAY['results','follow-up'], '5 min read'),
('Frequently Asked Questions', 'Common questions about cervical cancer screening.', 'Q: Is screening painful? A: VIA is generally painless. Q: How often? A: Every 3 years for ages 25-49.', 'FAQ', ARRAY['faq','questions'], '4 min read')
ON CONFLICT DO NOTHING;

INSERT INTO facilities (name, location, distance, phone, hours, services, county, sub_county, ward, facility_type) VALUES
('Kenyatta National Hospital', 'Upper Hill, Nairobi', 0, '+254-20-272-6300', '24/7', 'Screening, Treatment, Surgery, Vaccination', 'Nairobi', 'Nairobi West', 'Langata', 'tertiary'),
('Moi Teaching and Referral Hospital', 'Nandi Road, Eldoret', 0, '+254-53-203-3481', '24/7', 'Screening, Treatment, Surgery', 'Uasin Gishu', 'Ainabkoi', 'Ainabkoi', 'tertiary'),
('Coast General Hospital', 'Mombasa', 0, '+254-41-231-2911', '24/7', 'Screening, Treatment, Vaccination', 'Mombasa', 'Mombasa Island', 'Kizingo', 'secondary'),
('Kisumu County Hospital', 'Kisumu City', 0, '+257-57-202-5505', '8am-5pm', 'Screening, Treatment, Vaccination', 'Kisumu', 'Kisumu Central', 'Kondele', 'secondary'),
('Nakuru Level 5 Hospital', 'Nakuru Town', 0, '+257-51-221-4455', '8am-5pm', 'Screening, Treatment', 'Nakuru', 'Nakuru Town East', 'Biashara', 'secondary'),
('Nyeri County Referral Hospital', 'Nyeri Town', 0, '+254-61-203-2030', '8am-5pm', 'Screening, Treatment, Vaccination', 'Nyeri', 'Nyeri Central', 'Nyeri Town', 'secondary'),
('Meru County Referral Hospital', 'Meru Town', 0, '+254-64-203-0003', '8am-5pm', 'Screening, Treatment', 'Meru', 'Meru Central', 'Meru Town', 'secondary'),
('Machakos County Hospital', 'Machakos Town', 0, '+254-44-202-3122', '8am-5pm', 'Screening, Treatment', 'Machakos', 'Machakos Town', 'Machakos Central', 'secondary'),
('Garissa County Referral Hospital', 'Garissa Town', 0, '+254-46-210-2236', '8am-5pm', 'Screening, Treatment', 'Garissa', 'Garissa', 'Garissa Town', 'secondary'),
('Kakamega County General Hospital', 'Kakamega Town', 0, '+254-56-202-1065', '8am-5pm', 'Screening, Treatment, Vaccination', 'Kakamega', 'Kakamega Central', 'Kakamega Town', 'secondary')
ON CONFLICT DO NOTHING;

INSERT INTO chat_contacts (name, role, specialty, hospital, online) VALUES
('Dr. Amina Wanjiku', 'clinician', 'Oncologist', 'Kenyatta National Hospital', true),
('Dr. James Ochieng', 'clinician', 'Gynecologist', 'Moi Teaching and Referral Hospital', true),
('Nurse Sarah Kimani', 'clinician', 'Nurse Practitioner', 'Nakuru Level 5 Hospital', false),
('Lab Tech Peter Mwangi', 'lab_technician', 'Pathologist', 'Coast General Hospital', true),
('Dr. Faith Akinyi', 'clinician', 'Public Health Officer', 'Kisumu County Hospital', false),
('System Administrator', 'admin', 'IT Support', 'CerviTrack HQ', true)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION cleanup_orphaned_auth_users()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users
  WHERE email IN ('patient1@cervitrack.app','patient2@cervitrack.app',
    'labtech1@cervitrack.app','labtech2@cervitrack.app',
    'clinician1@cervitrack.app','clinician2@cervitrack.app',
    'facility_admin1@cervitrack.app','facility_admin2@cervitrack.app',
    'county_admin1@cervitrack.app','county_admin2@cervitrack.app',
    'national_admin1@cervitrack.app','national_admin2@cervitrack.app',
    'system_admin1@cervitrack.app','system_admin2@cervitrack.app',
    'patient3@cervitrack.app','patient4@cervitrack.app',
    'patient5@cervitrack.app','patient6@cervitrack.app',
    'patient7@cervitrack.app','patient8@cervitrack.app',
    'patient9@cervitrack.app','patient10@cervitrack.app',
    'nurse1@cervitrack.app','nurse2@cervitrack.app',
    'lab1@cervitrack.app','lab2@cervitrack.app',
    'admin1@cervitrack.app','admin2@cervitrack.app',
    'clinician3@cervitrack.app','clinician4@cervitrack.app',
    'test_debug@cervitrack.app','zzz_test_999@cervitrack.app');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;-- Kenya reference data (counties, sub-counties, wards)
-- Generated from data/kenya.ts to guarantee dropdowns, DB seeds and app data stay identical.

INSERT INTO counties (id, name, code) VALUES
(1, 'Mombasa', 1),
(2, 'Nairobi', 47),
(3, 'Kisumu', 42),
(4, 'Kiambu', 22),
(5, 'Nakuru', 32),
(6, 'Uasin Gishu', 23),
(7, 'Machakos', 15),
(8, 'Meru', 12),
(9, 'Kakamega', 37),
(10, 'Kilifi', 3),
(11, 'Kisii', 16),
(12, 'Kitui', 18),
(13, 'Kwale', 2),
(14, 'Laikipia', 31),
(15, 'Makueni', 17),
(16, 'Nandi', 25),
(17, 'Narok', 34),
(18, 'Nyandarua', 36),
(19, 'Nyeri', 19),
(20, 'Siaya', 38),
(21, 'Taita Taveta', 6),
(22, 'Trans Nzoia', 26),
(23, 'Turkana', 24),
(24, 'Busia', 40),
(25, 'Bungoma', 39),
(26, 'Embu', 14),
(27, 'Garissa', 7),
(28, 'Homa Bay', 43),
(29, 'Isiolo', 11),
(30, 'Kajiado', 35),
(31, 'Kericho', 27),
(32, 'Kirinyaga', 20),
(33, 'Lamu', 5),
(34, 'Mandera', 9),
(35, 'Marsabit', 10),
(36, 'Migori', 44),
(37, 'Murang''a', 21),
(38, 'Samburu', 33),
(39, 'Tharaka Nithi', 13),
(40, 'Vihiga', 41),
(41, 'Wajir', 8),
(42, 'West Pokot', 28),
(43, 'Baringo', 29),
(44, 'Bomet', 46),
(45, 'Nyamira', 45),
(46, 'Elgeyo Marakwet', 30),
(47, 'Tana River', 4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO sub_counties (id, name, county_id) VALUES
(1, 'Mombasa Island', 1),
(2, 'Changamwe', 1),
(3, 'Likoni', 1),
(4, 'Kisauni', 1),
(5, 'Nyali', 1),
(6, 'Westlands', 2),
(7, 'Dagoretti North', 2),
(8, 'Dagoretti South', 2),
(9, 'Embakasi Central', 2),
(10, 'Embakasi East', 2),
(11, 'Embakasi North', 2),
(12, 'Embakasi South', 2),
(13, 'Embakasi West', 2),
(14, 'Kamukunji', 2),
(15, 'Kasarani', 2),
(16, 'Kibra', 2),
(17, 'Lang''ata', 2),
(18, 'Makadara', 2),
(19, 'Mathare', 2),
(20, 'Roysambu', 2),
(21, 'Ruaraka', 2),
(22, 'Starehe', 2),
(23, 'Kisumu Central', 3),
(24, 'Kisumu East', 3),
(25, 'Kisumu West', 3),
(26, 'Nyando', 3),
(27, 'Nyakach', 3),
(28, 'Kiambu', 4),
(29, 'Thika', 4),
(30, 'Ruiru', 4),
(31, 'Kikuyu', 4),
(32, 'Limuru', 4),
(33, 'Nakuru Town East', 5),
(34, 'Nakuru Town West', 5),
(35, 'Naivasha', 5),
(36, 'Gilgil', 5),
(37, 'Eldoret East', 6),
(38, 'Eldoret West', 6),
(39, 'Ainabkoi', 6),
(40, 'Machakos Town', 7),
(41, 'Mavoko', 7),
(42, 'Kangundo', 7),
(43, 'Meru Central', 8),
(44, 'Tigania', 8),
(45, 'Imenti North', 8),
(46, 'Kakamega Central', 9),
(47, 'Butere', 9),
(48, 'Lugari', 9),
(49, 'Kilifi North', 10),
(50, 'Kilifi South', 10),
(51, 'Malindi', 10),
(52, 'Kisii Central', 11),
(53, 'Kitutu Chache', 11),
(54, 'Nyaribari', 11),
(55, 'Kitui Central', 12),
(56, 'Mwingi', 12),
(57, 'Mutomo', 12),
(58, 'Kwale', 13),
(59, 'Kinango', 13),
(60, 'Matuga', 13),
(61, 'Laikipia East', 14),
(62, 'Laikipia North', 14),
(63, 'Laikipia West', 14),
(64, 'Makueni', 15),
(65, 'Kibwezi', 15),
(66, 'Mbooni', 15),
(67, 'Nandi Central', 16),
(68, 'Nandi East', 16),
(69, 'Nandi North', 16),
(70, 'Narok East', 17),
(71, 'Narok North', 17),
(72, 'Narok South', 17),
(73, 'Nyandarua North', 18),
(74, 'Nyandarua South', 18),
(75, 'Nyandarua West', 18),
(76, 'Nyeri Central', 19),
(77, 'Mathira', 19),
(78, 'Mukurweini', 19),
(79, 'Siaya', 20),
(80, 'Gem', 20),
(81, 'Bondo', 20),
(82, 'Taita', 21),
(83, 'Taveta', 21),
(84, 'Voi', 21),
(85, 'Trans Nzoia East', 22),
(86, 'Trans Nzoia West', 22),
(87, 'Turkana Central', 23),
(88, 'Turkana North', 23),
(89, 'Turkana South', 23),
(90, 'Busia', 24),
(91, 'Samia', 24),
(92, 'Teso', 24),
(93, 'Bungoma', 25),
(94, 'Mt Elgon', 25),
(95, 'Tongaren', 25),
(96, 'Embu Central', 26),
(97, 'Mbeere', 26),
(98, 'Manyatta', 26),
(99, 'Garissa', 27),
(100, 'Lagdera', 27),
(101, 'Fafi', 27),
(102, 'Homa Bay', 28),
(103, 'Mbita', 28),
(104, 'Suba', 28),
(105, 'Isiolo', 29),
(106, 'Merti', 29),
(107, 'Kajiado Central', 30),
(108, 'Kajiado North', 30),
(109, 'Kajiado East', 30),
(110, 'Kericho', 31),
(111, 'Bureti', 31),
(112, 'Soin', 31),
(113, 'Kirinyaga Central', 32),
(114, 'Mwea', 32),
(115, 'Gichugu', 32),
(116, 'Lamu East', 33),
(117, 'Lamu West', 33),
(118, 'Mandera East', 34),
(119, 'Mandera North', 34),
(120, 'Mandera South', 34),
(121, 'Marsabit', 35),
(122, 'Moyale', 35),
(123, 'Saku', 35),
(124, 'Migori', 36),
(125, 'Nyatike', 36),
(126, 'Uriri', 36),
(127, 'Murang''a', 37),
(128, 'Kandara', 37),
(129, 'Gatanga', 37),
(130, 'Samburu Central', 38),
(131, 'Samburu North', 38),
(132, 'Tharaka', 39),
(133, 'Meru South', 39),
(134, 'Vihiga', 40),
(135, 'Hamisi', 40),
(136, 'Tiriki', 40),
(137, 'Wajir East', 41),
(138, 'Wajir North', 41),
(139, 'Wajir South', 41),
(140, 'Pokot North', 42),
(141, 'Pokot South', 42),
(142, 'Pokot Central', 42),
(143, 'Baringo North', 43),
(144, 'Baringo South', 43),
(145, 'Baringo Central', 43),
(146, 'Bomet East', 44),
(147, 'Bomet Central', 44),
(148, 'Sotik', 44),
(149, 'Nyamira North', 45),
(150, 'Nyamira South', 45),
(151, 'Ekerenyo', 45),
(152, 'Elgeyo', 46),
(153, 'Marakwet East', 46),
(154, 'Marakwet West', 46),
(155, 'Tana North', 47),
(156, 'Tana South', 47)
ON CONFLICT (name, county_id) DO NOTHING;

INSERT INTO wards (id, name, sub_county_id) VALUES
(1, 'Majengo', 1),
(2, 'Tudor', 1),
(3, 'Old Town', 1),
(4, 'Kizingo', 1),
(5, 'Changamwe', 2),
(6, 'Port Tudor', 2),
(7, 'Kipevu', 2),
(8, 'Likoni', 3),
(9, 'Timbwani', 3),
(10, 'Mtongwe', 3),
(11, 'Mkomani', 4),
(12, 'Bamburi', 4),
(13, 'Mtopanga', 4),
(14, 'Frere Town', 5),
(15, 'Ziwa La Ng''ombe', 5),
(16, 'Kongowea', 5),
(17, 'Kitisuru', 6),
(18, 'Parklands', 6),
(19, 'Highridge', 6),
(20, 'Karura', 6),
(21, 'Kilimani', 7),
(22, 'Kawangware', 7),
(23, 'Gatina', 7),
(24, 'Kabiro', 7),
(25, 'Mutuini', 8),
(26, 'Ngando', 8),
(27, 'Riruta', 8),
(28, 'Uthiru', 8),
(29, 'Kayole', 9),
(30, 'Komarock', 9),
(31, 'Matopeni', 9),
(32, 'Mihango', 9),
(33, 'Upper Savanna', 10),
(34, 'Lower Savanna', 10),
(35, 'Embakasi', 10),
(36, 'Kariobangi North', 11),
(37, 'Dandora Area I', 11),
(38, 'Dandora Area II', 11),
(39, 'Imara Daima', 12),
(40, 'Kwa Njenga', 12),
(41, 'Kwa Reuben', 12),
(42, 'Pipeline', 12),
(43, 'Umoja I', 13),
(44, 'Umoja II', 13),
(45, 'Mowlem', 13),
(46, 'Kariobangi South', 13),
(47, 'Pumwani', 14),
(48, 'Eastleigh North', 14),
(49, 'Eastleigh South', 14),
(50, 'Clay City', 15),
(51, 'Mwiki', 15),
(52, 'Kasarani', 15),
(53, 'Njiru', 15),
(54, 'Ruai', 15),
(55, 'Laini Saba', 16),
(56, 'Lindi', 16),
(57, 'Makina', 16),
(58, 'Woodley', 16),
(59, 'Sarang''ombe', 16),
(60, 'Karen', 17),
(61, 'Lang''ata', 17),
(62, 'Otiende', 17),
(63, 'Railways', 17),
(64, 'South C', 17),
(65, 'Maringo', 18),
(66, 'Viwandani', 18),
(67, 'Harambee', 18),
(68, 'Makongeni', 18),
(69, 'Mabatini', 19),
(70, 'Kiamaiko', 19),
(71, 'Ngei', 19),
(72, 'Huruma', 19),
(73, 'Mathare North', 19),
(74, 'Roysambu', 20),
(75, 'Githurai', 20),
(76, 'Kahawa', 20),
(77, 'Zimmerman', 20),
(78, 'Baba Dogo', 21),
(79, 'Utalii', 21),
(80, 'Mathare North', 21),
(81, 'Lucky Summer', 21),
(82, 'Nairobi Central', 22),
(83, 'Ngara', 22),
(84, 'Pangani', 22),
(85, 'Ziwani', 22),
(86, 'Kondele', 23),
(87, 'Nyalenda A', 23),
(88, 'Nyalenda B', 23),
(89, 'Manyatta A', 23),
(90, 'Manyatta B', 23),
(91, 'Kajulu', 24),
(92, 'Kolwa', 24),
(93, 'Migosi', 24),
(94, 'Onyi''njo', 24),
(95, 'West Kisumu', 25),
(96, 'North Kisumu', 25),
(97, 'Ombeyi', 25),
(98, 'Chiga', 25),
(99, 'Awasi', 26),
(100, 'Omia', 26),
(101, 'Kochieng', 26),
(102, 'Kakola', 26),
(103, 'Pap Onditi', 27),
(104, 'North Nyakach', 27),
(105, 'South Nyakach', 27),
(106, 'Sigoti', 27),
(107, 'Kiambu Town', 28),
(108, 'Ting''ang''a', 28),
(109, 'Ndumberi', 28),
(110, 'Riabai', 28),
(111, 'Township', 29),
(112, 'Kamenu', 29),
(113, 'Hospital', 29),
(114, 'Gatuanyaga', 29),
(115, 'Ruiru', 30),
(116, 'Kahawa Sukari', 30),
(117, 'Kahawa Wendani', 30),
(118, 'Kiuu', 30),
(119, 'Kikuyu', 31),
(120, 'Kinoo', 31),
(121, 'Karai', 31),
(122, 'Nachu', 31),
(123, 'Limuru', 32),
(124, 'Ndeiya', 32),
(125, 'Tigoni', 32),
(126, 'Bibirioni', 32),
(127, 'Biashara', 33),
(128, 'Kivumbini', 33),
(129, 'Mwariki', 33),
(130, 'Menengai', 33),
(131, 'Molo', 34),
(132, 'Turbo', 34),
(133, 'Kaptembwo', 34),
(134, 'London', 34),
(135, 'Naivasha Town', 35),
(136, 'Hells Gate', 35),
(137, 'Olkaria', 35),
(138, 'Mai Mahiu', 35),
(139, 'Gilgil', 36),
(140, 'Eburru', 36),
(141, 'Mbaruk', 36),
(142, 'Karatina', 36),
(143, 'Kapyemit', 37),
(144, 'Moiben', 37),
(145, 'Karuna', 37),
(146, 'Nyaru', 37),
(147, 'Kapsaos', 38),
(148, 'Tapsagoi', 38),
(149, 'Sergoit', 38),
(150, 'Kipkenyo', 38),
(151, 'Ainabkoi', 39),
(152, 'Kapsoya', 39),
(153, 'Cheptiret', 39),
(154, 'Kipkabus', 39),
(155, 'Machakos Central', 40),
(156, 'Mumbuni', 40),
(157, 'Mutituni', 40),
(158, 'Kalama', 40),
(159, 'Athi River', 41),
(160, 'Syokimau', 41),
(161, 'Mlolongo', 41),
(162, 'Kinanie', 41),
(163, 'Kangundo', 42),
(164, 'Komarock', 42),
(165, 'Kivaa', 42),
(166, 'Matuu', 42),
(167, 'Meru Town', 43),
(168, 'Nkubu', 43),
(169, 'Kanyakine', 43),
(170, 'Kibirichia', 43),
(171, 'Tigania East', 44),
(172, 'Tigania West', 44),
(173, 'Athwana', 44),
(174, 'Kianjai', 44),
(175, 'Ntima East', 45),
(176, 'Ntima West', 45),
(177, 'Buuri', 45),
(178, 'Kiirua', 45),
(179, 'Kakamega Town', 46),
(180, 'Shinyalu', 46),
(181, 'Isukha', 46),
(182, 'Shirere', 46),
(183, 'Butere', 47),
(184, 'Mumias', 47),
(185, 'Matungu', 47),
(186, 'Kwang''amor', 47),
(187, 'Lugari', 48),
(188, 'Likuyani', 48),
(189, 'Nzoia', 48),
(190, 'Mautuma', 48),
(191, 'Kilifi Town', 49),
(192, 'Mnarani', 49),
(193, 'Tezo', 49),
(194, 'Bomani', 49),
(195, 'Mtwapa', 50),
(196, 'Shanzu', 50),
(197, 'Vipingo', 50),
(198, 'Matsangoni', 50),
(199, 'Malindi Town', 51),
(200, 'Gede', 51),
(201, 'Watamu', 51),
(202, 'Sabaki', 51),
(203, 'Kisii Town', 52),
(204, 'Suneka', 52),
(205, 'Keumbu', 52),
(206, 'Matongo', 52),
(207, 'Nyamache', 53),
(208, 'Kerina', 53),
(209, 'Bassi', 53),
(210, 'Gesima', 53),
(211, 'Nyaribari Masaba', 54),
(212, 'Nyaribari Chache', 54),
(213, 'Ibeno', 54),
(214, 'Monyerero', 54),
(215, 'Kitui Town', 55),
(216, 'Kyangwithya', 55),
(217, 'Mulango', 55),
(218, 'Zombe', 55),
(219, 'Mwingi Town', 56),
(220, 'Kyuso', 56),
(221, 'Mumoni', 56),
(222, 'Tseikuru', 56),
(223, 'Mutomo', 57),
(224, 'Ikutha', 57),
(225, 'Kanziko', 57),
(226, 'Mutha', 57),
(227, 'Kwale Town', 58),
(228, 'Msambweni', 58),
(229, 'Lunga Lunga', 58),
(230, 'Vanga', 58),
(231, 'Kinango', 59),
(232, 'Mackinnon', 59),
(233, 'Chengoni', 59),
(234, 'Puma', 59),
(235, 'Matuga', 60),
(236, 'Waa', 60),
(237, 'Tiwi', 60),
(238, 'Diani', 60),
(239, 'Nanyuki', 61),
(240, 'Umande', 61),
(241, 'Ngobit', 61),
(242, 'Tigithi', 61),
(243, 'Rumuruti', 62),
(244, 'Mukogondo', 62),
(245, 'Segera', 62),
(246, 'Ol Moran', 62),
(247, 'Naibor', 63),
(248, 'Ol Jabet', 63),
(249, 'Sossian', 63),
(250, 'Marmanet', 63),
(251, 'Makueni Town', 64),
(252, 'Wote', 64),
(253, 'Kathonzweni', 64),
(254, 'Mbitini', 64),
(255, 'Kibwezi', 65),
(256, 'Mtito Andei', 65),
(257, 'Masongaleni', 65),
(258, 'Emali', 65),
(259, 'Mbooni', 66),
(260, 'Tulimani', 66),
(261, 'Kalawa', 66),
(262, 'Kitise', 66),
(263, 'Kapsabet', 67),
(264, 'Chepkumia', 67),
(265, 'Kilibwoni', 67),
(266, 'Chepterwai', 67),
(267, 'Nandi Hills', 68),
(268, 'Chepkunyuk', 68),
(269, 'Kochogocho', 68),
(270, 'Kapkangani', 68),
(271, 'Kabiyet', 69),
(272, 'Kosirai', 69),
(273, 'Mosoriot', 69),
(274, 'Tinderet', 69),
(275, 'Narok Town', 70),
(276, 'Ololulunga', 70),
(277, 'Sogoo', 70),
(278, 'Mau Narok', 70),
(279, 'Ewuaso Kedong', 71),
(280, 'Mara', 71),
(281, 'Olpusimoru', 71),
(282, 'Nkareta', 71),
(283, 'Kilgoris', 72),
(284, 'Emurua Dikirr', 72),
(285, 'Lolgorian', 72),
(286, 'Moyoi', 72),
(287, 'Ol Kalou', 73),
(288, 'Ol Jororok', 73),
(289, 'Ndaragwa', 73),
(290, 'Shamata', 73),
(291, 'Njabini', 74),
(292, 'Geta', 74),
(293, 'Engineer', 74),
(294, 'Kinja', 74),
(295, 'Mirangine', 75),
(296, 'Kipipiri', 75),
(297, 'Gathara', 75),
(298, 'Wanjohi', 75),
(299, 'Nyeri Town', 76),
(300, 'Gatitu', 76),
(301, 'Rware', 76),
(302, 'Karima', 76),
(303, 'Mathira', 77),
(304, 'Karatina', 77),
(305, 'Konyu', 77),
(306, 'Ruguru', 77),
(307, 'Mukurweini', 78),
(308, 'Gikondi', 78),
(309, 'Rutune', 78),
(310, 'Karia', 78),
(311, 'Siaya Town', 79),
(312, 'Ugunja', 79),
(313, 'Ukolini', 79),
(314, 'Yala', 79),
(315, 'Yala', 80),
(316, 'Wagai', 80),
(317, 'Ngiya', 80),
(318, 'Nyadorera', 80),
(319, 'Bondo', 81),
(320, 'Usigu', 81),
(321, 'Rarieda', 81),
(322, 'Got Agulu', 81),
(323, 'Wundanyi', 82),
(324, 'Werugha', 82),
(325, 'Mwatate', 82),
(326, 'Mbale', 82),
(327, 'Taveta', 83),
(328, 'Njukini', 83),
(329, 'Chala', 83),
(330, 'Mata', 83),
(331, 'Voi Town', 84),
(332, 'Mbololo', 84),
(333, 'Sagala', 84),
(334, 'Kaloleni', 84),
(335, 'Kitale Town', 85),
(336, 'Saboti', 85),
(337, 'Kiminini', 85),
(338, 'Kaplamai', 85),
(339, 'Kwanza', 86),
(340, 'Endebess', 86),
(341, 'Suam', 86),
(342, 'Matumbei', 86),
(343, 'Lodwar', 87),
(344, 'Kerio', 87),
(345, 'Kanamkemer', 87),
(346, 'Kangatotha', 87),
(347, 'Lokitaung', 88),
(348, 'Kibish', 88),
(349, 'Kalokol', 88),
(350, 'Lokichar', 88),
(351, 'Lokori', 89),
(352, 'Kapedo', 89),
(353, 'Katilia', 89),
(354, 'Lomelo', 89),
(355, 'Busia Town', 90),
(356, 'Nambale', 90),
(357, 'Bumala', 90),
(358, 'Matayos', 90),
(359, 'Samia', 91),
(360, 'Nangina', 91),
(361, 'Ageng''a', 91),
(362, 'Lwakhakha', 91),
(363, 'Malaba', 92),
(364, 'Amukura', 92),
(365, 'Osieko', 92),
(366, 'Chakol', 92),
(367, 'Bungoma Town', 93),
(368, 'Chwele', 93),
(369, 'Kimilili', 93),
(370, 'Webuye', 93),
(371, 'Kapsokwony', 94),
(372, 'Cheptais', 94),
(373, 'Kaboom', 94),
(374, 'Kaptama', 94),
(375, 'Mbakalo', 95),
(376, 'Naitiri', 95),
(377, 'Lugulu', 95),
(378, 'Sikulu', 95),
(379, 'Embu Town', 96),
(380, 'Kithimu', 96),
(381, 'Nembure', 96),
(382, 'Runyenjes', 96),
(383, 'Mbeere South', 97),
(384, 'Mbeere North', 97),
(385, 'Gachoka', 97),
(386, 'Evurore', 97),
(387, 'Manyatta', 98),
(388, 'Kagaari', 98),
(389, 'Ngooru', 98),
(390, 'Kathangariri', 98),
(391, 'Garissa Town', 99),
(392, 'Iftin', 99),
(393, 'Saka', 99),
(394, 'Shimbir', 99),
(395, 'Modogashe', 100),
(396, 'Benane', 100),
(397, 'Maalimin', 100),
(398, 'Hara', 100),
(399, 'Bura', 101),
(400, 'Nanighi', 101),
(401, 'Dadaab', 101),
(402, 'Liboi', 101),
(403, 'Homa Bay Town', 102),
(404, 'Asego', 102),
(405, 'Rangwe', 102),
(406, 'Kanyaluo', 102),
(407, 'Mbita', 103),
(408, 'Mfangano', 103),
(409, 'Rusinga', 103),
(410, 'Gembe', 103),
(411, 'Suba', 104),
(412, 'Sindo', 104),
(413, 'Ungoye', 104),
(414, 'Kasewe', 104),
(415, 'Isiolo Town', 105),
(416, 'Garba Tula', 105),
(417, 'Kinna', 105),
(418, 'Sericho', 105),
(419, 'Merti', 106),
(420, 'Chari', 106),
(421, 'Cherab', 106),
(422, 'Oldonyiro', 106),
(423, 'Kajiado Town', 107),
(424, 'Ngong', 107),
(425, 'Ongata Rongai', 107),
(426, 'Isinya', 107),
(427, 'Kitengela', 108),
(428, 'Nairobi West', 108),
(429, 'Mlolongo', 108),
(430, 'Syokimau', 108),
(431, 'Loodariak', 109),
(432, 'Kaputiei', 109),
(433, 'Keekonyokie', 109),
(434, 'Matapato', 109),
(435, 'Kericho Town', 110),
(436, 'Kipkelion', 110),
(437, 'Londiani', 110),
(438, 'Sigowet', 110),
(439, 'Bureti', 111),
(440, 'Kapkatet', 111),
(441, 'Roret', 111),
(442, 'Chemagel', 111),
(443, 'Soin', 112),
(444, 'Kapsorok', 112),
(445, 'Kipchorian', 112),
(446, 'Mugure', 112),
(447, 'Kerugoya', 113),
(448, 'Kutus', 113),
(449, 'Mutithi', 113),
(450, 'Kanyekiini', 113),
(451, 'Mwea', 114),
(452, 'Tebere', 114),
(453, 'Nyakio', 114),
(454, 'Wamumu', 114),
(455, 'Gichugu', 115),
(456, 'Ngariama', 115),
(457, 'Kiini', 115),
(458, 'Karumandi', 115),
(459, 'Lamu Town', 116),
(460, 'Sheli', 116),
(461, 'Mkomani', 116),
(462, 'Hindi', 116),
(463, 'Mpeketoni', 117),
(464, 'Witu', 117),
(465, 'Hongwe', 117),
(466, 'Basuba', 117),
(467, 'Mandera Town', 118),
(468, 'Rhamu', 118),
(469, 'Takaba', 118),
(470, 'El Wak', 118),
(471, 'Rhamu Dimtu', 119),
(472, 'Olla', 119),
(473, 'Ashabito', 119),
(474, 'Guticha', 119),
(475, 'El Wak', 120),
(476, 'Shimbir', 120),
(477, 'Lafey', 120),
(478, 'Kutulo', 120),
(479, 'Marsabit Town', 121),
(480, 'Laisamis', 121),
(481, 'Maikona', 121),
(482, 'North Horr', 121),
(483, 'Moyale', 122),
(484, 'Turbi', 122),
(485, 'Heillu', 122),
(486, 'Butiye', 122),
(487, 'Saku', 123),
(488, 'Kargi', 123),
(489, 'Korr', 123),
(490, 'Loglogo', 123),
(491, 'Migori Town', 124),
(492, 'Rongo', 124),
(493, 'Awendo', 124),
(494, 'Karungu', 124),
(495, 'Nyatike', 125),
(496, 'Kadem', 125),
(497, 'Kanyasa', 125),
(498, 'Macalder', 125),
(499, 'Uriri', 126),
(500, 'West Kanyamkago', 126),
(501, 'East Kanyamkago', 126),
(502, 'Kakrao', 126),
(503, 'Murang''a Town', 127),
(504, 'Kangema', 127),
(505, 'Kahuro', 127),
(506, 'Kiharu', 127),
(507, 'Kandara', 128),
(508, 'Gaichanjiru', 128),
(509, 'Ithiru', 128),
(510, 'Kaguuni', 128),
(511, 'Gatanga', 129),
(512, 'Kariara', 129),
(513, 'Kakuzi', 129),
(514, 'Mutumbiri', 129),
(515, 'Maralal', 130),
(516, 'Lodokejek', 130),
(517, 'Suguta', 130),
(518, 'Baragoi', 130),
(519, 'Baragoi', 131),
(520, 'Lokitaung', 131),
(521, 'Nachola', 131),
(522, 'Ndoto', 131),
(523, 'Tharaka', 132),
(524, 'Gatunga', 132),
(525, 'Marimanti', 132),
(526, 'Chiakariga', 132),
(527, 'Chuka', 133),
(528, 'Igamba Ng''ombe', 133),
(529, 'Mwimbi', 133),
(530, 'Magumoni', 133),
(531, 'Vihiga Town', 134),
(532, 'Luanda', 134),
(533, 'Emuhaya', 134),
(534, 'Sabatia', 134),
(535, 'Hamisi', 135),
(536, 'Shiru', 135),
(537, 'Muhudu', 135),
(538, 'Tambua', 135),
(539, 'Tiriki', 136),
(540, 'Gisambai', 136),
(541, 'Chavakali', 136),
(542, 'Mungoma', 136),
(543, 'Wajir Town', 137),
(544, 'Bunley', 137),
(545, 'Bute', 137),
(546, 'Habaswein', 137),
(547, 'Korondille', 138),
(548, 'Gurar', 138),
(549, 'Buna', 138),
(550, 'Ajawa', 138),
(551, 'Griftu', 139),
(552, 'Diff', 139),
(553, 'Tarbaj', 139),
(554, 'Elben', 139),
(555, 'Kasei', 140),
(556, 'Kiwawa', 140),
(557, 'Alale', 140),
(558, 'Sekerr', 140),
(559, 'Chepareria', 141),
(560, 'Lomut', 141),
(561, 'Masol', 141),
(562, 'Tapach', 141),
(563, 'Kapenguria', 142),
(564, 'Mnagei', 142),
(565, 'Sook', 142),
(566, 'Lelan', 142),
(567, 'Kabartonjo', 143),
(568, 'Saimo', 143),
(569, 'Tenges', 143),
(570, 'Kolowa', 143),
(571, 'Mogotio', 144),
(572, 'Emining', 144),
(573, 'Mochongoi', 144),
(574, 'Lembus', 144),
(575, 'Eldama Ravine', 145),
(576, 'Esageri', 145),
(577, 'Ravine', 145),
(578, 'Mumberes', 145),
(579, 'Bomet Town', 146),
(580, 'Chepalungu', 146),
(581, 'Sigor', 146),
(582, 'Konoin', 146),
(583, 'Longisa', 147),
(584, 'Merigi', 147),
(585, 'Ndanai', 147),
(586, 'Chemaner', 147),
(587, 'Sotik', 148),
(588, 'Ndanai', 148),
(589, 'Kipreres', 148),
(590, 'Kabianga', 148),
(591, 'Nyamira Town', 149),
(592, 'Borabu', 149),
(593, 'Nyamaiya', 149),
(594, 'Manga', 149),
(595, 'Nyamongo', 150),
(596, 'Rigena', 150),
(597, 'Kegogi', 150),
(598, 'Magombo', 150),
(599, 'Ekerenyo', 151),
(600, 'Mekenene', 151),
(601, 'Itibo', 151),
(602, 'Bokeira', 151),
(603, 'Iten', 152),
(604, 'Tambach', 152),
(605, 'Kessup', 152),
(606, 'Kapcherop', 152),
(607, 'Kapsowar', 153),
(608, 'Chebiemit', 153),
(609, 'Murkut', 153),
(610, 'Sisiya', 153),
(611, 'Chesoi', 154),
(612, 'Kipteber', 154),
(613, 'Moi''s Bridge', 154),
(614, 'Kapyego', 154),
(615, 'Madogo', 155),
(616, 'Hola', 155),
(617, 'Garsen', 155),
(618, 'Kipini', 155),
(619, 'Ngao', 156),
(620, 'Kipini East', 156),
(621, 'Kipini West', 156),
(622, 'Sala', 156)
ON CONFLICT (name, sub_county_id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('counties','id'), (SELECT COALESCE(MAX(id),1) FROM counties));
SELECT setval(pg_get_serial_sequence('sub_counties','id'), (SELECT COALESCE(MAX(id),1) FROM sub_counties));
SELECT setval(pg_get_serial_sequence('wards','id'), (SELECT COALESCE(MAX(id),1) FROM wards));
