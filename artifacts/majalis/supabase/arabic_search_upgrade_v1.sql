-- ====================================================================
--  مجالس العلم — ترقية البحث العربي + جدول تقدم المستخدم
--  الإصدار 1 — 2026-07-10
-- ====================================================================

-- ─── 1. تفعيل pg_trgm (آمن إن كانت مفعّلة) ────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── 2. دالة التطبيع العربي الشامل ─────────────────────────────────
CREATE OR REPLACE FUNCTION normalize_ar(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE STRICT
AS $$
  SELECT LOWER(
    TRANSLATE(
      REGEXP_REPLACE(COALESCE(input, ''), '[ً-ٰٟـ]', '', 'g'),
      'أإآٱؤئةى',
      'ااااوييهي'
    )
  );
$$;

-- ─── 3. عمود بحث منسَّق في جدول lessons ────────────────────────────
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS search_ar text
    GENERATED ALWAYS AS (
      normalize_ar(title || ' ' || COALESCE(description, '') || ' ' || COALESCE(speaker_name, ''))
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_lessons_search_trgm
  ON lessons USING GIN (search_ar gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_lessons_published_at
  ON lessons (is_active DESC, scheduled_at DESC NULLS LAST)
  WHERE is_active = true;

-- ─── 4. فهارس GIN لجدول qa_questions ────────────────────────────────
ALTER TABLE qa_questions
  ADD COLUMN IF NOT EXISTS search_ar text
    GENERATED ALWAYS AS (
      normalize_ar(question || ' ' || COALESCE(answer, ''))
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_qa_search_trgm
  ON qa_questions USING GIN (search_ar gin_trgm_ops);

-- ─── 5. فهارس GIN لجدول fawaid ───────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fawaid') THEN
    ALTER TABLE fawaid
      ADD COLUMN IF NOT EXISTS search_ar text
        GENERATED ALWAYS AS (
          normalize_ar(COALESCE(title,'') || ' ' || COALESCE(text,'') || ' ' || COALESCE(source,''))
        ) STORED;
    CREATE INDEX IF NOT EXISTS idx_fawaid_search_trgm
      ON fawaid USING GIN (search_ar gin_trgm_ops);
  END IF;
END $$;

-- ─── 6. فهارس GIN لجدول akp_stories ─────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'akp_stories') THEN
    ALTER TABLE akp_stories
      ADD COLUMN IF NOT EXISTS search_ar text
        GENERATED ALWAYS AS (
          normalize_ar(title || ' ' || COALESCE(summary,'') || ' ' || COALESCE(category,''))
        ) STORED;
    CREATE INDEX IF NOT EXISTS idx_akp_stories_search_trgm
      ON akp_stories USING GIN (search_ar gin_trgm_ops);
  END IF;
END $$;

-- ─── 7. فهارس إضافية للأداء ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lessons_title_trgm
  ON lessons USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_qa_question_trgm
  ON qa_questions USING GIN (question gin_trgm_ops);

-- ─── 8. جدول تقدم المستخدم العام ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_progress (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type  text NOT NULL
                CHECK (content_type IN ('lesson','course','quran','lesson_detail')),
  content_id    text NOT NULL,          -- lesson_id أو course_id أو رقم صفحة القرآن
  content_title text,
  content_url   text,
  progress_pct  int  DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  last_position jsonb DEFAULT '{}',      -- موضع مرن: { page, second, position }
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, content_type, content_id)
);

-- فهارس الجدول
CREATE INDEX IF NOT EXISTS idx_up_user_updated
  ON user_progress (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_up_user_type
  ON user_progress (user_id, content_type);

-- RLS — المستخدم يرى/يعدّل سجلاته فقط
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS up_select_own ON user_progress;
CREATE POLICY up_select_own ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS up_insert_own ON user_progress;
CREATE POLICY up_insert_own ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS up_update_own ON user_progress;
CREATE POLICY up_update_own ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS up_delete_own ON user_progress;
CREATE POLICY up_delete_own ON user_progress
  FOR DELETE USING (auth.uid() = user_id);

-- دالة upsert تحديث التقدم (آمنة من سباق الكتابة)
CREATE OR REPLACE FUNCTION upsert_user_progress(
  p_user_id      uuid,
  p_content_type text,
  p_content_id   text,
  p_title        text,
  p_url          text,
  p_progress     int,
  p_position     jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_progress
    (user_id, content_type, content_id, content_title, content_url, progress_pct, last_position, updated_at)
  VALUES
    (p_user_id, p_content_type, p_content_id, p_title, p_url, p_progress, p_position, now())
  ON CONFLICT (user_id, content_type, content_id)
  DO UPDATE SET
    content_title = EXCLUDED.content_title,
    content_url   = EXCLUDED.content_url,
    progress_pct  = EXCLUDED.progress_pct,
    last_position = EXCLUDED.last_position,
    updated_at    = now();
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_user_progress TO authenticated;

-- ─── 9. جدول تقدم المصحف ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_quran_position (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  page        int  NOT NULL DEFAULT 1 CHECK (page BETWEEN 1 AND 604),
  juz         int  DEFAULT 1,
  surah       int  DEFAULT 1,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE user_quran_position ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS uqp_all_own ON user_quran_position;
CREATE POLICY uqp_all_own ON user_quran_position
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- انتهى — نجح التطبيق
