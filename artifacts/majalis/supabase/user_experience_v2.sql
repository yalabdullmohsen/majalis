-- User Experience v2 — sheikh follows + personal achievements metadata
-- Extends user_experience_v1.sql

CREATE TABLE IF NOT EXISTS user_sheikh_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sheikh_id TEXT NOT NULL,
  sheikh_name TEXT,
  last_notified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sheikh_id)
);

CREATE INDEX IF NOT EXISTS user_sheikh_follows_user_idx ON user_sheikh_follows (user_id);
CREATE INDEX IF NOT EXISTS user_sheikh_follows_sheikh_idx ON user_sheikh_follows (sheikh_id);

ALTER TABLE user_sheikh_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_sheikh_follows_own ON user_sheikh_follows;
CREATE POLICY user_sheikh_follows_own ON user_sheikh_follows
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Extend notifications type for sheikh updates (drop/recreate check if needed)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('info', 'lesson', 'qa', 'system', 'alert', 'sheikh_update', 'achievement'));

-- Track content views for recommendations (if not exists)
CREATE TABLE IF NOT EXISTS content_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_views_user_idx ON content_views (user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS content_views_content_idx ON content_views (content_type, content_id);

ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_views_own ON content_views;
CREATE POLICY content_views_own ON content_views
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_sheikh_follows IS 'User follows scholars — triggers lesson update notifications';
