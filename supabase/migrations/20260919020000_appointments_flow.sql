-- Item 3 — Appointment booking flow enhancements.
--  * method: 'doctor' (specific pick) | 'hospital' (any provider at that facility) | 'next_available' (nearest/any)
--  * reminder_phone: patient phone used for the SMS/phone reminder after a clinician sets the date
--  * granted_clinician_id: the clinician who accepted the booking (approvals are clinician-driven)

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS method          text DEFAULT 'doctor',
  ADD COLUMN IF NOT EXISTS reminder_phone  text DEFAULT '',
  ADD COLUMN IF NOT EXISTS granted_clinician_id uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_provider_status
  ON appointments (provider_id, status);

CREATE INDEX IF NOT EXISTS idx_appointments_sched
  ON appointments (user_id, date, status);
