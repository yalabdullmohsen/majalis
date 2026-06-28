-- Prayer Rank System v1
-- Gamified prayer tracking: sessions, points, levels, ranks, achievements, streaks

-- ── Individual prayer sessions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_date date NOT NULL,
  prayer_key text NOT NULL CHECK (prayer_key IN ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'missed')),
  place text NOT NULL DEFAULT 'home' CHECK (place IN ('home', 'mosque')),
  congregation boolean NOT NULL DEFAULT false,
  is_first_time boolean NOT NULL DEFAULT false,
  notes text,
  points_earned int NOT NULL DEFAULT 0,
  prayed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, prayer_date, prayer_key)
);

CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_date
  ON prayer_sessions (user_id, prayer_date DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_status
  ON prayer_sessions (user_id, status, prayer_date DESC);

-- ── Aggregated statistics (materialized per user) ──────────────────────────
CREATE TABLE IF NOT EXISTS prayer_statistics (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_prayers int NOT NULL DEFAULT 0,
  total_missed int NOT NULL DEFAULT 0,
  total_mosque int NOT NULL DEFAULT 0,
  total_home int NOT NULL DEFAULT 0,
  total_congregation int NOT NULL DEFAULT 0,
  total_first_time int NOT NULL DEFAULT 0,
  total_points int NOT NULL DEFAULT 0,
  fajr_count int NOT NULL DEFAULT 0,
  full_days_count int NOT NULL DEFAULT 0,
  best_prayer_key text,
  best_week_prayers int NOT NULL DEFAULT 0,
  best_month_prayers int NOT NULL DEFAULT 0,
  monthly_commitment_pct numeric(5,2) NOT NULL DEFAULT 0,
  avg_daily_prayers numeric(5,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Point transactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES prayer_sessions(id) ON DELETE SET NULL,
  reason text NOT NULL,
  points int NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prayer_points_user
  ON prayer_points (user_id, created_at DESC);

-- ── Streak tracking ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_full_day date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── User level state ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_levels (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level int NOT NULL DEFAULT 1,
  total_points int NOT NULL DEFAULT 0,
  points_in_level int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Earned achievements ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  title text NOT NULL,
  description text,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_prayer_achievements_user
  ON prayer_achievements (user_id, earned_at DESC);

-- ── Rank history (30-day evaluation snapshots) ───────────────────────────
CREATE TABLE IF NOT EXISTS prayer_rank_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank_key text NOT NULL,
  rank_label text NOT NULL,
  rank_score numeric(8,2) NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prayer_rank_history_user
  ON prayer_rank_history (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prayer_rank_history_user_period
  ON prayer_rank_history (user_id, period_end);

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_rank_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY prayer_sessions_own ON prayer_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY prayer_statistics_own ON prayer_statistics
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY prayer_points_own ON prayer_points
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY prayer_streaks_own ON prayer_streaks
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY prayer_levels_own ON prayer_levels
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY prayer_achievements_own ON prayer_achievements
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY prayer_rank_history_own ON prayer_rank_history
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Auto-update updated_at ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prayer_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prayer_sessions_touch ON prayer_sessions;
CREATE TRIGGER prayer_sessions_touch
  BEFORE UPDATE ON prayer_sessions
  FOR EACH ROW EXECUTE FUNCTION prayer_touch_updated_at();

DROP TRIGGER IF EXISTS prayer_statistics_touch ON prayer_statistics;
CREATE TRIGGER prayer_statistics_touch
  BEFORE UPDATE ON prayer_statistics
  FOR EACH ROW EXECUTE FUNCTION prayer_touch_updated_at();
