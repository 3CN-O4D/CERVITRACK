-- Cervitrack Profile Routing
-- When any of the 5 apps authenticate, this function routes them to the correct view

-- 1. Create a unified user_roles view that all 5 apps query after login
CREATE OR REPLACE VIEW public.user_profile_routing AS
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.phone,
  u.role,
  u.is_active,
  u.last_login,
  -- Facility context
  u.facility_id,
  f.name AS facility_name,
  f.county,
  f.sub_county,
  f.mfl_code,
  -- App routing hints
  CASE u.role
    WHEN 'patient' THEN ARRAY['patient-apk']
    WHEN 'lab_technician' THEN ARRAY['lab-pwa']
    WHEN 'clinician' THEN ARRAY['clinician-workspace']
    WHEN 'facility_admin' THEN ARRAY['clinician-workspace', 'admin-panel']
    WHEN 'county_admin' THEN ARRAY['admin-panel']
    WHEN 'national_admin' THEN ARRAY['admin-panel']
    WHEN 'system_admin' THEN ARRAY['admin-panel', 'clinician-workspace', 'lab-pwa', 'patient-apk']
  END AS allowed_apps,
  CASE u.role
    WHEN 'patient' THEN ARRAY['view-own-records', 'book-appointment', 'view-results']
    WHEN 'lab_technician' THEN ARRAY['view-assigned-tests', 'enter-results', 'sync-offline']
    WHEN 'clinician' THEN ARRAY['manage-patients', 'create-screenings', 'upload-images', 'create-referrals']
    WHEN 'facility_admin' THEN ARRAY['manage-facility', 'view-facility-stats', 'manage-staff']
    WHEN 'county_admin' THEN ARRAY['view-county-stats', 'manage-facilities']
    WHEN 'national_admin' THEN ARRAY['view-national-stats', 'export-dhis2', 'manage-counties']
    WHEN 'system_admin' THEN ARRAY['manage-all', 'system-config', 'audit-logs']
  END AS permissions
FROM public.users u
LEFT JOIN public.facilities f ON u.facility_id = f.id;

-- 2. RLS policy: users can only see their own profile
CREATE OR REPLACE FUNCTION public.get_my_routing()
RETURNS TABLE (
  id TEXT,
  email TEXT,
  role TEXT,
  facility_id TEXT,
  facility_name TEXT,
  county TEXT,
  allowed_apps TEXT[],
  permissions TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    ur.id::TEXT,
    ur.email,
    ur.role::TEXT,
    ur.facility_id::TEXT,
    ur.facility_name,
    ur.county,
    ur.allowed_apps,
    ur.permissions
  FROM public.user_profile_routing ur
  WHERE ur.id = auth.uid()::TEXT;
$$;

-- 3. Mobile APK: fetch patient profile with minimal data
CREATE OR REPLACE FUNCTION public.get_patient_profile()
RETURNS TABLE (
  id TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  facility_name TEXT,
  county TEXT,
  last_screening_date TIMESTAMPTZ,
  next_appointment TIMESTAMPTZ,
  screening_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    u.id::TEXT,
    u.first_name,
    u.last_name,
    u.phone,
    f.name,
    f.county,
    (SELECT screening_date FROM public.screenings WHERE patient_id = p.id ORDER BY screening_date DESC LIMIT 1),
    (SELECT appointment_date FROM public.appointments WHERE patient_id = p.id AND status = 'scheduled' ORDER BY appointment_date ASC LIMIT 1),
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.screenings
        WHERE patient_id = p.id
        AND result = 'POSITIVE'
        AND screening_date > NOW() - INTERVAL '6 months'
      ) THEN 'needs_followup'
      ELSE 'routine'
    END
  FROM public.users u
  JOIN public.patients p ON p.user_id = u.id
  LEFT JOIN public.facilities f ON p.facility_id = f.id
  WHERE u.id = auth.uid()::TEXT;
$$;

-- 4. Lab PWA: fetch pending test queue
CREATE OR REPLACE FUNCTION public.get_lab_queue()
RETURNS TABLE (
  screening_id TEXT,
  patient_name TEXT,
  screening_type TEXT,
  facility_name TEXT,
  screening_date TIMESTAMPTZ,
  priority TEXT,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.id::TEXT,
    u.first_name || ' ' || u.last_name,
    s.screening_type::TEXT,
    f.name,
    s.screening_date,
    CASE
      WHEN s.screening_date < NOW() - INTERVAL '7 days' THEN 'urgent'
      WHEN s.screening_date < NOW() - INTERVAL '3 days' THEN 'high'
      ELSE 'normal'
    END,
    s.sync_status::TEXT
  FROM public.screenings s
  JOIN public.patients p ON s.patient_id = p.id
  JOIN public.users u ON p.user_id = u.id
  JOIN public.facilities f ON s.facility_id = f.id
  WHERE s.result = 'PENDING'
  ORDER BY s.screening_date ASC;
$$;

-- 5. Grant access
GRANT EXECUTE ON FUNCTION public.get_my_routing() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_patient_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lab_queue() TO authenticated;
GRANT SELECT ON public.user_profile_routing TO authenticated;
