-- ============================================================
-- CERVITRACK SUPABASE SCHEMA + RLS
-- Run this in Supabase Studio (SQL Editor)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ── Custom types ─────────────────────────────────────────────
create type user_role as enum ('patient', 'chw', 'nurse', 'lab', 'admin', 'provider');
create type risk_tier as enum ('LOW', 'MODERATE', 'HIGH');
create type vaccine_status as enum ('upcoming', 'done');
create type appointment_status as enum ('pending', 'upcoming', 'completed', 'cancelled');
create type notification_type as enum ('general', 'screening', 'provider', 'admin');
create type message_type as enum ('text', 'image', 'audio');
create type sender_type as enum ('user', 'staff', 'provider');

-- ── USERS ────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  phone text,
  password text not null,
  role user_role default 'patient',
  photo text,
  birth_date text,
  last_healed_date text,
  county text,
  sub_county text,
  ward text,
  patient_id text unique,
  consent_terms boolean default false,
  consent_medical boolean default false,
  consent_at text,
  total_screenings integer default 0,
  total_vaccines integer default 0,
  last_screening_date text,
  last_vaccine_date text,
  risk_index risk_tier default 'LOW',
  created_at timestamptz default now()
);

-- ── SCREENINGS ───────────────────────────────────────────────
create table if not exists public.screenings (
  id bigserial primary key,
  profile_id uuid not null references public.users(id) on delete cascade,
  verdict text not null,
  risk_tier risk_tier not null,
  age integer,
  parity integer,
  vaccination text,
  previous_screening text,
  hiv_status text,
  smoking text,
  symptoms text,
  family_history text,
  score integer,
  created_at timestamptz default now()
);

-- ── VACCINES ─────────────────────────────────────────────────
create table if not exists public.vaccines (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  hospital text,
  date text,
  status vaccine_status default 'upcoming',
  reminder_day boolean default false,
  reminder_before boolean default false,
  created_at timestamptz default now()
);

-- ── APPOINTMENTS ─────────────────────────────────────────────
create table if not exists public.appointments (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  facility text,
  facility_name text,
  facility_location text,
  date text,
  notes text,
  status appointment_status default 'pending',
  created_at timestamptz default now()
);

-- ── NOTIFICATIONS ────────────────────────────────────────────
create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  message text,
  type notification_type default 'general',
  read boolean default false,
  created_at timestamptz default now()
);

-- ── LAB RESULTS ──────────────────────────────────────────────
create table if not exists public.lab_results (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  patient_name text,
  result text,
  notes text,
  created_at timestamptz default now()
);

-- ── TEST RESULTS ─────────────────────────────────────────────
create table if not exists public.test_results (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  result text not null,
  date text not null,
  image_path text,
  created_at timestamptz default now()
);

-- ── FOLLOWUPS ────────────────────────────────────────────────
create table if not exists public.followups (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  screening_id bigint,
  completed boolean default false,
  completed_at text,
  notes text,
  created_at timestamptz default now()
);

-- ── REPORTS ──────────────────────────────────────────────────
create table if not exists public.reports (
  id bigserial primary key,
  admin_id uuid references public.users(id),
  user_id uuid references public.users(id) on delete cascade,
  type text default 'general',
  content text,
  created_at timestamptz default now()
);

-- ── FEEDBACK ─────────────────────────────────────────────────
create table if not exists public.feedback (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete cascade,
  category text not null,
  message text not null,
  contact text,
  created_at timestamptz default now()
);

-- ── SCHEDULED ACTIONS ────────────────────────────────────────
create table if not exists public.scheduled_actions (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text,
  scheduled_date text not null,
  notes text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- ── CONSENT LOG ──────────────────────────────────────────────
create table if not exists public.consent_log (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  consent_type text not null,
  accepted boolean default true,
  accepted_at timestamptz default now()
);

-- ── PROVIDERS (doctors, nurses, etc.) ────────────────────────
create table if not exists public.providers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  phone text,
  password text not null,
  role text default 'doctor',
  specialty text,
  hospital text,
  license_number text,
  created_at timestamptz default now()
);

-- ── FACILITIES ───────────────────────────────────────────────
create table if not exists public.facilities (
  id bigserial primary key,
  name text not null,
  location text,
  distance real,
  phone text,
  hours text,
  services text,
  last_updated timestamptz default now()
);

-- ── ARTICLES ─────────────────────────────────────────────────
create table if not exists public.articles (
  id bigserial primary key,
  title text not null,
  summary text,
  content text,
  image text,
  category text,
  read_time text,
  last_updated timestamptz default now()
);

-- ── CHAT CONTACTS ────────────────────────────────────────────
create table if not exists public.chat_contacts (
  id bigserial primary key,
  name text not null,
  role text,
  online boolean default false,
  last_updated timestamptz default now()
);

-- ── CONVERSATIONS ────────────────────────────────────────────
create table if not exists public.conversations (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  contact_id integer not null references public.chat_contacts(id) on delete cascade,
  contact_name text not null,
  contact_role text,
  last_message text,
  last_time timestamptz,
  unread integer default 0,
  online boolean default false,
  created_at timestamptz default now()
);

-- ── MESSAGES ─────────────────────────────────────────────────
create table if not exists public.messages (
  id bigserial primary key,
  conversation_id integer not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.users(id),
  sender_type sender_type default 'user',
  message_type message_type default 'text',
  content text,
  file_url text,
  duration text,
  status text default 'sent',
  created_at timestamptz default now(),
  synced boolean default true
);

-- ── SYNC LOG ─────────────────────────────────────────────────
create table if not exists public.sync_log (
  id bigserial primary key,
  table_name text not null unique,
  last_synced_at timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_screenings_profile on public.screenings(profile_id);
create index if not exists idx_vaccines_user on public.vaccines(user_id);
create index if not exists idx_appointments_user on public.appointments(user_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_lab_results_user on public.lab_results(user_id);
create index if not exists idx_followups_user on public.followups(user_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_conversations_user on public.conversations(user_id);
create index if not exists idx_reports_user on public.reports(user_id);
create index if not exists idx_feedback_user on public.feedback(user_id);
create index if not exists idx_scheduled_user on public.scheduled_actions(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.users enable row level security;
alter table public.screenings enable row level security;
alter table public.vaccines enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
alter table public.lab_results enable row level security;
alter table public.test_results enable row level security;
alter table public.followups enable row level security;
alter table public.reports enable row level security;
alter table public.feedback enable row level security;
alter table public.scheduled_actions enable row level security;
alter table public.consent_log enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.facilities enable row level security;
alter table public.articles enable row level security;
alter table public.chat_contacts enable row level security;
alter table public.providers enable row level security;

-- ── Users ────────────────────────────────────────────────────
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Public can insert own registration"
  on public.users for insert
  with check (true);

-- ── Screenings ───────────────────────────────────────────────
create policy "Patients view own screenings"
  on public.screenings for select
  using (
    exists (
      select 1 from public.users u
      where u.id = screenings.profile_id
        and u.id = auth.uid()
    )
  );

create policy "Patients insert own screenings"
  on public.screenings for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = screenings.profile_id
        and u.id = auth.uid()
    )
  );

-- ── Vaccines ─────────────────────────────────────────────────
create policy "Patients manage own vaccines"
  on public.vaccines for all
  using (
    exists (
      select 1 from public.users u
      where u.id = vaccines.user_id
        and u.id = auth.uid()
    )
  );

-- ── Appointments ─────────────────────────────────────────────
create policy "Patients manage own appointments"
  on public.appointments for all
  using (
    exists (
      select 1 from public.users u
      where u.id = appointments.user_id
        and u.id = auth.uid()
    )
  );

-- ── Notifications ────────────────────────────────────────────
create policy "Patients view own notifications"
  on public.notifications for select
  using (
    exists (
      select 1 from public.users u
      where u.id = notifications.user_id
        and u.id = auth.uid()
    )
  );

-- ── Lab Results ──────────────────────────────────────────────
create policy "Patients view own lab results"
  on public.lab_results for all
  using (
    exists (
      select 1 from public.users u
      where u.id = lab_results.user_id
        and u.id = auth.uid()
    )
  );

-- ── Test Results ─────────────────────────────────────────────
create policy "Patients manage own test results"
  on public.test_results for all
  using (
    exists (
      select 1 from public.users u
      where u.id = test_results.user_id
        and u.id = auth.uid()
    )
  );

-- ── Followups ────────────────────────────────────────────────
create policy "Patients manage own followups"
  on public.followups for all
  using (
    exists (
      select 1 from public.users u
      where u.id = followups.user_id
        and u.id = auth.uid()
    )
  );

-- ── Feedback ─────────────────────────────────────────────────
create policy "Patients submit own feedback"
  on public.feedback for insert
  with check (
    auth.uid() is not null
    and feedback.user_id = auth.uid()
  );

-- ── Scheduled Actions ────────────────────────────────────────
create policy "Patients manage own scheduled actions"
  on public.scheduled_actions for all
  using (
    exists (
      select 1 from public.users u
      where u.id = scheduled_actions.user_id
        and u.id = auth.uid()
    )
  );

-- ── Consent Log ──────────────────────────────────────────────
create policy "Patients view own consent log"
  on public.consent_log for select
  using (
    exists (
      select 1 from public.users u
      where u.id = consent_log.user_id
        and u.id = auth.uid()
    )
  );

-- ── Conversations ────────────────────────────────────────────
create policy "Patients manage own conversations"
  on public.conversations for all
  using (auth.uid() = user_id);

-- ── Messages ─────────────────────────────────────────────────
create policy "Patients view messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Patients insert messages in own conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- ── Public read: facilities, articles, chat_contacts ──────────
create policy "Anyone can view facilities"
  on public.facilities for select using (true);

create policy "Anyone can view articles"
  on public.articles for select using (true);

create policy "Anyone can view chat contacts"
  on public.chat_contacts for select using (true);

-- ── Providers: server-side admin access (providers use custom auth, not Supabase Auth) ──
create policy "Service role can manage providers"
  on public.providers for all
  using (true)
  with check (true);

-- ── Reports: provider/admin can create/read for their patients
create policy "Providers create reports"
  on public.reports for insert
  with check (auth.uid() is not null);

create policy "Providers view own reports"
  on public.reports for select
  using (
    auth.uid() in (
      select id from public.users where role in ('admin', 'provider', 'nurse', 'chw', 'lab')
    )
  );

-- ── Enable Realtime for select tables ────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.conversations;
