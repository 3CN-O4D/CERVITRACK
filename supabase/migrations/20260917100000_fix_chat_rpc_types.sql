-- Fix chat RPC parameter types. chat_messages.id and chat_conversations.id are
-- bigint (bigserial), but the functions were declared with uuid parameters, so
-- PostgREST failed with "operator does not exist: bigint = uuid".
-- Recreate with matching types and drop the stale uuid overloads.

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;

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
