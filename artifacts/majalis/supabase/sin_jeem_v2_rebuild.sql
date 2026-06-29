-- سؤال وجواب v2 — Emergency Rebuild Schema
-- Idempotent. Run after sin_jeem_v1 + v1_2 + question_generation_v1.

-- ── Extended question fields (v2 model) ─────────────────────────────
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS evidence text;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS source_name text;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS book_name text;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS hadith_or_ayah_ref text;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS subcategory_slug text;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS time_seconds int NOT NULL DEFAULT 30;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS question_points int;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 2;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS semantic_hash text;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS idea_hash text;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS options_hash text;

UPDATE sin_jeem_questions SET question_points = COALESCE(question_points, points, 10) WHERE question_points IS NULL;
UPDATE sin_jeem_questions SET version = 2 WHERE version IS NULL OR version < 2;

CREATE INDEX IF NOT EXISTS sin_jeem_questions_semantic_hash_idx
  ON sin_jeem_questions(semantic_hash) WHERE semantic_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS sin_jeem_questions_idea_hash_idx
  ON sin_jeem_questions(idea_hash) WHERE idea_hash IS NOT NULL;

-- ── Player question log (no-repeat per user per category) ───────────
CREATE TABLE IF NOT EXISTS sin_jeem_player_question_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_key text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid REFERENCES sin_jeem_questions(id) ON DELETE CASCADE,
  category_slug text,
  answered_at timestamptz NOT NULL DEFAULT now(),
  was_correct boolean,
  cycle int NOT NULL DEFAULT 1,
  UNIQUE (player_key, question_id, cycle)
);

CREATE INDEX IF NOT EXISTS sin_jeem_pql_player_category_idx
  ON sin_jeem_player_question_log(player_key, category_slug, cycle);
CREATE INDEX IF NOT EXISTS sin_jeem_pql_user_idx
  ON sin_jeem_player_question_log(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE sin_jeem_player_question_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sin_jeem_pql_select ON sin_jeem_player_question_log;
CREATE POLICY sin_jeem_pql_select ON sin_jeem_player_question_log FOR SELECT USING (true);
DROP POLICY IF EXISTS sin_jeem_pql_insert ON sin_jeem_player_question_log;
CREATE POLICY sin_jeem_pql_insert ON sin_jeem_player_question_log FOR INSERT WITH CHECK (true);

-- ── Category completion tracking ────────────────────────────────────
CREATE TABLE IF NOT EXISTS sin_jeem_player_category_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_key text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category_slug text NOT NULL,
  cycle int NOT NULL DEFAULT 1,
  answered_count int NOT NULL DEFAULT 0,
  total_in_category int NOT NULL DEFAULT 0,
  completion_pct numeric(5,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_key, category_slug, cycle)
);

ALTER TABLE sin_jeem_player_category_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sin_jeem_pcp_all ON sin_jeem_player_category_progress;
CREATE POLICY sin_jeem_pcp_all ON sin_jeem_player_category_progress FOR ALL USING (true) WITH CHECK (true);

-- ── Purge helper (run manually during rebuild) ──────────────────────
-- TRUNCATE sin_jeem_questions CASCADE;  -- use rebuild script instead
