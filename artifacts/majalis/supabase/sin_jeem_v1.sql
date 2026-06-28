-- سين وجيم — Majlis Ilm Challenge Game Schema v1
-- Run in Supabase SQL Editor

-- ── Categories ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sin_jeem_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  icon text,
  parent_slug text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sin_jeem_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES sin_jeem_categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name_ar text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  UNIQUE (category_id, slug)
);

-- ── Questions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sin_jeem_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES sin_jeem_categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES sin_jeem_subcategories(id) ON DELETE SET NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice'
    CHECK (question_type IN (
      'multiple_choice', 'true_false', 'complete_verse', 'complete_hadith',
      'who_said', 'order_events', 'match', 'image_choice', 'mosque_choice',
      'companion_choice', 'scholar_choice', 'battle_choice', 'first_last',
      'count', 'ruling', 'pillar', 'condition', 'wajib', 'sunnah'
    )),
  question text NOT NULL,
  options jsonb,
  correct_index int,
  correct_answer text,
  explanation text,
  difficulty text NOT NULL DEFAULT 'متوسط'
    CHECK (difficulty IN ('مبتدئ', 'سهل', 'متوسط', 'متقدم', 'خبير')),
  keywords text[] DEFAULT '{}',
  image_url text,
  points int NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  source_type text,
  source_id text,
  usage_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sin_jeem_questions_category_idx ON sin_jeem_questions(category_id);
CREATE INDEX IF NOT EXISTS sin_jeem_questions_difficulty_idx ON sin_jeem_questions(difficulty);
CREATE INDEX IF NOT EXISTS sin_jeem_questions_status_idx ON sin_jeem_questions(status);
CREATE INDEX IF NOT EXISTS sin_jeem_questions_keywords_gin ON sin_jeem_questions USING gin(keywords);

-- ── Players & Teams ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sin_jeem_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  avatar_url text,
  total_points int NOT NULL DEFAULT 0,
  games_played int NOT NULL DEFAULT 0,
  games_won int NOT NULL DEFAULT 0,
  best_streak int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sin_jeem_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#1F6E54',
  total_points int NOT NULL DEFAULT 0,
  games_played int NOT NULL DEFAULT 0,
  games_won int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Matches & Rounds ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sin_jeem_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL CHECK (mode IN ('team_vs_team', 'player_vs_player', 'solo', 'daily', 'tournament', 'quick')),
  team_a_id uuid REFERENCES sin_jeem_teams(id) ON DELETE SET NULL,
  team_b_id uuid REFERENCES sin_jeem_teams(id) ON DELETE SET NULL,
  team_a_name text,
  team_b_name text,
  player_a_id uuid REFERENCES sin_jeem_players(id) ON DELETE SET NULL,
  player_b_id uuid REFERENCES sin_jeem_players(id) ON DELETE SET NULL,
  config jsonb NOT NULL DEFAULT '{}',
  difficulty text NOT NULL DEFAULT 'متوسط',
  question_count int NOT NULL DEFAULT 10,
  round_count int NOT NULL DEFAULT 1,
  timer_seconds int NOT NULL DEFAULT 30,
  penalty_wrong boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('setup', 'active', 'completed', 'cancelled')),
  winner_side text CHECK (winner_side IN ('a', 'b', 'draw', 'solo')),
  team_a_score int NOT NULL DEFAULT 0,
  team_b_score int NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sin_jeem_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES sin_jeem_matches(id) ON DELETE CASCADE,
  round_number int NOT NULL,
  question_id uuid REFERENCES sin_jeem_questions(id) ON DELETE SET NULL,
  active_side text CHECK (active_side IN ('a', 'b')),
  time_limit_seconds int NOT NULL DEFAULT 30,
  started_at timestamptz,
  ended_at timestamptz,
  UNIQUE (match_id, round_number)
);

CREATE TABLE IF NOT EXISTS sin_jeem_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES sin_jeem_rounds(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES sin_jeem_matches(id) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('a', 'b')),
  selected_index int,
  selected_text text,
  is_correct boolean,
  points_awarded int NOT NULL DEFAULT 0,
  response_ms int,
  lifeline_used text,
  answered_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sin_jeem_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES sin_jeem_matches(id) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('a', 'b')),
  total_points int NOT NULL DEFAULT 0,
  correct_count int NOT NULL DEFAULT 0,
  wrong_count int NOT NULL DEFAULT 0,
  skipped_count int NOT NULL DEFAULT 0,
  avg_response_ms int,
  UNIQUE (match_id, side)
);

-- ── Achievements & Daily ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sin_jeem_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  description_ar text,
  icon text,
  points_required int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sin_jeem_player_achievements (
  player_id uuid NOT NULL REFERENCES sin_jeem_players(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES sin_jeem_achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS sin_jeem_daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date date NOT NULL UNIQUE,
  question_ids uuid[] NOT NULL DEFAULT '{}',
  difficulty text NOT NULL DEFAULT 'متوسط',
  title_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Tournaments ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sin_jeem_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'quarter', 'semi', 'final', 'completed')),
  bracket jsonb NOT NULL DEFAULT '[]',
  config jsonb NOT NULL DEFAULT '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── History & Reports ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sin_jeem_question_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES sin_jeem_questions(id) ON DELETE CASCADE,
  match_id uuid REFERENCES sin_jeem_matches(id) ON DELETE SET NULL,
  shown_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sin_jeem_question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES sin_jeem_questions(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sin_jeem_ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id text,
  prompt_hash text,
  question_id uuid REFERENCES sin_jeem_questions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Leaderboard view ────────────────────────────────────────────────
CREATE OR REPLACE VIEW sin_jeem_leaderboard AS
  SELECT
    p.id AS player_id,
    p.display_name,
    p.total_points,
    p.games_played,
    p.games_won,
    RANK() OVER (ORDER BY p.total_points DESC) AS rank
  FROM sin_jeem_players p
  WHERE p.games_played > 0
  ORDER BY p.total_points DESC
  LIMIT 100;

-- ── RLS ─────────────────────────────────────────────────────────────
ALTER TABLE sin_jeem_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_question_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sin_jeem_ai_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sin_jeem_categories_read" ON sin_jeem_categories;
CREATE POLICY "sin_jeem_categories_read" ON sin_jeem_categories FOR SELECT USING (status = 'published' OR is_admin());
DROP POLICY IF EXISTS "sin_jeem_categories_admin" ON sin_jeem_categories;
CREATE POLICY "sin_jeem_categories_admin" ON sin_jeem_categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "sin_jeem_questions_read" ON sin_jeem_questions;
CREATE POLICY "sin_jeem_questions_read" ON sin_jeem_questions FOR SELECT USING (status = 'published' OR is_admin());
DROP POLICY IF EXISTS "sin_jeem_questions_admin" ON sin_jeem_questions;
CREATE POLICY "sin_jeem_questions_admin" ON sin_jeem_questions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "sin_jeem_matches_insert" ON sin_jeem_matches;
CREATE POLICY "sin_jeem_matches_insert" ON sin_jeem_matches FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "sin_jeem_matches_read" ON sin_jeem_matches;
CREATE POLICY "sin_jeem_matches_read" ON sin_jeem_matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "sin_jeem_players_read" ON sin_jeem_players;
CREATE POLICY "sin_jeem_players_read" ON sin_jeem_players FOR SELECT USING (true);
DROP POLICY IF EXISTS "sin_jeem_players_write" ON sin_jeem_players;
CREATE POLICY "sin_jeem_players_write" ON sin_jeem_players FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "sin_jeem_daily_read" ON sin_jeem_daily_challenges;
CREATE POLICY "sin_jeem_daily_read" ON sin_jeem_daily_challenges FOR SELECT USING (true);

DROP POLICY IF EXISTS "sin_jeem_tournaments_read" ON sin_jeem_tournaments;
CREATE POLICY "sin_jeem_tournaments_read" ON sin_jeem_tournaments FOR SELECT USING (true);

DROP POLICY IF EXISTS "sin_jeem_ai_admin" ON sin_jeem_ai_generations;
CREATE POLICY "sin_jeem_ai_admin" ON sin_jeem_ai_generations FOR ALL USING (is_admin()) WITH CHECK (is_admin());
