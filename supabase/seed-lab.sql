-- ============================================================
-- CerviTrack — Lab Batch Tables + Seed
-- Drop and recreate lab batch tables (clean slate)
-- ============================================================

-- Drop existing tables
DROP TABLE IF EXISTS sample_batch_items CASCADE;
DROP TABLE IF EXISTS sample_batches CASCADE;

-- ============================================================
-- 1. SAMPLE BATCHES (header)
-- ============================================================
CREATE TABLE sample_batches (
  id BIGSERIAL PRIMARY KEY,
  batch_code TEXT UNIQUE NOT NULL,
  lab_tech_id TEXT,
  lab_tech_name TEXT,
  facility_id TEXT,
  status TEXT DEFAULT 'receiving',
  sample_count INT DEFAULT 0,
  processed_count INT DEFAULT 0,
  notes TEXT,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. SAMPLE BATCH ITEMS (individual kits in a batch)
-- ============================================================
CREATE TABLE sample_batch_items (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT REFERENCES sample_batches(id),
  kit_barcode TEXT NOT NULL,
  kit_id TEXT,
  patient_id UUID,
  patient_name TEXT,
  status TEXT DEFAULT 'received',
  result TEXT DEFAULT '',
  result_notes TEXT DEFAULT '',
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================
ALTER TABLE sample_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lab techs manage batches"
  ON sample_batches
  FOR ALL
  USING (
    lab_tech_id::TEXT IN (
      SELECT id::TEXT
      FROM users
      WHERE role IN ('lab_technician','system_admin','national_admin','county_admin','facility_admin')
    )
  );

CREATE POLICY "Lab techs manage batch items"
  ON sample_batch_items
  FOR ALL
  USING (
    batch_id IN (
      SELECT id
      FROM sample_batches
      WHERE lab_tech_id::TEXT IN (
        SELECT id::TEXT
        FROM users
        WHERE role IN ('lab_technician','system_admin','national_admin','county_admin','facility_admin')
      )
    )
  );

-- ============================================================
-- 4. SEED: test batch (lab_tech_id from seed.sql: lab1 user)
-- ============================================================
INSERT INTO sample_batches
  (batch_code, lab_tech_id, lab_tech_name, facility_id, status, sample_count, processed_count)
VALUES
  ('BT-20260723-001', '33333333-3333-3333-3333-333333333301', 'Lab Tech John Kipchoge', 'KNH', 'receiving', 0, 0)
ON CONFLICT (batch_code) DO NOTHING;
