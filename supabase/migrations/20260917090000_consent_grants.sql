-- consent_grants: explicit per-patient -> per-staff sharing grants for chat.
-- No chat route authorises a staff member unless an active grant exists.

CREATE TABLE IF NOT EXISTS consent_grants (
  id          bigserial PRIMARY KEY,
  patient_id  uuid REFERENCES users(id) ON DELETE CASCADE,
  staff_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'granted',
  granted_at  timestamptz DEFAULT now(),
  revoked_at  timestamptz,
  UNIQUE (patient_id, staff_id)
);

ALTER TABLE consent_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients read own grants" ON consent_grants;
CREATE POLICY "Patients read own grants" ON consent_grants FOR SELECT USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Patients grant consent" ON consent_grants;
CREATE POLICY "Patients grant consent" ON consent_grants FOR INSERT WITH CHECK (patient_id = auth.uid() AND EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'patient'));

DROP POLICY IF EXISTS "Patients revoke consent" ON consent_grants;
CREATE POLICY "Patients revoke consent" ON consent_grants FOR DELETE USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Patients update own grants" ON consent_grants;
CREATE POLICY "Patients update own grants" ON consent_grants FOR UPDATE USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "Staff read grants to them" ON consent_grants;
CREATE POLICY "Staff read grants to them" ON consent_grants FOR SELECT USING (staff_id = auth.uid());