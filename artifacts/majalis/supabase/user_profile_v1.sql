-- ═══════════════════════════════════════════════════════════════════
--  المرحلة 1 — هوية المستخدم والتقدم
--  user_profile_v1.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── جدول مواضع الاستئناف (Kindle-style resume) ──────────────────
-- منفصل عن bookmarks: هذه مواضع تلقائية لا نية مقصودة
CREATE TABLE IF NOT EXISTS reading_resume (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type   TEXT        NOT NULL,  -- 'lesson' | 'book' | 'article' | 'path' | 'hadith' | 'fatwa'
  content_id     TEXT        NOT NULL,
  content_title  TEXT,
  content_url    TEXT,
  thumbnail_icon TEXT,                  -- emoji أو اختصار نوع المحتوى
  position       JSONB       NOT NULL DEFAULT '{}',
  -- position: { pct: 0-100, section: "الفصل الثالث", item_index: 12, scroll_y: 2340 }
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_resume_user
  ON reading_resume (user_id, last_opened_at DESC);

ALTER TABLE reading_resume ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reading_resume_own ON reading_resume;
CREATE POLICY reading_resume_own ON reading_resume
  FOR ALL USING (auth.uid() = user_id);

-- ─── عمود reading_position على bookmarks (لحفظ موضع المفضّلة) ────
ALTER TABLE bookmarks
  ADD COLUMN IF NOT EXISTS reading_position JSONB DEFAULT '{}';

-- ─── فهرس سريع على achievements للاستعلام بالمفتاح ─────────────
CREATE INDEX IF NOT EXISTS idx_achievements_key
  ON achievements (user_id, achievement_key);
