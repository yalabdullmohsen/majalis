-- Digital Islamic Learning Platform v1
-- Learning paths, progress, quizzes, certificates, calendar, library, notifications

-- ── Learning paths ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  title_en text,
  description text,
  level text NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  category text,
  icon text,
  sort_order int DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  estimated_hours int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  module_type text NOT NULL DEFAULT 'lesson' CHECK (module_type IN ('lesson', 'book', 'lecture', 'quiz', 'task', 'video')),
  content_kind text,
  content_id text,
  content_url text,
  duration_minutes int DEFAULT 0,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_modules_path ON learning_modules(path_id, sort_order);

-- ── User enrollments & progress ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_path_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress_pct numeric(5,2) DEFAULT 0,
  last_module_id uuid REFERENCES learning_modules(id),
  UNIQUE(user_id, path_id)
);

CREATE TABLE IF NOT EXISTS user_module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_pct numeric(5,2) DEFAULT 0,
  last_seen_at timestamptz,
  completed_at timestamptz,
  notes text,
  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_user_module_progress_user ON user_module_progress(user_id, path_id);

-- ── Extended quiz system ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid REFERENCES learning_paths(id) ON DELETE SET NULL,
  module_id uuid REFERENCES learning_modules(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  section text,
  level text DEFAULT 'beginner',
  passing_score int DEFAULT 70,
  time_limit_minutes int,
  status text DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES learning_quizzes(id) ON DELETE CASCADE,
  sort_order int DEFAULT 0,
  question_type text NOT NULL DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice', 'true_false', 'ordering', 'matching', 'text')),
  question text NOT NULL,
  options jsonb,
  correct_answer jsonb NOT NULL,
  explanation text,
  reference_source text,
  reference_url text,
  points int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES learning_quizzes(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL,
  total_points int NOT NULL,
  earned_points int NOT NULL,
  passed boolean DEFAULT false,
  answers jsonb,
  error_analysis jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON learning_quiz_attempts(user_id, quiz_id);

-- ── Certificates ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  certificate_code text UNIQUE NOT NULL,
  title text NOT NULL,
  score_pct numeric(5,2),
  issued_at timestamptz DEFAULT now(),
  qr_data text,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_certificates_code ON learning_certificates(certificate_code);

-- ── Personal library ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_learning_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('book', 'lesson', 'hadith', 'fatwa', 'note', 'search')),
  content_id text,
  title text NOT NULL,
  content_url text,
  notes text,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_type, content_id)
);

CREATE TABLE IF NOT EXISTS user_learning_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid REFERENCES learning_modules(id) ON DELETE SET NULL,
  path_id uuid REFERENCES learning_paths(id) ON DELETE SET NULL,
  title text,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Weekly plans ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_weekly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  goals jsonb DEFAULT '[]',
  completed jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- ── Achievements (extend existing) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_learning_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  title text NOT NULL,
  description text,
  earned_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id, achievement_key)
);

-- ── Calendar events ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL CHECK (event_type IN ('lesson', 'course', 'lecture', 'conference', 'occasion')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text,
  content_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_calendar_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES learning_calendar_events(id) ON DELETE CASCADE,
  subscribed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- ── Learning notifications ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text UNIQUE NOT NULL,
  title_template text NOT NULL,
  body_template text,
  is_active boolean DEFAULT true
);

-- ── AI lesson summaries (metadata only, no religious text generation) ──────
CREATE TABLE IF NOT EXISTS learning_ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  module_id uuid REFERENCES learning_modules(id) ON DELETE CASCADE,
  summary text,
  key_points jsonb DEFAULT '[]',
  review_questions jsonb DEFAULT '[]',
  suggested_next jsonb DEFAULT '[]',
  suggested_books jsonb DEFAULT '[]',
  suggested_courses jsonb DEFAULT '[]',
  source_content_hash text,
  created_at timestamptz DEFAULT now()
);

-- ── RLS policies ───────────────────────────────────────────────────────────
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_path_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_calendar_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_ai_summaries ENABLE ROW LEVEL SECURITY;

-- Public read for published paths/modules/quizzes
CREATE POLICY IF NOT EXISTS learning_paths_public_read ON learning_paths FOR SELECT USING (status = 'published');
CREATE POLICY IF NOT EXISTS learning_modules_public_read ON learning_modules FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS learning_quizzes_public_read ON learning_quizzes FOR SELECT USING (status = 'published');
CREATE POLICY IF NOT EXISTS learning_quiz_questions_public_read ON learning_quiz_questions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS learning_calendar_public_read ON learning_calendar_events FOR SELECT USING (is_public = true);
CREATE POLICY IF NOT EXISTS learning_certificates_verify ON learning_certificates FOR SELECT USING (true);

-- User-owned data
CREATE POLICY IF NOT EXISTS user_enrollments_own ON user_path_enrollments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS user_progress_own ON user_module_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS user_quiz_attempts_own ON learning_quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS user_certificates_own ON learning_certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS user_library_own ON user_learning_library FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS user_notes_own ON user_learning_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS user_weekly_own ON user_weekly_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS user_achievements_own ON user_learning_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS user_calendar_sub_own ON user_calendar_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS user_ai_summaries_own ON learning_ai_summaries FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- ── Seed learning paths ────────────────────────────────────────────────────
INSERT INTO learning_paths (slug, title, title_en, description, level, category, sort_order, estimated_hours) VALUES
  ('aqeedah', 'العقيدة', 'Aqeedah', 'مسار شامل في العقيدة الإسلامية الصحيحة', 'beginner', 'aqeedah', 1, 40),
  ('tawheed', 'التوحيد', 'Tawheed', 'دراسة التوحيد وإقامة الدليل عليه', 'beginner', 'aqeedah', 2, 30),
  ('hadith', 'الحديث', 'Hadith', 'علم الحديث النبوي ودراسة الأحاديث', 'intermediate', 'hadith', 3, 50),
  ('mustalah-hadith', 'مصطلح الحديث', 'Hadith Terminology', 'مصطلحات علم الحديث وأقسامه', 'intermediate', 'hadith', 4, 35),
  ('fiqh', 'الفقه', 'Fiqh', 'أصول الأحكام الشرعية العملية', 'beginner', 'fiqh', 5, 60),
  ('usool-fiqh', 'أصول الفقه', 'Principles of Fiqh', 'قواعد استنباط الأحكام', 'advanced', 'fiqh', 6, 45),
  ('tafseer', 'التفسير', 'Tafseer', 'تفسير كتاب الله تعالى', 'intermediate', 'quran', 7, 55),
  ('uloom-quran', 'علوم القرآن', 'Quranic Sciences', 'علوم القرآن ومعرفة نزوله وتأويله', 'intermediate', 'quran', 8, 40),
  ('seerah', 'السيرة', 'Seerah', 'سيرة النبي ﷺ وتاريخ الدعوة', 'beginner', 'seerah', 9, 35),
  ('adab', 'الآداب', 'Islamic Etiquette', 'آداب الإسلام في الحياة اليومية', 'beginner', 'akhlaq', 10, 25),
  ('akhlaq', 'الأخلاق', 'Ethics', 'تهذيب النفس وبناء الخُلُق', 'beginner', 'akhlaq', 11, 25),
  ('arabic', 'اللغة العربية', 'Arabic Language', 'أساسيات اللغة العربية للطالب العلمي', 'beginner', 'language', 12, 40),
  ('nahw', 'النحو', 'Arabic Grammar', 'قواعد النحو العربي', 'intermediate', 'language', 13, 45),
  ('dawah', 'الدعوة', 'Dawah', 'آداب الدعوة إلى الله ووسائلها', 'intermediate', 'dawah', 14, 30),
  ('tarbiyah', 'التربية', 'Islamic Education', 'التربية الإسلامية وبناء الشخصية', 'intermediate', 'tarbiyah', 15, 35)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  updated_at = now();

-- Seed notification rules
INSERT INTO learning_notification_rules (rule_key, title_template, body_template) VALUES
  ('new_lesson', 'درس جديد', 'تم إضافة درس جديد في مسار {{path}}'),
  ('new_book', 'كتاب جديد', 'تم إضافة كتاب جديد في المكتبة'),
  ('new_fatwa', 'فتوى جديدة', 'تم نشر فتوى جديدة'),
  ('new_fiqh_decision', 'قرار فقهي', 'قرار جديد من المجمع الفقهي'),
  ('daily_hadith', 'حديث اليوم', 'حديث اليوم جاهز للقراءة'),
  ('daily_ayah', 'آية اليوم', 'آية اليوم جاهزة للتدبر'),
  ('daily_dhikr', 'ذكر اليوم', 'ذكر اليوم'),
  ('course_ending', 'انتهاء دورة', 'تقترب دورتك من الانتهاء'),
  ('lecture_reminder', 'محاضرة قريبة', 'محاضرة قادمة خلال 24 ساعة')
ON CONFLICT (rule_key) DO NOTHING;

-- ── Stats RPC ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION learning_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'paths_count', (SELECT count(*) FROM learning_paths WHERE status = 'published'),
    'modules_count', (SELECT count(*) FROM learning_modules),
    'quizzes_count', (SELECT count(*) FROM learning_quizzes WHERE status = 'published'),
    'certificates_count', (SELECT count(*) FROM learning_certificates),
    'enrollments_count', (SELECT count(*) FROM user_path_enrollments),
    'completed_paths', (SELECT count(*) FROM user_path_enrollments WHERE completed_at IS NOT NULL),
    'quiz_attempts_count', (SELECT count(*) FROM learning_quiz_attempts)
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION learning_platform_stats() TO authenticated, anon;

GRANT SELECT ON learning_paths TO authenticated, anon;
GRANT SELECT ON learning_modules TO authenticated, anon;
GRANT SELECT ON learning_quizzes TO authenticated, anon;
GRANT SELECT ON learning_quiz_questions TO authenticated, anon;
GRANT SELECT ON learning_calendar_events TO authenticated, anon;
GRANT SELECT ON learning_certificates TO authenticated, anon;
