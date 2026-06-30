-- Content submission system
-- Run once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS submissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL CHECK (type IN ('lesson', 'question')),
  title       TEXT        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 500),
  content     TEXT        NOT NULL CHECK (char_length(content) BETWEEN 3 AND 8000),
  author      TEXT        NOT NULL DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected')),
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Anyone (including anonymous visitors) may insert, but cannot read or modify
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admins can read all" ON submissions
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admins can update status" ON submissions
  FOR UPDATE USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions (status, created_at DESC);
