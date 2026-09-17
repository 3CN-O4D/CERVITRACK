-- Adds a distinct status for samples collected by the patient but still in the
-- patient's possession. Only a clinician/lab scan moves a kit to COLLECTED.
ALTER TYPE kit_status ADD VALUE IF NOT EXISTS 'WITH_PATIENT' AFTER 'PAIRED';
