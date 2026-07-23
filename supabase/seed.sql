-- ============================================================
-- CerviTrack — Seed Data
-- Run AFTER init.sql in Supabase SQL Editor
-- 20 test users across all roles
-- All passwords: password123
-- ============================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. AUTH USERS (APK login via supabase.auth.signInWithPassword)
-- Patients, Nurses, Lab Techs, Admins
-- ============================================================

DO $$
DECLARE
  ph text := crypt('password123', gen_salt('bf', 10));
BEGIN
  INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
  VALUES
    -- PATIENTS (10)
    ('11111111-1111-1111-1111-111111111101'::uuid, 'authenticated', 'authenticated', 'patient1@cervitrack.app', ph, now(), '{"name":"Grace Wanjiku","phone":"+254712000001","role":"patient"}'::jsonb, '2026-01-15'::timestamptz, now()),
    ('11111111-1111-1111-1111-111111111102'::uuid, 'authenticated', 'authenticated', 'patient2@cervitrack.app', ph, now(), '{"name":"Faith Achieng","phone":"+254722000002","role":"patient"}'::jsonb, '2026-02-01'::timestamptz, now()),
    ('11111111-1111-1111-1111-111111111103'::uuid, 'authenticated', 'authenticated', 'patient3@cervitrack.app', ph, now(), '{"name":"Mary Njeri","phone":"+254733000003","role":"patient"}'::jsonb, '2026-01-20'::timestamptz, now()),
    ('11111111-1111-1111-1111-111111111104'::uuid, 'authenticated', 'authenticated', 'patient4@cervitrack.app', ph, now(), '{"name":"Esther Muthoni","phone":"+254744000004","role":"patient"}'::jsonb, '2026-03-01'::timestamptz, now()),
    ('11111111-1111-1111-1111-111111111105'::uuid, 'authenticated', 'authenticated', 'patient5@cervitrack.app', ph, now(), '{"name":"Rose Adhiambo","phone":"+254755000005","role":"patient"}'::jsonb, '2026-02-15'::timestamptz, now()),
    ('11111111-1111-1111-1111-111111111106'::uuid, 'authenticated', 'authenticated', 'patient6@cervitrack.app', ph, now(), '{"name":"Jane Wairimu","phone":"+254766000006","role":"patient"}'::jsonb, '2026-01-10'::timestamptz, now()),
    ('11111111-1111-1111-1111-111111111107'::uuid, 'authenticated', 'authenticated', 'patient7@cervitrack.app', ph, now(), '{"name":"Agnes Nyambura","phone":"+254777000007","role":"patient"}'::jsonb, '2026-04-01'::timestamptz, now()),
    ('11111111-1111-1111-1111-111111111108'::uuid, 'authenticated', 'authenticated', 'patient8@cervitrack.app', ph, now(), '{"name":"Lucy Akinyi","phone":"+254788000008","role":"patient"}'::jsonb, '2026-03-15'::timestamptz, now()),
    ('11111111-1111-1111-1111-111111111109'::uuid, 'authenticated', 'authenticated', 'patient9@cervitrack.app', ph, now(), '{"name":"Diana Chebet","phone":"+254799000009","role":"patient"}'::jsonb, '2026-02-20'::timestamptz, now()),
    ('11111111-1111-1111-1111-111111111110'::uuid, 'authenticated', 'authenticated', 'patient10@cervitrack.app', ph, now(), '{"name":"Alice Mwikali","phone":"+254700000010","role":"patient"}'::jsonb, '2026-05-01'::timestamptz, now()),
    -- NURSES (2) — role=clinician in DB
    ('22222222-2222-2222-2222-222222222201'::uuid, 'authenticated', 'authenticated', 'nurse1@cervitrack.app', ph, now(), '{"name":"Nurse Sarah Kimani","phone":"+254711000011","role":"clinician"}'::jsonb, '2026-01-05'::timestamptz, now()),
    ('22222222-2222-2222-2222-222222222202'::uuid, 'authenticated', 'authenticated', 'nurse2@cervitrack.app', ph, now(), '{"name":"Nurse Rose Omondi","phone":"+254722000022","role":"clinician"}'::jsonb, '2026-01-05'::timestamptz, now()),
    -- LAB TECHNICIANS (2) — pending approval
    ('33333333-3333-3333-3333-333333333301'::uuid, 'authenticated', 'authenticated', 'lab1@cervitrack.app', ph, now(), '{"name":"Lab Tech John Kipchoge","phone":"+254733000033","role":"lab_technician"}'::jsonb, '2026-06-01'::timestamptz, now()),
    ('33333333-3333-3333-3333-333333333302'::uuid, 'authenticated', 'authenticated', 'lab2@cervitrack.app', ph, now(), '{"name":"Lab Tech Mary Nyokabi","phone":"+254744000044","role":"lab_technician"}'::jsonb, '2026-06-15'::timestamptz, now()),
    -- ADMINS (2)
    ('44444444-4444-4444-4444-444444444401'::uuid, 'authenticated', 'authenticated', 'admin1@cervitrack.app', ph, now(), '{"name":"System Admin","phone":"+254755000055","role":"facility_admin"}'::jsonb, '2026-01-01'::timestamptz, now()),
    ('44444444-4444-4444-4444-444444444402'::uuid, 'authenticated', 'authenticated', 'admin2@cervitrack.app', ph, now(), '{"name":"County Admin Nairobi","phone":"+254766000066","role":"county_admin"}'::jsonb, '2026-01-01'::timestamptz, now())
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================
-- 2. USERS TABLE (web login + profile data)
-- Web login queries: SELECT * FROM users WHERE email = ? AND password = ?
-- ============================================================

INSERT INTO users (id, name, email, phone, password, role, county, sub_county, ward, patient_id, consent_terms, consent_medical, consent_at, total_screenings, total_vaccines, risk_index, created_at) VALUES
  -- Patients
  ('11111111-1111-1111-1111-111111111101', 'Grace Wanjiku', 'patient1@cervitrack.app', '+254712000001', 'password123', 'patient', 'Nairobi', 'Westlands', 'Parklands', 'PT-2026-0001', true, true, '2026-01-15', 1, 1, 'low', '2026-01-15'),
  ('11111111-1111-1111-1111-111111111102', 'Faith Achieng', 'patient2@cervitrack.app', '+254722000002', 'password123', 'patient', 'Kisumu', 'Kisumu Central', 'Kondele', 'PT-2026-0002', true, true, '2026-02-01', 2, 1, 'medium', '2026-02-01'),
  ('11111111-1111-1111-1111-111111111103', 'Mary Njeri', 'patient3@cervitrack.app', '+254733000003', 'password123', 'patient', 'Nakuru', 'Nakuru Town', 'CBD', 'PT-2026-0003', true, true, '2026-01-20', 3, 0, 'high', '2026-01-20'),
  ('11111111-1111-1111-1111-111111111104', 'Esther Muthoni', 'patient4@cervitrack.app', '+254744000004', 'password123', 'patient', 'Nyeri', 'Nyeri Central', 'Ruringu', 'PT-2026-0004', true, true, '2026-03-01', 2, 1, 'low', '2026-03-01'),
  ('11111111-1111-1111-1111-111111111105', 'Rose Adhiambo', 'patient5@cervitrack.app', '+254755000005', 'password123', 'patient', 'Mombasa', 'Mvita', 'Old Town', 'PT-2026-0005', true, true, '2026-02-15', 1, 1, 'low', '2026-02-15'),
  ('11111111-1111-1111-1111-111111111106', 'Jane Wairimu', 'patient6@cervitrack.app', '+254766000006', 'password123', 'patient', 'Kiambu', 'Thika', 'Town', 'PT-2026-0006', true, true, '2026-01-10', 3, 0, 'critical', '2026-01-10'),
  ('11111111-1111-1111-1111-111111111107', 'Agnes Nyambura', 'patient7@cervitrack.app', '+254777000007', 'password123', 'patient', 'Meru', 'Meru Town', 'CBD', 'PT-2026-0007', true, true, '2026-04-01', 2, 1, 'medium', '2026-04-01'),
  ('11111111-1111-1111-1111-111111111108', 'Lucy Akinyi', 'patient8@cervitrack.app', '+254788000008', 'password123', 'patient', 'Kakamega', 'Kakamega Town', 'CBD', 'PT-2026-0008', true, true, '2026-03-15', 1, 1, 'low', '2026-03-15'),
  ('11111111-1111-1111-1111-111111111109', 'Diana Chebet', 'patient9@cervitrack.app', '+254799000009', 'password123', 'patient', 'Uasin Gishu', 'Eldoret', 'CBD', 'PT-2026-0009', true, true, '2026-02-20', 2, 0, 'high', '2026-02-20'),
  ('11111111-1111-1111-1111-111111111110', 'Alice Mwikali', 'patient10@cervitrack.app', '+254700000010', 'password123', 'patient', 'Machakos', 'Machakos Town', 'CBD', 'PT-2026-0010', true, true, '2026-05-01', 1, 1, 'low', '2026-05-01'),
  -- Nurses
  ('22222222-2222-2222-2222-222222222201', 'Nurse Sarah Kimani', 'nurse1@cervitrack.app', '+254711000011', 'password123', 'clinician', 'Nakuru', 'Nakuru Town', 'CBD', NULL, true, true, '2026-01-05', 0, 0, 'low', '2026-01-05'),
  ('22222222-2222-2222-2222-222222222202', 'Nurse Rose Omondi', 'nurse2@cervitrack.app', '+254722000022', 'password123', 'clinician', 'Mombasa', 'Mvita', 'Old Town', NULL, true, true, '2026-01-05', 0, 0, 'low', '2026-01-05'),
  -- Lab Technicians
  ('33333333-3333-3333-3333-333333333301', 'Lab Tech John Kipchoge', 'lab1@cervitrack.app', '+254733000033', 'password123', 'lab_technician', 'Nairobi', 'Westlands', 'Parklands', NULL, true, true, '2026-06-01', 0, 0, 'low', '2026-06-01'),
  ('33333333-3333-3333-3333-333333333302', 'Lab Tech Mary Nyokabi', 'lab2@cervitrack.app', '+254744000044', 'password123', 'lab_technician', 'Uasin Gishu', 'Eldoret', 'CBD', NULL, true, true, '2026-06-15', 0, 0, 'low', '2026-06-15'),
  -- Admins
  ('44444444-4444-4444-4444-444444444401', 'System Admin', 'admin1@cervitrack.app', '+254755000055', 'password123', 'facility_admin', 'Nairobi', 'Westlands', 'Parklands', NULL, true, true, '2026-01-01', 0, 0, 'low', '2026-01-01'),
  ('44444444-4444-4444-4444-444444444402', 'County Admin Nairobi', 'admin2@cervitrack.app', '+254766000066', 'password123', 'county_admin', 'Nairobi', 'Westlands', 'Parklands', NULL, true, true, '2026-01-01', 0, 0, 'low', '2026-01-01')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. PROVIDERS TABLE (clinician web login — separate from users)
-- ============================================================

INSERT INTO providers (id, name, email, phone, password, role, specialty, hospital, license_number, approval_status, approved_by, approved_at, specialization, county, sub_county, bio, years_experience, created_at) VALUES
  -- Approved clinicians
  ('55555555-5555-5555-5555-555555555501', 'Dr. Amina Wanjiku', 'clinician1@cervitrack.app', '+254711000011', 'password123', 'clinician', 'Oncologist', 'Kenyatta National Hospital', 'KMPB-2020-1234', 'approved', '44444444-4444-4444-4444-444444444401', '2026-01-10', 'oncologist', 'Nairobi', 'Westlands', 'Experienced oncologist specializing in cervical cancer screening and treatment.', 12, '2026-01-05'),
  ('55555555-5555-5555-5555-555555555502', 'Dr. James Ochieng', 'clinician2@cervitrack.app', '+254722000022', 'password123', 'clinician', 'Gynecologist', 'Moi Teaching and Referral Hospital', 'KMPB-2021-5678', 'approved', '44444444-4444-4444-4444-444444444401', '2026-01-10', 'gynecologist', 'Uasin Gishu', 'Eldoret', 'Gynecologist with focus on women''s health and cervical cancer prevention.', 8, '2026-01-05'),
  ('55555555-5555-5555-5555-555555555503', 'Dr. Faith Akinyi', 'clinician3@cervitrack.app', '+254733000033', 'password123', 'clinician', 'Public Health Officer', 'Kisumu County Hospital', 'KMPB-2022-9012', 'approved', '44444444-4444-4444-4444-444444444401', '2026-01-10', 'public_health_officer', 'Kisumu', 'Kisumu Central', 'Public health officer specializing in community health and cervical cancer awareness.', 5, '2026-01-05'),
  -- Pending clinician (for admin approval testing)
  ('55555555-5555-5555-5555-555555555504', 'Dr. Peter Mwangi', 'clinician4@cervitrack.app', '+254744000044', 'password123', 'clinician', 'General Practitioner', 'Nakuru Level 5 Hospital', 'KMPB-2023-3456', 'pending', NULL, NULL, 'general_practitioner', 'Nakuru', 'Nakuru Town', 'General practitioner interested in cervical cancer screening.', 3, '2026-06-20')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. SCREENINGS (2-3 per patient)
-- ============================================================

INSERT INTO screenings (profile_id, verdict, risk_tier, age, parity, vaccination, previous_screening, hiv_status, smoking, symptoms, family_history, score, hpv_result, cytology_result, created_at) VALUES
  -- Patient 1 — Grace Wanjiku (32, low risk, VIA Negative)
  ('11111111-1111-1111-1111-111111111101', 'VIA Negative', 'low', 32, 2, 'completed', 'none', 'negative', 'no', 'none', 'no', 15, 'negative', 'normal', '2026-02-10'),

  -- Patient 2 — Faith Achieng (28, medium risk, ASCUS then clear)
  ('11111111-1111-1111-1111-111111111102', 'VIA Positive - ASCUS', 'medium', 28, 1, 'partial', 'none', 'negative', 'no', 'mild discharge', 'no', 45, 'negative', 'ASCUS', '2026-03-15'),
  ('11111111-1111-1111-1111-111111111102', 'Follow-up Normal', 'low', 28, 1, 'partial', 'ASCUS', 'negative', 'no', 'none', 'no', 20, 'negative', 'normal', '2026-06-20'),

  -- Patient 3 — Mary Njeri (45, high risk, HPV+ then LSIL)
  ('11111111-1111-1111-1111-111111111103', 'HPV Positive', 'high', 45, 4, 'none', 'VIA Negative 2024', 'positive', 'no', 'none', 'yes', 75, 'positive', 'LSIL', '2026-02-05'),
  ('11111111-1111-1111-1111-111111111103', 'Colposcopy - LSIL', 'high', 45, 4, 'none', 'HPV Positive', 'positive', 'no', 'none', 'yes', 78, 'positive', 'LSIL', '2026-04-10'),
  ('11111111-1111-1111-1111-111111111103', 'Post-Treatment Follow-up', 'medium', 45, 4, 'none', 'LSIL', 'positive', 'no', 'none', 'yes', 55, 'negative', 'ASCUS', '2026-07-01'),

  -- Patient 4 — Esther Muthoni (38, low risk)
  ('11111111-1111-1111-1111-111111111104', 'VIA Negative', 'low', 38, 2, 'completed', 'VIA Negative 2025', 'negative', 'no', 'none', 'no', 12, 'negative', 'normal', '2026-03-20'),
  ('11111111-1111-1111-1111-111111111104', 'Pap Smear Normal', 'low', 38, 2, 'completed', 'VIA Negative', 'negative', 'no', 'none', 'no', 10, 'negative', 'normal', '2026-06-15'),

  -- Patient 5 — Rose Adhiambo (26, low risk)
  ('11111111-1111-1111-1111-111111111105', 'VIA Negative', 'low', 26, 0, 'scheduled', 'none', 'negative', 'no', 'none', 'no', 8, 'negative', 'normal', '2026-03-01'),

  -- Patient 6 — Jane Wairimu (52, critical — HSIL → LEEP)
  ('11111111-1111-1111-1111-111111111106', 'VIA Positive - HSIL', 'critical', 52, 5, 'none', 'VIA Positive 2023', 'negative', 'yes', 'bleeding', 'yes', 92, 'positive', 'HSIL', '2026-01-25'),
  ('11111111-1111-1111-1111-111111111106', 'LEEP Treatment', 'high', 52, 5, 'none', 'HSIL', 'negative', 'yes', 'none', 'yes', 80, 'positive', 'HSIL', '2026-03-10'),
  ('11111111-1111-1111-1111-111111111106', 'Post-LEEP Follow-up', 'medium', 52, 5, 'none', 'LEEP', 'negative', 'no', 'none', 'yes', 50, 'negative', 'ASCUS', '2026-06-25'),

  -- Patient 7 — Agnes Nyambura (34, medium risk)
  ('11111111-1111-1111-1111-111111111107', 'VIA Positive - ASCUS', 'medium', 34, 2, 'partial', 'none', 'negative', 'no', 'mild discharge', 'no', 48, 'negative', 'ASCUS', '2026-04-15'),
  ('11111111-1111-1111-1111-111111111107', 'Follow-up Normal', 'low', 34, 2, 'partial', 'ASCUS', 'negative', 'no', 'none', 'no', 18, 'negative', 'normal', '2026-07-10'),

  -- Patient 8 — Lucy Akinyi (29, low risk)
  ('11111111-1111-1111-1111-111111111108', 'VIA Negative', 'low', 29, 1, 'completed', 'none', 'negative', 'no', 'none', 'no', 10, 'negative', 'normal', '2026-04-05'),

  -- Patient 9 — Diana Chebet (41, high risk — HPV+)
  ('11111111-1111-1111-1111-111111111109', 'HPV Positive', 'high', 41, 3, 'none', 'VIA Negative 2024', 'negative', 'no', 'none', 'yes', 72, 'positive', 'LSIL', '2026-03-05'),
  ('11111111-1111-1111-1111-111111111109', 'Cryotherapy Treatment', 'high', 41, 3, 'none', 'HPV Positive', 'negative', 'no', 'none', 'yes', 75, 'positive', 'LSIL', '2026-05-20'),

  -- Patient 10 — Alice Mwikali (23, low risk)
  ('11111111-1111-1111-1111-111111111110', 'VIA Negative', 'low', 23, 0, 'scheduled', 'none', 'negative', 'no', 'none', 'no', 5, 'negative', 'normal', '2026-05-15')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. VACCINES (patients under 40)
-- ============================================================

INSERT INTO vaccines (user_id, name, hospital, date, status, reminder_day, reminder_before, created_at) VALUES
  -- First doses (done)
  ('11111111-1111-1111-1111-111111111101', 'HPV Vaccine - Dose 1', 'Kenyatta National Hospital', '2026-02-20', 'done', true, true, '2026-02-20'),
  ('11111111-1111-1111-1111-111111111102', 'HPV Vaccine - Dose 1', 'Kisumu County Hospital', '2026-04-01', 'done', true, true, '2026-04-01'),
  ('11111111-1111-1111-1111-111111111104', 'HPV Vaccine - Dose 1', 'Nyeri County Hospital', '2026-04-10', 'done', true, true, '2026-04-10'),
  ('11111111-1111-1111-1111-111111111105', 'HPV Vaccine - Dose 1', 'Coast General Hospital', '2026-03-15', 'done', true, true, '2026-03-15'),
  ('11111111-1111-1111-1111-111111111107', 'HPV Vaccine - Dose 1', 'Meru County Hospital', '2026-05-01', 'done', true, true, '2026-05-01'),
  ('11111111-1111-1111-1111-111111111108', 'HPV Vaccine - Dose 1', 'Kakamega General Hospital', '2026-04-20', 'done', true, true, '2026-04-20'),
  ('11111111-1111-1111-1111-111111111110', 'HPV Vaccine - Dose 1', 'Machakos Hospital', '2026-06-01', 'done', true, true, '2026-06-01'),
  -- Second doses (scheduled)
  ('11111111-1111-1111-1111-111111111101', 'HPV Vaccine - Dose 2', 'Kenyatta National Hospital', '2026-08-20', 'scheduled', true, false, '2026-02-20'),
  ('11111111-1111-1111-1111-111111111102', 'HPV Vaccine - Dose 2', 'Kisumu County Hospital', '2026-10-01', 'scheduled', true, false, '2026-04-01'),
  ('11111111-1111-1111-1111-111111111105', 'HPV Vaccine - Dose 2', 'Coast General Hospital', '2026-09-15', 'scheduled', true, false, '2026-03-15')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. APPOINTMENTS
-- ============================================================

INSERT INTO appointments (user_id, clinician_id, provider_id, title, facility, facility_name, facility_location, date, time, notes, custom_text, status, created_at) VALUES
  ('11111111-1111-1111-1111-111111111101', NULL, '55555555-5555-5555-5555-555555555501', 'HPV Vaccine Dose 1', 'KNH', 'Kenyatta National Hospital', 'Upper Hill, Nairobi', '2026-02-20', '10:00', 'First HPV vaccine dose', '', 'completed', '2026-02-01'),
  ('11111111-1111-1111-1111-111111111102', NULL, '55555555-5555-5555-5555-555555555503', 'Follow-up Screening', 'Kisumu County Hospital', 'Kisumu County Hospital', 'Kisumu City', '2026-08-15', '14:00', 'Follow-up after ASCUS result', 'Bring previous results', 'upcoming', '2026-06-25'),
  ('11111111-1111-1111-1111-111111111103', NULL, '55555555-5555-5555-5555-555555555501', 'Colposcopy', 'KNH', 'Kenyatta National Hospital', 'Upper Hill, Nairobi', '2026-04-10', '09:00', 'Colposcopy for HPV+ result', 'Urgent — HPV positive', 'completed', '2026-03-20'),
  ('11111111-1111-1111-1111-111111111103', NULL, '55555555-5555-5555-5555-555555555501', 'Post-Treatment Review', 'KNH', 'Kenyatta National Hospital', 'Upper Hill, Nairobi', '2026-07-15', '11:00', 'Review after treatment', '', 'upcoming', '2026-06-20'),
  ('11111111-1111-1111-1111-111111111104', NULL, '55555555-5555-5555-5555-555555555504', 'Routine Screening', 'Nakuru Level 5', 'Nakuru Level 5 Hospital', 'Nakuru Town', '2026-03-20', '10:30', 'Annual screening', '', 'completed', '2026-03-01'),
  ('11111111-1111-1111-1111-111111111105', NULL, '55555555-5555-5555-5555-555555555503', 'HPV Vaccine Dose 1', 'Coast General', 'Coast General Hospital', 'Mombasa', '2026-03-15', '09:00', 'First HPV vaccine dose', '', 'completed', '2026-02-20'),
  ('11111111-1111-1111-1111-111111111106', NULL, '55555555-5555-5555-5555-555555555502', 'LEEP Treatment', 'MTRH', 'Moi Teaching and Referral Hospital', 'Eldoret', '2026-03-10', '08:00', 'LEEP procedure for HSIL', 'NPO after midnight', 'completed', '2026-02-15'),
  ('11111111-1111-1111-1111-111111111106', NULL, '55555555-5555-5555-5555-555555555502', 'Post-LEEP Follow-up', 'MTRH', 'Moi Teaching and Referral Hospital', 'Eldoret', '2026-06-25', '10:00', '3-month post-LEEP review', '', 'upcoming', '2026-05-20'),
  ('11111111-1111-1111-1111-111111111109', NULL, '55555555-5555-5555-5555-555555555502', 'Cryotherapy', 'MTRH', 'Moi Teaching and Referral Hospital', 'Eldoret', '2026-05-20', '09:30', 'Cryotherapy for LSIL', '', 'completed', '2026-04-15')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. LAB RESULTS
-- ============================================================

INSERT INTO lab_results (user_id, patient_name, result, notes, created_at) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Grace Wanjiku', 'Normal — VIA Negative', 'No abnormal cells detected. Follow up in 3 years.', '2026-02-10'),
  ('11111111-1111-1111-1111-111111111102', 'Faith Achieng', 'ASCUS — Atypical Cells', 'Mild cellular changes detected. Follow-up in 6 months.', '2026-03-15'),
  ('11111111-1111-1111-1111-111111111102', 'Faith Achieng', 'Normal — Follow-up Clear', 'Previous ASCUS resolved. Return to routine screening.', '2026-06-20'),
  ('11111111-1111-1111-1111-111111111103', 'Mary Njeri', 'HPV Positive — LSIL', 'High-risk HPV detected with low-grade changes. Colposcopy recommended.', '2026-02-05'),
  ('11111111-1111-1111-1111-111111111106', 'Jane Wairimu', 'HSIL — High-Grade Lesion', 'High-grade squamous intraepithelial lesion. LEEP recommended.', '2026-01-25'),
  ('11111111-1111-1111-1111-111111111109', 'Diana Chebet', 'HPV Positive — LSIL', 'High-risk HPV detected. Cryotherapy recommended.', '2026-03-05')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. SAMPLE KITS
-- ============================================================

INSERT INTO sample_kits (barcode, kit_type, status, facility_id, registered_by, registered_by_name, patient_id, patient_name, collection_method, collected_at, current_location, received_at_lab, result, result_notes, processed_at, created_at, updated_at) VALUES
  ('CT-2026-0001', 'HPV_SELF', 'PROCESSED', 'KNH', '44444444-4444-4444-4444-444444444401', 'System Admin', '11111111-1111-1111-1111-111111111101', 'Grace Wanjiku', 'self_collected', '2026-02-05', 'KNH Lab', '2026-02-06', 'Negative', 'No HPV detected', '2026-02-08', '2026-02-05', '2026-02-08'),
  ('CT-2026-0002', 'HPV_SELF', 'PROCESSED', 'Kisumu', '44444444-4444-4444-4444-444444444401', 'System Admin', '11111111-1111-1111-1111-111111111102', 'Faith Achieng', 'self_collected', '2026-03-10', 'Kisumu Lab', '2026-03-11', 'ASCUS', 'Mild cellular changes', '2026-03-13', '2026-03-10', '2026-03-13'),
  ('CT-2026-0003', 'HPV_SELF', 'PROCESSED', 'KNH', '44444444-4444-4444-4444-444444444401', 'System Admin', '11111111-1111-1111-1111-111111111103', 'Mary Njeri', 'self_collected', '2026-02-01', 'KNH Lab', '2026-02-02', 'HPV Positive', 'High-risk HPV detected', '2026-02-04', '2026-02-01', '2026-02-04'),
  ('CT-2026-0004', 'HPV_SELF', 'PROCESSED', 'KNH', '44444444-4444-4444-4444-444444444401', 'System Admin', '11111111-1111-1111-1111-111111111106', 'Jane Wairimu', 'clinician_collected', '2026-01-20', 'KNH Lab', '2026-01-21', 'HSIL', 'High-grade lesion detected', '2026-01-23', '2026-01-20', '2026-01-23'),
  ('CT-2026-0005', 'HPV_SELF', 'PROCESSED', 'MTRH', '44444444-4444-4444-4444-444444444401', 'System Admin', '11111111-1111-1111-1111-111111111109', 'Diana Chebet', 'self_collected', '2026-03-01', 'MTRH Lab', '2026-03-02', 'HPV Positive', 'High-risk HPV detected', '2026-03-04', '2026-03-01', '2026-03-04'),
  ('CT-2026-0006', 'HPV_SELF', 'IN_LAB', 'Nakuru', '44444444-4444-4444-4444-444444444401', 'System Admin', '11111111-1111-1111-1111-111111111104', 'Esther Muthoni', 'self_collected', '2026-06-10', 'Nakuru Lab', '2026-06-11', '', '', NULL, '2026-06-10', '2026-06-11'),
  ('CT-2026-0007', 'HPV_SELF', 'COLLECTED', 'Coast General', '44444444-4444-4444-4444-444444444401', 'System Admin', '11111111-1111-1111-1111-111111111105', 'Rose Adhiambo', 'self_collected', '2026-07-15', 'Coast General', NULL, '', '', NULL, '2026-07-15', '2026-07-15'),
  ('CT-2026-0008', 'HPV_SELF', 'REGISTERED', 'Meru', '44444444-4444-4444-4444-444444444401', 'System Admin', NULL, '', NULL, NULL, 'Meru Hospital', NULL, '', '', NULL, '2026-07-20', '2026-07-20')
ON CONFLICT (barcode) DO NOTHING;

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================

INSERT INTO notifications (user_id, title, message, type, read, created_at) VALUES
  -- Grace
  ('11111111-1111-1111-1111-111111111101', 'Screening Complete', 'Your VIA screening results are ready. View them in My Results.', 'info', true, '2026-02-11'),
  ('11111111-1111-1111-1111-111111111101', 'Vaccine Reminder', 'Your HPV Vaccine Dose 2 is scheduled for August 20, 2026.', 'reminder', false, '2026-07-20'),
  -- Faith
  ('11111111-1111-1111-1111-111111111102', 'Results Ready', 'Your screening results are available. Please review in My Results.', 'info', true, '2026-03-16'),
  ('11111111-1111-1111-1111-111111111102', 'Appointment Reminder', 'You have an upcoming appointment on August 15 at Kisumu County Hospital.', 'appointment', false, '2026-08-01'),
  -- Mary
  ('11111111-1111-1111-1111-111111111103', 'Urgent: HPV Positive', 'Your HPV test came back positive. Please schedule a follow-up immediately.', 'alert', true, '2026-02-06'),
  ('11111111-1111-1111-1111-111111111103', 'Treatment Complete', 'Your treatment has been completed. Follow-up scheduled for July 15.', 'info', false, '2026-07-02'),
  -- Jane
  ('11111111-1111-1111-1111-111111111106', 'Critical: HSIL Detected', 'Your screening shows high-grade changes. LEEP treatment has been scheduled.', 'alert', true, '2026-01-26'),
  ('11111111-1111-1111-1111-111111111106', 'Post-Treatment Follow-up', 'Your 3-month post-LEEP follow-up is scheduled for June 25.', 'reminder', false, '2026-06-10'),
  -- Diana
  ('11111111-1111-1111-1111-111111111109', 'HPV Positive Results', 'Your HPV test came back positive. Cryotherapy has been scheduled.', 'alert', true, '2026-03-06'),
  ('11111111-1111-1111-1111-111111111109', 'Treatment Complete', 'Your cryotherapy treatment is complete. Follow-up in 6 months.', 'info', false, '2026-05-21')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE — 20 users + sample data seeded
-- ============================================================
