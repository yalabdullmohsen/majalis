-- سؤال وجواب v2 — Personal progress, zero-repeat history, achievements
-- Run after sin_jeem_v1.sql + sin_jeem_v1_2_types.sql

CREATE TABLE IF NOT EXISTS sin_jeem_player_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id uuid REFERENCES sin_jeem_players(id) ON DELETE SET NULL,
  display_name text,
  xp int NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  title text DEFAULT 'طالب علم',
  completion_pct numeric(5,2) NOT NULL DEFAULT 0,
  mastery_score numeric(5,2) NOT NULL DEFAULT 0,
  accuracy_pct numeric(5,2) NOT NULL DEFAULT 0,
  avg_response_ms int NOT NULL DEFAULT 0,
  knowledge_rating numeric(6,2) NOT NULL DEFAULT 1000,
  adaptive_difficulty text NOT NULL DEFAULT 'متوسط'
    CHECK (adaptive_difficulty IN ('مبتدئ', 'سهل', 'متوسط', 'متقدم', 'خبير')),
  daily_streak int NOT NULL DEFAULT 0,
  weekly_streak int NOT NULL DEFAULT 0,
  monthly_streak int NOT NULL DEFAULT 0,
  win_streak int NOT NULL DEFAULT 0,
  last_played_date date,
  cycle_number int NOT NULL DEFAULT 0,
  questions_seen_total int NOT NULL DEFAULT 0,
  country_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sin_jeem_player_profiles_level_idx ON sin_jeem_player_profiles(level DESC);
CREATE INDEX IF NOT EXISTS sin_jeem_player_profiles_xp_idx ON sin_jeem_player_profiles(xp DESC);

CREATE TABLE IF NOT EXISTS sin_jeem_player_question_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  first_shown_at timestamptz NOT NULL DEFAULT now(),
  last_shown_at timestamptz NOT NULL DEFAULT now(),
  attempts int NOT NULL DEFAULT 0,
  correct_count int NOT NULL DEFAULT 0,
  wrong_count int NOT NULL DEFAULT 0,
  skip_count int NOT NULL DEFAULT 0,
  avg_response_ms int NOT NULL DEFAULT 0,
  difficulty_reached text DEFAULT 'متوسط',
  mastery_level int NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  cycle_seen int NOT NULL DEFAULT 1,
  UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS sin_jeem_pqs_user_idx ON sin_jeem_player_question_stats(user_id);
CREATE INDEX IF NOT EXISTS sin_jeem_pqs_mastery_idx ON sin_jeem_player_question_stats(user_id, mastery_level);

CREATE TABLE IF NOT EXISTS sin_jeem_category_mastery (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_slug text NOT NULL,
  questions_seen int NOT NULL DEFAULT 0,
  questions_total int NOT NULL DEFAULT 0,
  completion_pct numeric(5,2) NOT NULL DEFAULT 0,
  mastery_score numeric(5,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category_slug)
);

ALTER TABLE sin_jeem_leaderboard_entries
  ADD COLUMN IF NOT EXISTS scope text DEFAULT 'global';

ALTER TABLE sin_jeem_leaderboard_entries
  ADD COLUMN IF NOT EXISTS scope_key text DEFAULT 'all';

ALTER TABLE sin_jeem_leaderboard_entries
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE sin_jeem_leaderboard_entries
  ADD COLUMN IF NOT EXISTS accuracy_pct numeric(5,2);

ALTER TABLE sin_jeem_leaderboard_entries
  ADD COLUMN IF NOT EXISTS avg_speed_ms int;

INSERT INTO sin_jeem_achievements (slug, name_ar, description_ar, icon, points_required)
VALUES
  ('first_question', 'أول سؤال', 'أجب على أول سؤال', 'circle-check', 0),
  ('ten_correct', '10 إجابات صحيحة', 'حقق 10 إجابات صحيحة', 'target', 10),
  ('hundred_correct', '100 إجابة صحيحة', 'حقق 100 إجابة صحيحة', 'medal', 100),
  ('thousand_correct', '1000 إجابة صحيحة', 'حقق 1000 إجابة صحيحة', 'crown', 1000),
  ('perfect_round', 'جولة مثالية', 'أجب على كل الأسئلة بشكل صحيح', 'sparkles', 0),
  ('streak_7', 'سلسلة 7 أيام', 'العب 7 أيام متتالية', 'flame', 0),
  ('streak_30', 'سلسلة 30 يوماً', 'العب 30 يوماً متتالياً', 'flame', 0),
  ('master_hadith', 'متقن الحديث', 'أتقن فئة الحديث', 'book-open', 0),
  ('master_fiqh', 'متقن الفقه', 'أتقن فئة الفقه', 'scale', 0),
  ('master_aqeeda', 'متقن العقيدة', 'أتقن فئة العقيدة', 'star', 0),
  ('quran_expert', 'خبير القرآن', 'أتقن فئة القرآن', 'book-open', 0),
  ('fast_thinker', 'سريع البديهة', 'متوسط زمن إجابة أقل من 5 ثوانٍ', 'zap', 0),
  ('knowledge_champion', 'بطل المعرفة', 'تصدر لوحة الشرف', 'trophy', 0)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE sin_jeem_player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_player_question_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_category_mastery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sin_jeem_profiles_own" ON sin_jeem_player_profiles;
CREATE POLICY "sin_jeem_profiles_own" ON sin_jeem_player_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sin_jeem_pqs_own" ON sin_jeem_player_question_stats;
CREATE POLICY "sin_jeem_pqs_own" ON sin_jeem_player_question_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sin_jeem_cat_mastery_own" ON sin_jeem_category_mastery;
CREATE POLICY "sin_jeem_cat_mastery_own" ON sin_jeem_category_mastery
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sin_jeem_profiles_read" ON sin_jeem_player_profiles;
CREATE POLICY "sin_jeem_profiles_read" ON sin_jeem_player_profiles FOR SELECT USING (true);
