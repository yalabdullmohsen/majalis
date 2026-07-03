-- Migration: Telegram Channel Monitoring Platform
-- Tables: tg_monitored_channels, tg_raw_messages, tg_extracted_lessons, tg_dedup_hashes
-- Safe to re-run (IF NOT EXISTS everywhere)

-- ── القنوات المراقبة ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tg_monitored_channels (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_username    text        UNIQUE NOT NULL,   -- @channelname بدون @
  channel_id          bigint,                         -- Telegram internal ID
  channel_title       text,
  is_active           boolean     NOT NULL DEFAULT true,
  auto_extract        boolean     NOT NULL DEFAULT true,
  auto_publish        boolean     NOT NULL DEFAULT false,
  last_message_at     timestamptz,
  last_sync_at        timestamptz,
  total_messages      int         NOT NULL DEFAULT 0,
  total_lessons       int         NOT NULL DEFAULT 0,
  total_rejected      int         NOT NULL DEFAULT 0,
  total_duplicates    int         NOT NULL DEFAULT 0,
  last_error          text,
  config              jsonb       NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_channels_active     ON tg_monitored_channels(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tg_channels_username   ON tg_monitored_channels(channel_username);

-- ── الرسائل الخام ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tg_raw_messages (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id              uuid        REFERENCES tg_monitored_channels(id) ON DELETE SET NULL,
  telegram_message_id     bigint      NOT NULL,
  telegram_channel_id     bigint,
  channel_username        text,
  raw_text                text,
  raw_caption             text,
  photo_file_ids          jsonb       DEFAULT '[]',
  document_file_id        text,
  entities                jsonb       DEFAULT '[]',
  forwarded_from          text,
  message_date            timestamptz NOT NULL,
  extraction_status       text        NOT NULL DEFAULT 'pending',
  -- pending | processing | done | failed | skipped
  extraction_attempts     int         NOT NULL DEFAULT 0,
  last_attempt_at         timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(telegram_channel_id, telegram_message_id)
);

CREATE INDEX IF NOT EXISTS idx_tg_raw_extraction_status ON tg_raw_messages(extraction_status) WHERE extraction_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tg_raw_channel_id        ON tg_raw_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_tg_raw_message_date      ON tg_raw_messages(message_date DESC);

-- ── الدروس المستخرجة ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tg_extracted_lessons (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_message_id      uuid        REFERENCES tg_raw_messages(id) ON DELETE SET NULL,
  channel_id          uuid        REFERENCES tg_monitored_channels(id) ON DELETE SET NULL,

  -- حقول مستخرجة
  title               text,
  sheikh_name         text,
  category            text,
  event_date          date,
  event_day           text,
  event_time          text,
  timezone            text        DEFAULT 'Asia/Kuwait',
  mosque              text,
  area                text,
  city                text,
  governorate         text,
  country             text        DEFAULT 'الكويت',
  stream_url          text,
  location_url        text,
  contact             text,
  organizer           text,
  co_organizer        text,
  has_womens_section  boolean,
  description         text,
  image_url           text,
  thumbnail_url       text,

  -- الجودة
  quality_score       float       DEFAULT 0,
  quality_status      text        DEFAULT 'needs_review',
  -- complete | needs_review | incomplete | duplicate | rejected
  quality_reason      text,
  confidence_scores   jsonb       DEFAULT '{}',

  -- بيانات AI
  ai_model            text,
  ai_prompt_tokens    int,
  ai_completion_tokens int,

  -- روابط لبيانات موجودة
  speaker_id          uuid,
  mosque_id           uuid,

  -- حالة المراجعة
  review_status       text        DEFAULT 'pending',
  -- pending | approved | rejected | published
  reviewed_by         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at         timestamptz,
  published_lesson_id uuid,
  is_duplicate_of     uuid        REFERENCES tg_extracted_lessons(id) ON DELETE SET NULL,
  reject_reason       text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_lessons_review_status  ON tg_extracted_lessons(review_status);
CREATE INDEX IF NOT EXISTS idx_tg_lessons_quality_status ON tg_extracted_lessons(quality_status);
CREATE INDEX IF NOT EXISTS idx_tg_lessons_channel_id     ON tg_extracted_lessons(channel_id);
CREATE INDEX IF NOT EXISTS idx_tg_lessons_created_at     ON tg_extracted_lessons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tg_lessons_sheikh         ON tg_extracted_lessons(sheikh_name) WHERE sheikh_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tg_lessons_event_date     ON tg_extracted_lessons(event_date) WHERE event_date IS NOT NULL;

-- ── هاشات إزالة التكرار ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tg_dedup_hashes (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  extracted_lesson_id uuid        REFERENCES tg_extracted_lessons(id) ON DELETE CASCADE,
  hash                text        UNIQUE NOT NULL,
  hash_type           text        NOT NULL DEFAULT 'content',
  -- content | image | title+date+sheikh
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_dedup_hash ON tg_dedup_hashes(hash);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE tg_monitored_channels  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tg_raw_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tg_extracted_lessons   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tg_dedup_hashes        ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tg_monitored_channels' AND policyname='srole_all') THEN
    CREATE POLICY srole_all ON tg_monitored_channels FOR ALL TO service_role USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tg_raw_messages' AND policyname='srole_all') THEN
    CREATE POLICY srole_all ON tg_raw_messages FOR ALL TO service_role USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tg_extracted_lessons' AND policyname='srole_all') THEN
    CREATE POLICY srole_all ON tg_extracted_lessons FOR ALL TO service_role USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tg_dedup_hashes' AND policyname='srole_all') THEN
    CREATE POLICY srole_all ON tg_dedup_hashes FOR ALL TO service_role USING (true);
  END IF;
END $$;
