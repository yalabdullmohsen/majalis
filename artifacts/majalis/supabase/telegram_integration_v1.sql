-- Telegram Integration Schema v1
-- Run this migration to add Telegram lesson extraction support.

-- ── 1. telegram_channels ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS telegram_channels (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL,
  telegram_username         TEXT UNIQUE,            -- @DrosQ8 (without @)
  telegram_chat_id          BIGINT,                 -- numeric chat id once resolved
  category                  TEXT DEFAULT 'عام',     -- عقيدة / فقه / عام …
  description               TEXT,
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  last_scraped_message_id   BIGINT,
  last_scraped_at           TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE telegram_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY telegram_channels_admin ON telegram_channels
  FOR ALL USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ── 2. extraction_logs ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS extraction_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id        UUID NOT NULL REFERENCES telegram_channels(id) ON DELETE CASCADE,
  extraction_start  TIMESTAMPTZ,
  extraction_end    TIMESTAMPTZ,
  messages_fetched  INTEGER DEFAULT 0,
  lessons_created   INTEGER DEFAULT 0,
  lessons_skipped   INTEGER DEFAULT 0,
  errors            INTEGER DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'success',   -- success | partial_success | failed
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extraction_logs_channel_id ON extraction_logs (channel_id);
CREATE INDEX IF NOT EXISTS idx_extraction_logs_created_at ON extraction_logs (created_at DESC);

ALTER TABLE extraction_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY extraction_logs_admin ON extraction_logs
  FOR ALL USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ── 3. Extend lessons table ───────────────────────────────────────────

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS telegram_channel_id   UUID REFERENCES telegram_channels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS telegram_message_id   BIGINT,
  ADD COLUMN IF NOT EXISTS telegram_message_url  TEXT,
  ADD COLUMN IF NOT EXISTS is_auto_imported       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_imported_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_import_raw        TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_telegram_message
  ON lessons (telegram_channel_id, telegram_message_id)
  WHERE telegram_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_auto_imported ON lessons (is_auto_imported) WHERE is_auto_imported = true;
