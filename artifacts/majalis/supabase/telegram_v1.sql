-- Migration: Telegram Integration — telegram_subscribers + telegram_messages_log
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS + DO $$ guards)

CREATE TABLE IF NOT EXISTS telegram_subscribers (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id           bigint      UNIQUE NOT NULL,
  username          text,
  user_id           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active         boolean     NOT NULL DEFAULT true,
  subscribed_at     timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tg_subscribers_chat_id ON telegram_subscribers(chat_id);
CREATE INDEX IF NOT EXISTS idx_tg_subscribers_active  ON telegram_subscribers(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS telegram_messages_log (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id             bigint      NOT NULL,
  message_text        text,
  telegram_message_id int,
  status              text        NOT NULL DEFAULT 'sent',
  error               text,
  sent_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_log_chat_id ON telegram_messages_log(chat_id);
CREATE INDEX IF NOT EXISTS idx_tg_log_sent_at ON telegram_messages_log(sent_at DESC);

ALTER TABLE telegram_subscribers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_messages_log  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'telegram_subscribers' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON telegram_subscribers FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'telegram_messages_log' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON telegram_messages_log FOR ALL TO service_role USING (true);
  END IF;
END $$;
