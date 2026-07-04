-- ═══════════════════════════════════════════════════════════════════════════
-- add_hot_filter_indexes_v1.sql
-- فهارس على أعمدة التصفية الساخنة (status/slug/verification_status/review_status)
-- التي تُستخدم كثيراً في استعلامات المحتوى ولوحات الأتمتة، وكانت بلا فهرس.
-- المصدر: تدقيق المخطط الفعلي (107 جداول) — 24 عموداً ساخناً بلا فهرس.
-- آمن وidempotent (IF NOT EXISTS)، لا يغيّر بيانات. للجداول منخفضة التمايز
-- يمكن لاحقاً استبدالها بفهرس جزئي (WHERE status IN ('pending','failed')).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_akp_pipeline_runs_status ON akp_pipeline_runs (status);
CREATE INDEX IF NOT EXISTS idx_auto_import_logs_status ON auto_import_logs (status);
CREATE INDEX IF NOT EXISTS idx_auto_import_runs_status ON auto_import_runs (status);
CREATE INDEX IF NOT EXISTS idx_auto_imported_content_slug ON auto_imported_content (slug);
CREATE INDEX IF NOT EXISTS idx_auto_publish_queue_status ON auto_publish_queue (status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs (status);
CREATE INDEX IF NOT EXISTS idx_automation_step_logs_status ON automation_step_logs (status);
CREATE INDEX IF NOT EXISTS idx_content_production_health_status ON content_production_health (status);
CREATE INDEX IF NOT EXISTS idx_content_production_staging_status ON content_production_staging (status);
CREATE INDEX IF NOT EXISTS idx_content_scheduler_runs_status ON content_scheduler_runs (status);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_sessions_status ON fiqh_council_sessions (status);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_suggested_relations_status ON fiqh_council_suggested_relations (status);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_sync_jobs_status ON fiqh_council_sync_jobs (status);
CREATE INDEX IF NOT EXISTS idx_fiqh_link_checks_status ON fiqh_link_checks (status);
CREATE INDEX IF NOT EXISTS idx_learning_paths_status ON learning_paths (status);
CREATE INDEX IF NOT EXISTS idx_learning_quizzes_status ON learning_quizzes (status);
CREATE INDEX IF NOT EXISTS idx_lesson_registrations_status ON lesson_registrations (status);
CREATE INDEX IF NOT EXISTS idx_mke_runs_status ON mke_runs (status);
CREATE INDEX IF NOT EXISTS idx_platform_bootstrap_runs_status ON platform_bootstrap_runs (status);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status);
CREATE INDEX IF NOT EXISTS idx_qa_questions_review_status ON qa_questions (review_status);
CREATE INDEX IF NOT EXISTS idx_scientific_miracles_verification_status ON scientific_miracles (verification_status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions (status);
CREATE INDEX IF NOT EXISTS idx_user_module_progress_status ON user_module_progress (status);
