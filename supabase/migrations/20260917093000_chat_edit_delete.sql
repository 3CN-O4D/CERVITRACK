-- Chat messaging hardening + delivery/edit/delete support.
-- Unifies mobile onto chat_conversations / chat_messages (already done in code)
-- and adds edit / delete-for-everyone / delete-for-me columns + RLS.

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at  timestamptz;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS hidden_for uuid[] DEFAULT '{}';

DROP POLICY IF EXISTS "Users update own chat_messages" ON chat_messages;
CREATE POLICY "Users update own chat_messages" ON chat_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid()) AND chat_messages.sender_id = auth.uid())
  WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND cc.user_id = auth.uid()) AND chat_messages.sender_id = auth.uid());

CREATE OR REPLACE FUNCTION hide_message_for_me(p_message_id uuid) RETURNS boolean AS $$
DECLARE v_conversation_id uuid;
BEGIN
  SELECT cm.conversation_id INTO v_conversation_id FROM chat_messages cm WHERE cm.id = p_message_id;
  IF v_conversation_id IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = v_conversation_id AND cc.user_id = auth.uid()) THEN RETURN false; END IF;
  UPDATE chat_messages SET hidden_for = CASE WHEN auth.uid() = ANY(hidden_for) THEN hidden_for ELSE hidden_for || auth.uid() END WHERE id = p_message_id;
  RETURN true;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION mark_chat_messages_read(p_conversation_id uuid) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM chat_conversations cc WHERE cc.id = p_conversation_id AND cc.user_id = auth.uid()) THEN RETURN; END IF;
  UPDATE chat_messages SET read = true, status = 'read' WHERE conversation_id = p_conversation_id AND sender_id <> auth.uid();
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;