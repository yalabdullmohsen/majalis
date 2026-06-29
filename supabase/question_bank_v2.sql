-- Question Bank V2 — Global Quality Edition
-- Run in Supabase SQL Editor after sin_jeem_v1.sql

-- Extend sin_jeem_questions with v2 metadata (idempotent)
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS book_name TEXT;
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS chapter TEXT;
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS evidence TEXT;
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar';
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS last_reviewer_id UUID REFERENCES auth.users(id);
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100);
ALTER TABLE public.sin_jeem_questions ADD COLUMN IF NOT EXISTS workflow_stage TEXT DEFAULT 'draft'
  CHECK (workflow_stage IN ('draft', 'linguistic_review', 'sharia_review', 'final_approval', 'published', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_sin_jeem_questions_content_hash ON public.sin_jeem_questions(content_hash);
CREATE INDEX IF NOT EXISTS idx_sin_jeem_questions_workflow ON public.sin_jeem_questions(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_sin_jeem_questions_category_diff ON public.sin_jeem_questions(category, difficulty);

-- Workflow audit trail
CREATE TABLE IF NOT EXISTS public.question_bank_workflow_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.sin_jeem_questions(id) ON DELETE CASCADE,
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qb_workflow_log_question ON public.question_bank_workflow_log(question_id);

-- Per-user question progress (server-side sync)
CREATE TABLE IF NOT EXISTS public.user_question_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.sin_jeem_questions(id) ON DELETE CASCADE,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_correct BOOLEAN NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_q_progress_user ON public.user_question_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_q_progress_category ON public.user_question_progress(user_id, is_correct);

-- Learning paths
CREATE TABLE IF NOT EXISTS public.learning_paths_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  lesson_ids TEXT[] DEFAULT '{}',
  quiz_question_ids UUID[] DEFAULT '{}',
  final_quiz_question_ids UUID[] DEFAULT '{}',
  certificate_enabled BOOLEAN DEFAULT false,
  max_retries INTEGER DEFAULT 3,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_learning_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES public.learning_paths_v2(id) ON DELETE CASCADE,
  completion_percent INTEGER NOT NULL DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
  lessons_completed TEXT[] DEFAULT '{}',
  quiz_attempts INTEGER DEFAULT 0,
  final_quiz_passed BOOLEAN DEFAULT false,
  certificate_issued_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, path_id)
);

-- Gamification: XP, badges, leaderboards
CREATE TABLE IF NOT EXISTS public.user_game_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_answered INTEGER NOT NULL DEFAULT 0,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  monthly_xp INTEGER NOT NULL DEFAULT 0,
  yearly_xp INTEGER NOT NULL DEFAULT 0,
  week_start DATE,
  month_start DATE,
  year_start INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

CREATE TABLE IF NOT EXISTS public.game_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'duel', 'group', 'tournament')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished', 'cancelled')),
  host_user_id UUID REFERENCES auth.users(id),
  category TEXT,
  question_count INTEGER DEFAULT 10,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.game_challenge_participants (
  challenge_id UUID NOT NULL REFERENCES public.game_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  PRIMARY KEY (challenge_id, user_id)
);

-- RLS
ALTER TABLE public.question_bank_workflow_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_challenge_participants ENABLE ROW LEVEL SECURITY;

-- Published questions: public read
DROP POLICY IF EXISTS "sin_jeem_questions_public_read_v2" ON public.sin_jeem_questions;
CREATE POLICY "sin_jeem_questions_public_read_v2" ON public.sin_jeem_questions
  FOR SELECT USING (status = 'published' AND workflow_stage = 'published');

-- User progress: own data
DROP POLICY IF EXISTS "user_q_progress_own" ON public.user_question_progress;
CREATE POLICY "user_q_progress_own" ON public.user_question_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_game_stats_own" ON public.user_game_stats;
CREATE POLICY "user_game_stats_own" ON public.user_game_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_badges_own" ON public.user_badges;
CREATE POLICY "user_badges_own" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "learning_paths_public" ON public.learning_paths_v2;
CREATE POLICY "learning_paths_public" ON public.learning_paths_v2
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "user_path_progress_own" ON public.user_learning_path_progress;
CREATE POLICY "user_path_progress_own" ON public.user_learning_path_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Leaderboard: public read for stats (anonymized in app)
DROP POLICY IF EXISTS "game_stats_leaderboard_read" ON public.user_game_stats;
CREATE POLICY "game_stats_leaderboard_read" ON public.user_game_stats
  FOR SELECT USING (true);
