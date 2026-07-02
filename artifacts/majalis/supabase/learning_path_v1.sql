-- ═══════════════════════════════════════════════════════════════════════════
-- خارطة طالب العلم — Learning Path System v1
-- جداول بادئة lp_ لتجنب التعارض مع جداول digital_learning القائمة
-- ═══════════════════════════════════════════════════════════════════════════

-- ── العلوم الشرعية ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lp_sciences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  description text,
  why_study   text,
  icon        text DEFAULT '📚',
  color       text DEFAULT '#059669',
  sort_order  int  DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lp_sciences_slug ON lp_sciences(slug);
CREATE INDEX IF NOT EXISTS idx_lp_sciences_order ON lp_sciences(sort_order);

-- ── المستويات ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lp_levels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  description text,
  color       text DEFAULT '#6366f1',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lp_levels_order ON lp_levels(sort_order);

-- ── الكتب ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lp_books (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  author           text,
  science_id       uuid NOT NULL REFERENCES lp_sciences(id) ON DELETE CASCADE,
  level_id         uuid NOT NULL REFERENCES lp_levels(id)   ON DELETE CASCADE,
  cover_image_url  text,
  summary          text,
  difficulty       text DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  estimated_hours  int  DEFAULT 0,
  pages_count      int  DEFAULT 0,
  pdf_url          text,
  audio_url        text,
  order_in_level   int  DEFAULT 0,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lp_books_science ON lp_books(science_id);
CREATE INDEX IF NOT EXISTS idx_lp_books_level   ON lp_books(level_id);
CREATE INDEX IF NOT EXISTS idx_lp_books_order   ON lp_books(science_id, level_id, order_in_level);

-- ── شروحات الكتب ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lp_explanations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     uuid NOT NULL REFERENCES lp_books(id) ON DELETE CASCADE,
  sheikh_name text NOT NULL,
  type        text NOT NULL DEFAULT 'audio' CHECK (type IN ('audio','video','text')),
  url         text,
  notes       text,
  sort_order  int  DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lp_explanations_book ON lp_explanations(book_id);

-- ── فوائد الكتاب ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lp_book_benefits (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id    uuid NOT NULL REFERENCES lp_books(id) ON DELETE CASCADE,
  content    text NOT NULL,
  sort_order int  DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lp_benefits_book ON lp_book_benefits(book_id);

-- ── اختبارات الكتاب ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lp_quizzes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id        uuid NOT NULL REFERENCES lp_books(id) ON DELETE CASCADE,
  question       text NOT NULL,
  options        jsonb NOT NULL DEFAULT '[]',
  correct_answer text NOT NULL,
  explanation    text,
  sort_order     int  DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lp_quizzes_book ON lp_quizzes(book_id);

-- ── تقدم المستخدم ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lp_user_progress (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id          uuid NOT NULL REFERENCES lp_books(id)   ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'not_started'
                   CHECK (status IN ('not_started','in_progress','completed')),
  progress_percent int  DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  started_at       timestamptz,
  completed_at     timestamptz,
  updated_at       timestamptz DEFAULT now(),
  UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_progress_user   ON lp_user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_progress_book   ON lp_user_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_lp_progress_status ON lp_user_progress(user_id, status);

-- ── الإنجازات ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lp_achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_name  text NOT NULL,
  badge_icon  text DEFAULT '🏆',
  badge_color text DEFAULT '#f59e0b',
  earned_at   timestamptz DEFAULT now(),
  science_id  uuid REFERENCES lp_sciences(id) ON DELETE SET NULL,
  UNIQUE (user_id, badge_name)
);

CREATE INDEX IF NOT EXISTS idx_lp_achievements_user ON lp_achievements(user_id);

-- ── الأيام المتتالية (Streaks) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lp_streaks (
  user_id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak       int  DEFAULT 0,
  longest_streak       int  DEFAULT 0,
  last_activity_date   date,
  updated_at           timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE lp_sciences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_levels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_books        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_book_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_quizzes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_streaks      ENABLE ROW LEVEL SECURITY;

-- علوم / مستويات / كتب / شروحات / فوائد / اختبارات — قراءة عامة
DROP POLICY IF EXISTS "lp_sciences_public_read"      ON lp_sciences;
DROP POLICY IF EXISTS "lp_levels_public_read"        ON lp_levels;
DROP POLICY IF EXISTS "lp_books_public_read"         ON lp_books;
DROP POLICY IF EXISTS "lp_explanations_public_read"  ON lp_explanations;
DROP POLICY IF EXISTS "lp_benefits_public_read"      ON lp_book_benefits;
DROP POLICY IF EXISTS "lp_quizzes_public_read"       ON lp_quizzes;

CREATE POLICY "lp_sciences_public_read"     ON lp_sciences     FOR SELECT USING (is_active = true);
CREATE POLICY "lp_levels_public_read"       ON lp_levels       FOR SELECT USING (true);
CREATE POLICY "lp_books_public_read"        ON lp_books        FOR SELECT USING (is_active = true);
CREATE POLICY "lp_explanations_public_read" ON lp_explanations FOR SELECT USING (true);
CREATE POLICY "lp_benefits_public_read"     ON lp_book_benefits FOR SELECT USING (true);
CREATE POLICY "lp_quizzes_public_read"      ON lp_quizzes      FOR SELECT USING (true);

-- تقدم المستخدم — يرى ويعدل سجلاته فقط
DROP POLICY IF EXISTS "lp_progress_own_read"  ON lp_user_progress;
DROP POLICY IF EXISTS "lp_progress_own_write" ON lp_user_progress;

CREATE POLICY "lp_progress_own_read"  ON lp_user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lp_progress_own_write" ON lp_user_progress FOR ALL    USING (auth.uid() = user_id);

-- إنجازات — يرى سجلاته فقط
DROP POLICY IF EXISTS "lp_achievements_own_read"  ON lp_achievements;

CREATE POLICY "lp_achievements_own_read"  ON lp_achievements FOR SELECT USING (auth.uid() = user_id);

-- streaks — يرى ويعدل سجله فقط
DROP POLICY IF EXISTS "lp_streaks_own_all" ON lp_streaks;

CREATE POLICY "lp_streaks_own_all" ON lp_streaks FOR ALL USING (auth.uid() = user_id);

-- إدراج الإنجازات وتحديث الـ streaks يتم عبر service_role (الـ API)
DROP POLICY IF EXISTS "lp_achievements_service_insert" ON lp_achievements;
DROP POLICY IF EXISTS "lp_streaks_service_write"       ON lp_streaks;

CREATE POLICY "lp_achievements_service_insert" ON lp_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "lp_streaks_service_write"       ON lp_streaks      FOR ALL   USING (true);
