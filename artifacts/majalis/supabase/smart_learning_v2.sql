-- ═══════════════════════════════════════════════════════════════
--  المرحلة 2 — التعلّم الذكي
--  smart_learning_v2.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── خطة التعلّم الشخصية ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_learning_plans (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level          TEXT        NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  interests      TEXT[]      NOT NULL DEFAULT '{}',
  daily_minutes  INT         NOT NULL DEFAULT 30,
  plan_items     JSONB       NOT NULL DEFAULT '[]',
  -- plan_items: [{ type:'lesson'|'book'|'path', id:TEXT, title:TEXT, url:TEXT, category:TEXT, done:bool }]
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_learning_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ulp_own ON user_learning_plans;
CREATE POLICY ulp_own ON user_learning_plans
  FOR ALL USING (auth.uid() = user_id);

-- ─── تقدّم مراجعة البطاقات (Spaced Repetition) ───────────────
-- البطاقات نفسها تُشتق من verified_hadith_items + lesson_registrations
-- هذا الجدول يتتبع تقدّم المراجعة لكل مستخدم
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type      TEXT        NOT NULL,  -- 'hadith' | 'lesson'
  card_id        TEXT        NOT NULL,  -- معرّف المصدر (hadith id, lesson id)
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  interval_days  INT         NOT NULL DEFAULT 1,
  ease_factor    FLOAT       NOT NULL DEFAULT 2.5,
  repetitions    INT         NOT NULL DEFAULT 0,
  last_quality   INT,                  -- 0-5 (SM-2 quality rating)
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_type, card_id)
);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_due
  ON flashcard_reviews (user_id, next_review_at ASC);

ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fcr_own ON flashcard_reviews;
CREATE POLICY fcr_own ON flashcard_reviews
  FOR ALL USING (auth.uid() = user_id);
