-- Sin Jeem v1.2 — advanced question types + media columns
-- Idempotent patch — safe to re-run

ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE sin_jeem_questions ADD COLUMN IF NOT EXISTS video_url text;

ALTER TABLE sin_jeem_questions DROP CONSTRAINT IF EXISTS sin_jeem_questions_question_type_check;
ALTER TABLE sin_jeem_questions ADD CONSTRAINT sin_jeem_questions_question_type_check
  CHECK (question_type IN (
    'multiple_choice', 'true_false', 'complete_verse', 'complete_hadith', 'complete_mutoon',
    'who_said', 'order_events', 'match', 'image_choice', 'mosque_choice',
    'companion_choice', 'scholar_choice', 'book_choice', 'battle_choice',
    'seira_timeline', 'audio_choice', 'video_choice',
    'first_last', 'count', 'ruling', 'pillar', 'condition', 'wajib', 'sunnah'
  ));

CREATE INDEX IF NOT EXISTS sin_jeem_questions_type_review_idx
  ON sin_jeem_questions(question_type, review_status);

DROP POLICY IF EXISTS "sin_jeem_lb_insert" ON sin_jeem_leaderboard_entries;
CREATE POLICY "sin_jeem_lb_insert" ON sin_jeem_leaderboard_entries
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "sin_jeem_lb_update" ON sin_jeem_leaderboard_entries;
CREATE POLICY "sin_jeem_lb_update" ON sin_jeem_leaderboard_entries
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sin_jeem_audit_insert" ON sin_jeem_question_audit;
CREATE POLICY "sin_jeem_audit_insert" ON sin_jeem_question_audit
  FOR INSERT WITH CHECK (true);
