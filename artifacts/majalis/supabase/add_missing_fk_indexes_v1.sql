-- ═══════════════════════════════════════════════════════════════════════════
-- add_missing_fk_indexes_v1.sql
-- إضافة الفهارس الناقصة على المفاتيح الخارجية (تحسين الفهارس — بند التحقق).
--
-- المصدر: تشغيل database_integrity_report_v1.sql على مخطط قاعدة البيانات الفعلي
-- (107 جداول) كشف 42 مفتاحاً خارجياً بلا فهرس مُغطٍّ → بطء في الـ JOIN وعمليات
-- الحذف المتتالي (CASCADE/SET NULL). هذه الفهارس تعالجها.
--
-- آمن: كل الأوامر IF NOT EXISTS (idempotent)، وإضافة الفهارس لا تغيّر أي بيانات.
-- للإنتاج على جداول كبيرة: يمكن استبدال CREATE INDEX بـ
--   CREATE INDEX CONCURRENTLY  (خارج معاملة) لتفادي القفل.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_ake_job_queue_connector_id_fk ON ake_job_queue (connector_id);
CREATE INDEX IF NOT EXISTS idx_akp_review_queue_source_id_fk ON akp_review_queue (source_id);
CREATE INDEX IF NOT EXISTS idx_auto_import_logs_source_id_fk ON auto_import_logs (source_id);
CREATE INDEX IF NOT EXISTS idx_auto_publish_queue_content_id_fk ON auto_publish_queue (content_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_source_id_fk ON automation_runs (source_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_created_by_fk ON content_drafts (created_by);
CREATE INDEX IF NOT EXISTS idx_content_production_review_queue_staging_id_fk ON content_production_review_queue (staging_id);
CREATE INDEX IF NOT EXISTS idx_content_views_user_id_fk ON content_views (user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id_fk ON error_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_fawaid_submitted_by_fk ON fawaid (submitted_by);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_audit_user_id_fk ON fiqh_council_audit (user_id);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_duplicates_item_id_fk ON fiqh_council_duplicates (item_id);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_duplicates_duplicate_of_fk ON fiqh_council_duplicates (duplicate_of);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_relations_related_id_fk ON fiqh_council_relations (related_id);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_suggested_relations_suggested_id_fk ON fiqh_council_suggested_relations (suggested_id);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_suggested_relations_approved_by_fk ON fiqh_council_suggested_relations (approved_by);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_sync_logs_job_id_fk ON fiqh_council_sync_logs (job_id);
CREATE INDEX IF NOT EXISTS idx_fiqh_issue_items_item_id_fk ON fiqh_issue_items (item_id);
CREATE INDEX IF NOT EXISTS idx_fiqh_research_search_logs_user_id_fk ON fiqh_research_search_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_fiqh_research_unanswered_user_id_fk ON fiqh_research_unanswered (user_id);
CREATE INDEX IF NOT EXISTS idx_fiqh_review_logs_reviewer_fk ON fiqh_review_logs (reviewer);
CREATE INDEX IF NOT EXISTS idx_fiqh_review_logs_item_id_fk ON fiqh_review_logs (item_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_to_node_id_fk ON kg_edges (to_node_id);
CREATE INDEX IF NOT EXISTS idx_learning_certificates_user_id_fk ON learning_certificates (user_id);
CREATE INDEX IF NOT EXISTS idx_learning_certificates_path_id_fk ON learning_certificates (path_id);
CREATE INDEX IF NOT EXISTS idx_learning_quiz_attempts_quiz_id_fk ON learning_quiz_attempts (quiz_id);
CREATE INDEX IF NOT EXISTS idx_learning_quiz_attempts_user_id_fk ON learning_quiz_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_learning_quiz_questions_quiz_id_fk ON learning_quiz_questions (quiz_id);
CREATE INDEX IF NOT EXISTS idx_learning_quizzes_module_id_fk ON learning_quizzes (module_id);
CREATE INDEX IF NOT EXISTS idx_learning_quizzes_path_id_fk ON learning_quizzes (path_id);
CREATE INDEX IF NOT EXISTS idx_lesson_import_drafts_source_id_fk ON lesson_import_drafts (source_id);
CREATE INDEX IF NOT EXISTS idx_lesson_import_drafts_approved_lesson_id_fk ON lesson_import_drafts (approved_lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_import_drafts_reviewed_by_fk ON lesson_import_drafts (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_lesson_import_drafts_created_by_fk ON lesson_import_drafts (created_by);
CREATE INDEX IF NOT EXISTS idx_lesson_import_drafts_matched_sheikh_id_fk ON lesson_import_drafts (matched_sheikh_id);
CREATE INDEX IF NOT EXISTS idx_lesson_registrations_lesson_id_fk ON lesson_registrations (lesson_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id_fk ON search_queries (user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_lesson_id_fk ON transcriptions (lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_module_progress_path_id_fk ON user_module_progress (path_id);
CREATE INDEX IF NOT EXISTS idx_user_module_progress_module_id_fk ON user_module_progress (module_id);
CREATE INDEX IF NOT EXISTS idx_user_path_enrollments_last_module_id_fk ON user_path_enrollments (last_module_id);
CREATE INDEX IF NOT EXISTS idx_user_path_enrollments_path_id_fk ON user_path_enrollments (path_id);
