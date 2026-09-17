-- ============================================================
-- CerviTrack - Seed Data
-- 2 simple test accounts for EVERY account type (9 roles x 2 = 18)
-- Password for ALL accounts: password123
--
-- Each insert also creates a matching auth.users row so accounts
-- can be used to log in via the mobile app (supabase.auth.signInWithPassword).
-- Run AFTER init.sql.
-- ============================================================

-- Clean up any previous seed of these accounts (idempotent re-run)
DELETE FROM auth.users WHERE email IN ('patient1@cervitrack.app','patient2@cervitrack.app','labtech1@cervitrack.app','labtech2@cervitrack.app','clinician1@cervitrack.app','clinician2@cervitrack.app','facility_admin1@cervitrack.app','facility_admin2@cervitrack.app','county_admin1@cervitrack.app','county_admin2@cervitrack.app','national_admin1@cervitrack.app','national_admin2@cervitrack.app','system_admin1@cervitrack.app','system_admin2@cervitrack.app','provider1@cervitrack.app','provider2@cervitrack.app','admin1@cervitrack.app','admin2@cervitrack.app');
DELETE FROM public.users WHERE email IN ('patient1@cervitrack.app','patient2@cervitrack.app','labtech1@cervitrack.app','labtech2@cervitrack.app','clinician1@cervitrack.app','clinician2@cervitrack.app','facility_admin1@cervitrack.app','facility_admin2@cervitrack.app','county_admin1@cervitrack.app','county_admin2@cervitrack.app','national_admin1@cervitrack.app','national_admin2@cervitrack.app','system_admin1@cervitrack.app','system_admin2@cervitrack.app','provider1@cervitrack.app','provider2@cervitrack.app','admin1@cervitrack.app','admin2@cervitrack.app');

-- ------------------------------------------------------------
-- 1. AUTH USERS (so signInWithPassword works)
-- ------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_current, email_change_token_new, email_change,
  phone_change_token, phone_change, reauthentication_token
) VALUES
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111001', 'authenticated', 'authenticated', 'patient1@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111002', 'authenticated', 'authenticated', 'patient2@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222001', 'authenticated', 'authenticated', 'labtech1@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222002', 'authenticated', 'authenticated', 'labtech2@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333001', 'authenticated', 'authenticated', 'clinician1@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333002', 'authenticated', 'authenticated', 'clinician2@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444001', 'authenticated', 'authenticated', 'facility_admin1@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444002', 'authenticated', 'authenticated', 'facility_admin2@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555001', 'authenticated', 'authenticated', 'county_admin1@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555002', 'authenticated', 'authenticated', 'county_admin2@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666001', 'authenticated', 'authenticated', 'national_admin1@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666002', 'authenticated', 'authenticated', 'national_admin2@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888001', 'authenticated', 'authenticated', 'provider1@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888002', 'authenticated', 'authenticated', 'provider2@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777001', 'authenticated', 'authenticated', 'admin1@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777002', 'authenticated', 'authenticated', 'admin2@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999001', 'authenticated', 'authenticated', 'system_admin1@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999002', 'authenticated', 'authenticated', 'system_admin2@cervitrack.app', crypt('password123', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. PUBLIC USERS (app profiles)
-- ------------------------------------------------------------
INSERT INTO public.users (
  id, name, email, phone, role, county, sub_county, ward,
  patient_id, consent_terms, consent_medical, consent_at,
  total_screenings, total_vaccines, risk_index, created_at
) VALUES
  ('11111111-1111-1111-1111-111111111001', 'Test Patient One',   'patient1@cervitrack.app',   '+254700001101', 'patient',        'Nairobi', 'Westlands', 'Parklands',       'PT-TEST-001', true, true, now(), 0, 0, 'low', now()),
  ('11111111-1111-1111-1111-111111111002', 'Test Patient Two',   'patient2@cervitrack.app',   '+254700001102', 'patient',        'Kisumu', 'Kisumu Central', 'Kondele', 'PT-TEST-002', true, true, now(), 0, 0, 'low', now()),
  ('22222222-2222-2222-2222-222222222001', 'Test Lab Tech One',  'labtech1@cervitrack.app',   '+254700002201', 'lab_technician', 'Nairobi', 'Westlands', 'Parklands',       NULL, true, true, now(), 0, 0, 'low', now()),
  ('22222222-2222-2222-2222-222222222002', 'Test Lab Tech Two',  'labtech2@cervitrack.app',   '+254700002202', 'lab_technician', 'Uasin Gishu', 'Ainabkoi', 'Ainabkoi', NULL, true, true, now(), 0, 0, 'low', now()),
  ('33333333-3333-3333-3333-333333333001', 'Test Clinician One', 'clinician1@cervitrack.app', '+254700003301', 'clinician',      'Nairobi', 'Westlands', 'Parklands',       NULL, true, true, now(), 0, 0, 'low', now()),
  ('33333333-3333-3333-3333-333333333002', 'Test Clinician Two', 'clinician2@cervitrack.app', '+254700003302', 'clinician',      'Mombasa', 'Mombasa Island', 'Kizingo',     NULL, true, true, now(), 0, 0, 'low', now()),
  ('44444444-4444-4444-4444-444444444001', 'Test Facility Admin One', 'facility_admin1@cervitrack.app', '+254700004401', 'facility_admin', 'Nairobi', 'Westlands', 'Parklands', NULL, true, true, now(), 0, 0, 'low', now()),
  ('44444444-4444-4444-4444-444444444002', 'Test Facility Admin Two', 'facility_admin2@cervitrack.app', '+254700004402', 'facility_admin', 'Nakuru', 'Nakuru Town East', 'Biashara', NULL, true, true, now(), 0, 0, 'low', now()),
  ('55555555-5555-5555-5555-555555555001', 'Test County Admin One', 'county_admin1@cervitrack.app', '+254700005501', 'county_admin',  'Nairobi', 'Westlands', 'Parklands', NULL, true, true, now(), 0, 0, 'low', now()),
  ('55555555-5555-5555-5555-555555555002', 'Test County Admin Two', 'county_admin2@cervitrack.app', '+254700005502', 'county_admin',  'Kisumu', 'Kisumu Central', 'Kondele', NULL, true, true, now(), 0, 0, 'low', now()),
  ('66666666-6666-6666-6666-666666666001', 'Test National Admin One', 'national_admin1@cervitrack.app', '+254700006601', 'national_admin', 'Nairobi', 'Westlands', 'Parklands', NULL, true, true, now(), 0, 0, 'low', now()),
  ('66666666-6666-6666-6666-666666666002', 'Test National Admin Two', 'national_admin2@cervitrack.app', '+254700006602', 'national_admin', 'Mombasa', 'Mombasa Island', 'Kizingo', NULL, true, true, now(), 0, 0, 'low', now()),
  ('88888888-8888-8888-8888-888888888001', 'Test Provider One',  'provider1@cervitrack.app',  '+254700008801', 'provider',       'Nairobi', 'Westlands', 'Parklands', NULL, true, true, now(), 0, 0, 'low', now()),
  ('88888888-8888-8888-8888-888888888002', 'Test Provider Two',  'provider2@cervitrack.app',  '+254700008802', 'provider',       'Kisumu', 'Kisumu Central', 'Kondele', NULL, true, true, now(), 0, 0, 'low', now()),
  ('77777777-7777-7777-7777-777777777001', 'Test Admin One',     'admin1@cervitrack.app',     '+254700007701', 'admin',          'Nairobi', 'Westlands', 'Parklands', NULL, true, true, now(), 0, 0, 'low', now()),
  ('77777777-7777-7777-7777-777777777002', 'Test Admin Two',     'admin2@cervitrack.app',     '+254700007702', 'admin',          'Mombasa', 'Mombasa Island', 'Kizingo', NULL, true, true, now(), 0, 0, 'low', now()),
  ('99999999-9999-9999-9999-999999999001', 'Test System Admin One', 'system_admin1@cervitrack.app', '+254700009901', 'system_admin',  'Nairobi', 'Westlands', 'Parklands', NULL, true, true, now(), 0, 0, 'low', now()),
  ('99999999-9999-9999-9999-999999999002', 'Test System Admin Two', 'system_admin2@cervitrack.app', '+254700009902', 'system_admin',  'Nairobi', 'Westlands', 'Parklands', NULL, true, true, now(), 0, 0, 'low', now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE - 18 accounts (2 per role) seeded. Password: password123
-- ============================================================