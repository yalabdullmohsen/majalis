-- Migration: فهارس FK ناقصة (دفعة 2) — إضافي بحت، آمن للتشغيل المتكرر
-- ملاحظة: تحقّقتُ يدويًا من كل عمود قبل إضافته هنا. استُبعدت أعمدة user_id
-- في lp_streaks وuser_academic_levels وuser_quran_position (PRIMARY KEY)
-- وresearcher_profiles (UNIQUE) لأنها مفهرسة تلقائيًا بالفعل في Postgres.

CREATE INDEX IF NOT EXISTS idx_user_learning_notes_user   ON user_learning_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_notes_module ON user_learning_notes(module_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_notes_path   ON user_learning_notes(path_id);

CREATE INDEX IF NOT EXISTS idx_learning_ai_summaries_user   ON learning_ai_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_ai_summaries_module ON learning_ai_summaries(module_id);

CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_user ON telegram_subscribers(user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_intel_extractions_lesson ON lesson_intelligence_extractions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_intel_extractions_draft  ON lesson_intelligence_extractions(draft_id);

CREATE INDEX IF NOT EXISTS idx_user_submissions_reviewer ON user_submissions(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_items_pipeline_run ON knowledge_items(pipeline_run_id);
