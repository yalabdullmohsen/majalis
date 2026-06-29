-- User Experience & Personal Learning System v1
-- Extends bookmarks/reports; adds folders, notes, plans, activity, streaks
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- ── Extend bookmarks for full personal library ─────────────────────────────
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_content_type_check;
ALTER TABLE bookmarks ALTER COLUMN content_id TYPE TEXT USING content_id::text;

ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS content_url TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── Custom library folders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_library_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS user_library_folders_user_idx ON user_library_folders (user_id, sort_order);

ALTER TABLE user_library_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_library_folders_own ON user_library_folders;
CREATE POLICY user_library_folders_own ON user_library_folders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_folder_id_fkey'
  ) THEN
    ALTER TABLE bookmarks
      ADD CONSTRAINT bookmarks_folder_id_fkey
      FOREIGN KEY (folder_id) REFERENCES user_library_folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── Personal notes (private per user) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_content_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL DEFAULT '',
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_content_notes_user_idx ON user_content_notes (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS user_content_notes_content_idx ON user_content_notes (user_id, content_type, content_id);

ALTER TABLE user_content_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_content_notes_own ON user_content_notes;
CREATE POLICY user_content_notes_own ON user_content_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Personal learning plans ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  level TEXT NOT NULL DEFAULT 'beginner',
  interests TEXT[] NOT NULL DEFAULT '{}',
  daily_minutes INT NOT NULL DEFAULT 30,
  goal TEXT NOT NULL DEFAULT 'study',
  plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  weekly_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  monthly_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  onboarding_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_learning_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_learning_plans_own ON user_learning_plans;
CREATE POLICY user_learning_plans_own ON user_learning_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Activity log (stats + streaks) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  content_type TEXT,
  content_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_activity_log_user_idx ON user_activity_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_activity_log_type_idx ON user_activity_log (user_id, activity_type);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_activity_log_own ON user_activity_log;
CREATE POLICY user_activity_log_own ON user_activity_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_streaks_own ON user_streaks;
CREATE POLICY user_streaks_own ON user_streaks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Extend error reports ─────────────────────────────────────────────────────
ALTER TABLE error_reports ADD COLUMN IF NOT EXISTS page_url TEXT;
ALTER TABLE error_reports ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE error_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE error_reports ALTER COLUMN content_id TYPE TEXT USING content_id::text;

ALTER TABLE error_reports DROP CONSTRAINT IF EXISTS error_reports_report_type_check;
ALTER TABLE error_reports DROP CONSTRAINT IF EXISTS error_reports_status_check;

-- ── Audit log for personal learning ops ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_learning_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_learning_audit_user_idx ON user_learning_audit (user_id, created_at DESC);

ALTER TABLE user_learning_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_learning_audit_own ON user_learning_audit;
CREATE POLICY user_learning_audit_own ON user_learning_audit
  FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS user_learning_audit_insert ON user_learning_audit;
CREATE POLICY user_learning_audit_insert ON user_learning_audit
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_library_folders IS 'Personal library folders per user';
COMMENT ON TABLE user_content_notes IS 'Private notes on any content — RLS isolated per user';
COMMENT ON TABLE user_learning_plans IS 'Personalized learning plan with auto-generated goals';
