-- bookmarks_v1.sql — جدول المحفوظات الموحّد
-- يدعم أي نوع محتوى (درس، كتاب، حديث، حكم، فتوى…)
-- تم تطبيقه تلقائياً عبر Supabase CLI

CREATE TABLE IF NOT EXISTS bookmarks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type     TEXT        NOT NULL,   -- 'lesson' | 'book' | 'hadith' | 'ruling' | 'qa' | 'fawaid'
  content_id       TEXT        NOT NULL,   -- يقبل UUID أو external_key نصي
  title            TEXT,
  thumbnail        TEXT,
  reading_position JSONB       DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user    ON bookmarks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_content ON bookmarks (content_type, content_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bookmarks_own ON bookmarks;
CREATE POLICY bookmarks_own ON bookmarks
  FOR ALL USING (auth.uid() = user_id);
