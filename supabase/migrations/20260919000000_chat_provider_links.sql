-- Link chat contacts to their provider profiles so patients can start a
-- conversation with any approved provider (auto-creating a contact when needed).

ALTER TABLE chat_contacts
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS chat_contacts_provider_id_idx ON chat_contacts(provider_id);

CREATE UNIQUE INDEX IF NOT EXISTS chat_contacts_provider_id_unique ON chat_contacts(provider_id)
  WHERE provider_id IS NOT NULL;

-- Backfill provider links from the provider <-> user email join
UPDATE chat_contacts c
SET provider_id = p.id
FROM users u
JOIN providers p ON p.email = u.email
WHERE c.user_id = u.id
  AND c.provider_id IS NULL;

-- Keep a contact available for provider profiles that have no linked user
-- account yet, so patients can still start (and later receive) a chat.
CREATE OR REPLACE FUNCTION ensure_chat_contact_for_provider()
RETURNS trigger AS $$
DECLARE
  uid uuid;
BEGIN
  SELECT u.id INTO uid
  FROM users u
  WHERE u.email = NEW.email AND u.role <> 'patient';
  IF uid IS NULL THEN
    INSERT INTO chat_contacts (name, role, specialty, hospital, provider_id)
    VALUES (NEW.name, 'clinician', COALESCE(NEW.specialty, ''), COALESCE(NEW.hospital, ''), NEW.id)
    ON CONFLICT (provider_id) WHERE provider_id IS NOT NULL DO UPDATE
      SET name = EXCLUDED.name,
          specialty = EXCLUDED.specialty,
          hospital = EXCLUDED.hospital,
          last_updated = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_providers_chat_contact ON providers;
CREATE TRIGGER trg_providers_chat_contact
AFTER INSERT ON providers
FOR EACH ROW EXECUTE FUNCTION ensure_chat_contact_for_provider();