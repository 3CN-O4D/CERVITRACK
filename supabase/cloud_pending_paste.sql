-- CerviTrack cloud apply (run once in the Supabase SQL editor for project vikujluvquznpjepdhxk)
-- Concatenation of:
--   supabase/migrations/20260917090000_consent_grants.sql
--   supabase/migrations/20260917093000_chat_edit_delete.sql
-- Safe to re-run: all statements are idempotent.

-- ============================================================
-- consent_grants: explicit per-patient -> per-staff sharing grants for chat.
-- No chat route authorises a staff member unless an active grant exists.
-- ============================================================

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

-- ============================================================
-- Chat messaging hardening + delivery/edit/delete support.
-- ============================================================

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at  timestamptz;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS hidden_for uuid[] DEFAULT '{}';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;

DROP POLICY IF EXISTS "Users update own chat_messages" ON chat_messages;
CREATE POLICY "Users update own chat_messages" ON chat_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid()) AND chat_messages.sender_id = auth.uid())
  WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid()) AND chat_messages.sender_id = auth.uid());

DROP FUNCTION IF EXISTS hide_message_for_me(uuid);
DROP FUNCTION IF EXISTS hide_message_for_me(bigint);
CREATE OR REPLACE FUNCTION hide_message_for_me(p_message_id bigint) RETURNS boolean AS $$
DECLARE v_conversation_id bigint;
BEGIN
  SELECT cm.conversation_id INTO v_conversation_id FROM chat_messages cm WHERE cm.id = p_message_id;
  IF v_conversation_id IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = v_conversation_id AND cc.user_id = auth.uid()) THEN RETURN false; END IF;
  UPDATE chat_messages SET hidden_for = CASE WHEN auth.uid() = ANY(hidden_for) THEN hidden_for ELSE hidden_for || auth.uid() END WHERE id = p_message_id;
  RETURN true;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS mark_chat_messages_read(uuid);
DROP FUNCTION IF EXISTS mark_chat_messages_read(bigint);
CREATE OR REPLACE FUNCTION mark_chat_messages_read(p_conversation_id bigint) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = p_conversation_id AND cc.user_id = auth.uid()) THEN RETURN; END IF;
  UPDATE chat_messages SET read = true, status = 'read' WHERE conversation_id = p_conversation_id AND sender_id <> auth.uid();
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
