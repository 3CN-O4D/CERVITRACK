-- Link chat contacts to real user accounts and derive them from staff users.
-- Replaces the previously hardcoded chat_contacts list so chats always map to
-- real accounts in the database.

ALTER TABLE chat_contacts
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS chat_contacts_user_id_key ON chat_contacts(user_id);

-- Backfill existing contacts by matching a real staff user's name
UPDATE chat_contacts c
SET user_id = u.id
FROM users u
WHERE c.user_id IS NULL
  AND u.name = c.name
  AND u.role IN ('clinician','provider','lab_technician','facility_admin','county_admin','national_admin','system_admin','admin');

-- Keep conversation labels aligned with the linked account
UPDATE chat_conversations conv
SET contact_name = u.name
FROM chat_contacts c
JOIN users u ON u.id = c.user_id
WHERE conv.contact_id = c.id;

-- Create/refresh a contact for every real staff user
INSERT INTO chat_contacts (user_id, name, role, specialty, hospital, online)
SELECT u.id,
       u.name,
       u.role::text,
       COALESCE(p.specialty, ''),
       COALESCE(p.hospital, ''),
       false
FROM users u
LEFT JOIN providers p ON p.email = u.email
WHERE u.role IN ('clinician','provider','lab_technician','facility_admin','county_admin','national_admin','system_admin','admin')
ON CONFLICT (user_id) DO UPDATE
  SET name = EXCLUDED.name,
      role = EXCLUDED.role,
      specialty = EXCLUDED.specialty,
      hospital = EXCLUDED.hospital,
      last_updated = now();

-- Drop hardcoded contacts that are not linked to any real account
DELETE FROM chat_contacts WHERE user_id IS NULL;

-- Keep contacts in sync automatically for future staff accounts
CREATE OR REPLACE FUNCTION sync_chat_contact_for_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IN ('clinician','provider','lab_technician','facility_admin','county_admin','national_admin','system_admin','admin') THEN
    INSERT INTO chat_contacts (user_id, name, role, online)
    VALUES (NEW.id, NEW.name, NEW.role::text, false)
    ON CONFLICT (user_id) DO UPDATE
      SET name = EXCLUDED.name,
          role = EXCLUDED.role,
          last_updated = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_chat_contact ON users;
CREATE TRIGGER trg_users_chat_contact
AFTER INSERT OR UPDATE OF name, role ON users
FOR EACH ROW EXECUTE FUNCTION sync_chat_contact_for_user();
