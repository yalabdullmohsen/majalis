-- Phase 5: Advanced Features Migration
-- Run in Supabase SQL Editor

-- ─── ملاحظات المستخدم (للمحفظة العلمية) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL DEFAULT 'general',
  content_id TEXT,
  content_title TEXT,
  note_text TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_notes_user_idx ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS user_notes_type_idx ON user_notes(user_id, content_type);

ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_notes_own" ON user_notes FOR ALL USING (auth.uid() = user_id);

-- ─── ملف الباحث ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS researcher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  bio TEXT,
  institution TEXT,
  specialization TEXT,
  research_interests TEXT[] NOT NULL DEFAULT '{}',
  publications TEXT[] NOT NULL DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE researcher_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "researcher_select" ON researcher_profiles FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "researcher_own" ON researcher_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "researcher_update" ON researcher_profiles FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "researcher_delete" ON researcher_profiles FOR DELETE
  USING (auth.uid() = user_id);
