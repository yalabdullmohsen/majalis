-- =====================================================================
--  مجالس العلم — إصلاحات Security Advisor
--  التاريخ: 2026-07-08
--  آمن للتشغيل مرات متعددة (IF NOT EXISTS / DROP … IF EXISTS)
--
--  يتضمّن:
--  أ) إصلاح Views — تفعيل security_invoker لاحترام RLS
--  ب) تفعيل RLS على الجداول الناقصة
--  ج) سياسات Row-Level Security للجداول غير المغطّاة
--  د) إصلاح دوال SECURITY DEFINER (إضافة SET search_path)
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- أ) إصلاح Views — SECURITY INVOKER
--    المشكلة: Views بدون security_invoker تتجاوز RLS وتُشغَّل بصلاحيات
--             مالك الـ view (SECURITY DEFINER بشكل ضمني).
--    الحل: إعادة إنشاء كل view مع خيار security_invoker=on
--          (مدعوم في PostgreSQL 15+ / Supabase >= 2023)
-- ─────────────────────────────────────────────────────────────────────

-- 1. auto_sources — alias لـ trusted_sources
DROP VIEW IF EXISTS public.auto_sources;
CREATE OR REPLACE VIEW public.auto_sources
  WITH (security_invoker = on)
AS
  SELECT * FROM public.trusted_sources;

-- 2. auto_content — alias لـ auto_imported_content
DROP VIEW IF EXISTS public.auto_content;
CREATE OR REPLACE VIEW public.auto_content
  WITH (security_invoker = on)
AS
  SELECT * FROM public.auto_imported_content;

-- 3. vw_lessons_quality_summary — ملخّص جودة الدروس
DROP VIEW IF EXISTS public.vw_lessons_quality_summary;
CREATE OR REPLACE VIEW public.vw_lessons_quality_summary
  WITH (security_invoker = on)
AS
  SELECT
    l.id,
    l.title,
    l.speaker_name,
    l.category,
    l.status,
    l.quality_score,
    l.quality_tier,
    l.quality_status,
    l.views_count,
    l.bookmarks_count,
    l.completions_count,
    l.avg_rating,
    l.ratings_count,
    l.completion_rate,
    l.quality_reviewed_by,
    l.quality_reviewed_at,
    l.created_at,
    l.updated_at
  FROM public.lessons l;

-- 4. fiqh_sources — alias لـ fiqh_council_sources
DROP VIEW IF EXISTS public.fiqh_sources;
CREATE OR REPLACE VIEW public.fiqh_sources
  WITH (security_invoker = on)
AS
  SELECT
    id,
    slug,
    name,
    organization,
    source_type,
    COALESCE(official_url, base_url) AS official_url,
    base_url,
    feed_url,
    is_active,
    last_sync_at,
    items_imported_count,
    last_error_log,
    last_sync_status,
    trust_level,
    created_at,
    updated_at
  FROM public.fiqh_council_sources;


-- ─────────────────────────────────────────────────────────────────────
-- ب) تفعيل RLS على الجداول الناقصة
--    فئات:
--    1. محتوى عام (يقرأه الجميع)
--    2. بيانات مستخدم (المالك فقط)
--    3. محتوى إداري (admin فقط)
-- ─────────────────────────────────────────────────────────────────────

-- ── محتوى عام ──────────────────────────────────────────────────────
ALTER TABLE public.muezzins                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muezzin_statistics        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_questions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_adhkar_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_adhkar_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_programs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_faqs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_index              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_topics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tag_relations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_scores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_surah_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharia_ruling_imports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarly_verification_runs ENABLE ROW LEVEL SECURITY;

-- ── بيانات مستخدم ──────────────────────────────────────────────────
ALTER TABLE public.muezzin_favorites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muezzin_ratings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_search_preferences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_research_library     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_academic_levels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reminders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_queries          ENABLE ROW LEVEL SECURITY;

-- ── محتوى وبنية داخلية (admin/service_role فقط) ────────────────────
ALTER TABLE public.admin_audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_pipeline_runs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_pipeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_retry_queue    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_security_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_daily_content  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_daily_rotation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citation_folders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citation_sources          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_provenance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_relationships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_topic_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_version_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_audit_snapshots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadith_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiqh_issue_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kg_citations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kn_nodes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kn_edges                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kn_tags                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reasoning_inference_runs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reasoning_pipeline_steps  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reasoning_quality_issues  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reasoning_query_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_review_cycles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_review_issues   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_slug_map           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_messages_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_subscribers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tg_dedup_hashes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tg_extracted_lessons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tg_monitored_channels     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tg_raw_messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_category_corrections   ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────
-- ج) سياسات Row-Level Security
-- ─────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════
-- محتوى عام — قراءة مفتوحة، كتابة للـ admin فقط
-- ══════════════════════════════════════════════════════════════════════

-- muezzins
DROP POLICY IF EXISTS "muezzins_public_read"  ON public.muezzins;
DROP POLICY IF EXISTS "muezzins_admin_write"  ON public.muezzins;
CREATE POLICY "muezzins_public_read"
  ON public.muezzins FOR SELECT USING (true);
CREATE POLICY "muezzins_admin_write"
  ON public.muezzins FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- muezzin_statistics
DROP POLICY IF EXISTS "muezzin_statistics_public_read" ON public.muezzin_statistics;
DROP POLICY IF EXISTS "muezzin_statistics_admin_write" ON public.muezzin_statistics;
CREATE POLICY "muezzin_statistics_public_read"
  ON public.muezzin_statistics FOR SELECT USING (true);
CREATE POLICY "muezzin_statistics_admin_write"
  ON public.muezzin_statistics FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- qa_questions
DROP POLICY IF EXISTS "qa_questions_public_read" ON public.qa_questions;
DROP POLICY IF EXISTS "qa_questions_admin_write" ON public.qa_questions;
CREATE POLICY "qa_questions_public_read"
  ON public.qa_questions FOR SELECT USING (true);
CREATE POLICY "qa_questions_admin_write"
  ON public.qa_questions FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- verified_adhkar_items
DROP POLICY IF EXISTS "adhkar_public_read"  ON public.verified_adhkar_items;
DROP POLICY IF EXISTS "adhkar_admin_write"  ON public.verified_adhkar_items;
CREATE POLICY "adhkar_public_read"
  ON public.verified_adhkar_items FOR SELECT USING (true);
CREATE POLICY "adhkar_admin_write"
  ON public.verified_adhkar_items FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- verified_adhkar_categories
DROP POLICY IF EXISTS "adhkar_categories_public_read" ON public.verified_adhkar_categories;
DROP POLICY IF EXISTS "adhkar_categories_admin_write" ON public.verified_adhkar_categories;
CREATE POLICY "adhkar_categories_public_read"
  ON public.verified_adhkar_categories FOR SELECT USING (true);
CREATE POLICY "adhkar_categories_admin_write"
  ON public.verified_adhkar_categories FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- universities
DROP POLICY IF EXISTS "universities_public_read" ON public.universities;
DROP POLICY IF EXISTS "universities_admin_write" ON public.universities;
CREATE POLICY "universities_public_read"
  ON public.universities FOR SELECT USING (true);
CREATE POLICY "universities_admin_write"
  ON public.universities FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- university_programs
DROP POLICY IF EXISTS "university_programs_public_read" ON public.university_programs;
DROP POLICY IF EXISTS "university_programs_admin_write" ON public.university_programs;
CREATE POLICY "university_programs_public_read"
  ON public.university_programs FOR SELECT USING (true);
CREATE POLICY "university_programs_admin_write"
  ON public.university_programs FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- university_faqs
DROP POLICY IF EXISTS "university_faqs_public_read" ON public.university_faqs;
DROP POLICY IF EXISTS "university_faqs_admin_write" ON public.university_faqs;
CREATE POLICY "university_faqs_public_read"
  ON public.university_faqs FOR SELECT USING (true);
CREATE POLICY "university_faqs_admin_write"
  ON public.university_faqs FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- search_index
DROP POLICY IF EXISTS "search_index_public_read" ON public.search_index;
DROP POLICY IF EXISTS "search_index_service_write" ON public.search_index;
CREATE POLICY "search_index_public_read"
  ON public.search_index FOR SELECT USING (true);
CREATE POLICY "search_index_service_write"
  ON public.search_index FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- search_topics
DROP POLICY IF EXISTS "search_topics_public_read" ON public.search_topics;
DROP POLICY IF EXISTS "search_topics_admin_write" ON public.search_topics;
CREATE POLICY "search_topics_public_read"
  ON public.search_topics FOR SELECT USING (true);
CREATE POLICY "search_topics_admin_write"
  ON public.search_topics FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- content_tags
DROP POLICY IF EXISTS "content_tags_public_read" ON public.content_tags;
DROP POLICY IF EXISTS "content_tags_admin_write" ON public.content_tags;
CREATE POLICY "content_tags_public_read"
  ON public.content_tags FOR SELECT USING (true);
CREATE POLICY "content_tags_admin_write"
  ON public.content_tags FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- content_tag_relations
DROP POLICY IF EXISTS "content_tag_relations_public_read" ON public.content_tag_relations;
DROP POLICY IF EXISTS "content_tag_relations_admin_write" ON public.content_tag_relations;
CREATE POLICY "content_tag_relations_public_read"
  ON public.content_tag_relations FOR SELECT USING (true);
CREATE POLICY "content_tag_relations_admin_write"
  ON public.content_tag_relations FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- content_scores
DROP POLICY IF EXISTS "content_scores_public_read" ON public.content_scores;
DROP POLICY IF EXISTS "content_scores_service_write" ON public.content_scores;
CREATE POLICY "content_scores_public_read"
  ON public.content_scores FOR SELECT USING (true);
CREATE POLICY "content_scores_service_write"
  ON public.content_scores FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- quran_surah_profiles
DROP POLICY IF EXISTS "quran_surah_public_read" ON public.quran_surah_profiles;
DROP POLICY IF EXISTS "quran_surah_admin_write" ON public.quran_surah_profiles;
CREATE POLICY "quran_surah_public_read"
  ON public.quran_surah_profiles FOR SELECT USING (true);
CREATE POLICY "quran_surah_admin_write"
  ON public.quran_surah_profiles FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- sharia_ruling_imports
DROP POLICY IF EXISTS "sharia_imports_admin" ON public.sharia_ruling_imports;
CREATE POLICY "sharia_imports_admin"
  ON public.sharia_ruling_imports FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- scholarly_verification_runs
DROP POLICY IF EXISTS "scholarly_verification_admin" ON public.scholarly_verification_runs;
CREATE POLICY "scholarly_verification_admin"
  ON public.scholarly_verification_runs FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());


-- ══════════════════════════════════════════════════════════════════════
-- بيانات مستخدم — المالك فقط
-- ══════════════════════════════════════════════════════════════════════

-- muezzin_favorites
DROP POLICY IF EXISTS "muezzin_favorites_own" ON public.muezzin_favorites;
CREATE POLICY "muezzin_favorites_own"
  ON public.muezzin_favorites FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- muezzin_ratings
DROP POLICY IF EXISTS "muezzin_ratings_own" ON public.muezzin_ratings;
CREATE POLICY "muezzin_ratings_own"
  ON public.muezzin_ratings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_favorites
DROP POLICY IF EXISTS "user_favorites_own" ON public.user_favorites;
CREATE POLICY "user_favorites_own"
  ON public.user_favorites FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_behavior_events (كتابة من المستخدم نفسه فقط، بدون قراءة للآخرين)
DROP POLICY IF EXISTS "user_behavior_own_insert" ON public.user_behavior_events;
DROP POLICY IF EXISTS "user_behavior_admin_read"  ON public.user_behavior_events;
CREATE POLICY "user_behavior_own_insert"
  ON public.user_behavior_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_behavior_admin_read"
  ON public.user_behavior_events FOR SELECT
  USING (is_admin());

-- user_search_preferences
DROP POLICY IF EXISTS "user_search_prefs_own" ON public.user_search_preferences;
CREATE POLICY "user_search_prefs_own"
  ON public.user_search_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_research_library
DROP POLICY IF EXISTS "user_research_library_own" ON public.user_research_library;
CREATE POLICY "user_research_library_own"
  ON public.user_research_library FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_academic_levels
DROP POLICY IF EXISTS "user_academic_levels_own" ON public.user_academic_levels;
CREATE POLICY "user_academic_levels_own"
  ON public.user_academic_levels FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- review_reminders
DROP POLICY IF EXISTS "review_reminders_own" ON public.review_reminders;
CREATE POLICY "review_reminders_own"
  ON public.review_reminders FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- research_queries
DROP POLICY IF EXISTS "research_queries_own" ON public.research_queries;
DROP POLICY IF EXISTS "research_queries_admin" ON public.research_queries;
CREATE POLICY "research_queries_own"
  ON public.research_queries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "research_queries_admin"
  ON public.research_queries FOR SELECT
  USING (is_admin());


-- ══════════════════════════════════════════════════════════════════════
-- جداول إدارية داخلية — admin / service_role فقط
-- ══════════════════════════════════════════════════════════════════════

-- admin_audit_logs
DROP POLICY IF EXISTS "admin_audit_logs_admin" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_admin"
  ON public.admin_audit_logs FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- autonomous_* جداول
DROP POLICY IF EXISTS "autonomous_pipeline_runs_admin"    ON public.autonomous_pipeline_runs;
DROP POLICY IF EXISTS "autonomous_pipeline_events_admin"  ON public.autonomous_pipeline_events;
DROP POLICY IF EXISTS "autonomous_reports_admin"          ON public.autonomous_reports;
DROP POLICY IF EXISTS "autonomous_retry_queue_admin"      ON public.autonomous_retry_queue;
DROP POLICY IF EXISTS "autonomous_security_audits_admin"  ON public.autonomous_security_audits;
DROP POLICY IF EXISTS "autonomous_daily_content_admin"    ON public.autonomous_daily_content;
DROP POLICY IF EXISTS "autonomous_daily_rotation_admin"   ON public.autonomous_daily_rotation;
CREATE POLICY "autonomous_pipeline_runs_admin"    ON public.autonomous_pipeline_runs    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "autonomous_pipeline_events_admin"  ON public.autonomous_pipeline_events  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "autonomous_reports_admin"          ON public.autonomous_reports          FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "autonomous_retry_queue_admin"      ON public.autonomous_retry_queue      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "autonomous_security_audits_admin"  ON public.autonomous_security_audits  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "autonomous_daily_content_admin"    ON public.autonomous_daily_content    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "autonomous_daily_rotation_admin"   ON public.autonomous_daily_rotation   FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- citations (admin + مالك)
DROP POLICY IF EXISTS "citations_own"   ON public.citations;
DROP POLICY IF EXISTS "citations_admin" ON public.citations;
CREATE POLICY "citations_own"   ON public.citations FOR ALL USING (auth.uid() = user_id)   WITH CHECK (auth.uid() = user_id);
CREATE POLICY "citations_admin" ON public.citations FOR ALL USING (is_admin())              WITH CHECK (is_admin());

-- citation_folders
DROP POLICY IF EXISTS "citation_folders_own"   ON public.citation_folders;
DROP POLICY IF EXISTS "citation_folders_admin" ON public.citation_folders;
CREATE POLICY "citation_folders_own"   ON public.citation_folders FOR ALL USING (auth.uid() = user_id)   WITH CHECK (auth.uid() = user_id);
CREATE POLICY "citation_folders_admin" ON public.citation_folders FOR ALL USING (is_admin())              WITH CHECK (is_admin());

-- citation_sources
DROP POLICY IF EXISTS "citation_sources_public_read" ON public.citation_sources;
DROP POLICY IF EXISTS "citation_sources_admin_write" ON public.citation_sources;
CREATE POLICY "citation_sources_public_read" ON public.citation_sources FOR SELECT USING (true);
CREATE POLICY "citation_sources_admin_write" ON public.citation_sources FOR ALL   USING (is_admin()) WITH CHECK (is_admin());

-- content_provenance, content_relationships, content_topic_links, content_version_snapshots
DROP POLICY IF EXISTS "content_provenance_service"           ON public.content_provenance;
DROP POLICY IF EXISTS "content_relationships_service"        ON public.content_relationships;
DROP POLICY IF EXISTS "content_topic_links_service"          ON public.content_topic_links;
DROP POLICY IF EXISTS "content_version_snapshots_service"    ON public.content_version_snapshots;
CREATE POLICY "content_provenance_service"        ON public.content_provenance        FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "content_relationships_service"     ON public.content_relationships     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "content_topic_links_service"       ON public.content_topic_links       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "content_version_snapshots_service" ON public.content_version_snapshots FOR ALL USING (auth.role() = 'service_role');

-- graph / knowledge graph (admin + service_role)
DROP POLICY IF EXISTS "graph_audit_admin"     ON public.graph_audit_snapshots;
DROP POLICY IF EXISTS "hadith_profiles_admin" ON public.hadith_profiles;
DROP POLICY IF EXISTS "fiqh_issue_profiles_admin" ON public.fiqh_issue_profiles;
DROP POLICY IF EXISTS "kg_citations_admin"    ON public.kg_citations;
DROP POLICY IF EXISTS "kn_nodes_admin"        ON public.kn_nodes;
DROP POLICY IF EXISTS "kn_edges_admin"        ON public.kn_edges;
DROP POLICY IF EXISTS "kn_tags_admin"         ON public.kn_tags;
CREATE POLICY "graph_audit_admin"         ON public.graph_audit_snapshots    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "hadith_profiles_admin"     ON public.hadith_profiles          FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "fiqh_issue_profiles_admin" ON public.fiqh_issue_profiles      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "kg_citations_admin"        ON public.kg_citations              FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "kn_nodes_admin"            ON public.kn_nodes                  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "kn_edges_admin"            ON public.kn_edges                  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "kn_tags_admin"             ON public.kn_tags                   FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- reasoning / inference (service_role فقط)
DROP POLICY IF EXISTS "reasoning_service" ON public.reasoning_inference_runs;
DROP POLICY IF EXISTS "reasoning_steps_service" ON public.reasoning_pipeline_steps;
DROP POLICY IF EXISTS "reasoning_quality_service" ON public.reasoning_quality_issues;
DROP POLICY IF EXISTS "reasoning_logs_admin" ON public.reasoning_query_logs;
CREATE POLICY "reasoning_service"         ON public.reasoning_inference_runs  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "reasoning_steps_service"   ON public.reasoning_pipeline_steps  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "reasoning_quality_service" ON public.reasoning_quality_issues  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "reasoning_logs_admin"      ON public.reasoning_query_logs      FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- reference review
DROP POLICY IF EXISTS "reference_review_cycles_admin" ON public.reference_review_cycles;
DROP POLICY IF EXISTS "reference_review_issues_admin" ON public.reference_review_issues;
CREATE POLICY "reference_review_cycles_admin" ON public.reference_review_cycles FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "reference_review_issues_admin" ON public.reference_review_issues FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- search_analytics_events (insert للمستخدم، قراءة للـ admin)
DROP POLICY IF EXISTS "search_analytics_insert" ON public.search_analytics_events;
DROP POLICY IF EXISTS "search_analytics_admin"  ON public.search_analytics_events;
CREATE POLICY "search_analytics_insert" ON public.search_analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "search_analytics_admin"  ON public.search_analytics_events FOR SELECT USING (is_admin());

-- source_slug_map
DROP POLICY IF EXISTS "source_slug_map_public_read" ON public.source_slug_map;
DROP POLICY IF EXISTS "source_slug_map_service_write" ON public.source_slug_map;
CREATE POLICY "source_slug_map_public_read"    ON public.source_slug_map FOR SELECT USING (true);
CREATE POLICY "source_slug_map_service_write"  ON public.source_slug_map FOR ALL    USING (auth.role() = 'service_role');

-- telegram tables (service_role / admin فقط)
DROP POLICY IF EXISTS "telegram_messages_log_admin"   ON public.telegram_messages_log;
DROP POLICY IF EXISTS "telegram_subscribers_admin"    ON public.telegram_subscribers;
DROP POLICY IF EXISTS "tg_dedup_hashes_service"       ON public.tg_dedup_hashes;
DROP POLICY IF EXISTS "tg_extracted_lessons_admin"    ON public.tg_extracted_lessons;
DROP POLICY IF EXISTS "tg_monitored_channels_admin"   ON public.tg_monitored_channels;
DROP POLICY IF EXISTS "tg_raw_messages_service"       ON public.tg_raw_messages;
CREATE POLICY "telegram_messages_log_admin"   ON public.telegram_messages_log     FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "telegram_subscribers_admin"    ON public.telegram_subscribers       FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "tg_dedup_hashes_service"       ON public.tg_dedup_hashes           FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "tg_extracted_lessons_admin"    ON public.tg_extracted_lessons       FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "tg_monitored_channels_admin"   ON public.tg_monitored_channels      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "tg_raw_messages_service"       ON public.tg_raw_messages            FOR ALL USING (auth.role() = 'service_role');

-- learning_notification_rules
DROP POLICY IF EXISTS "learning_notif_rules_own"   ON public.learning_notification_rules;
DROP POLICY IF EXISTS "learning_notif_rules_admin" ON public.learning_notification_rules;
CREATE POLICY "learning_notif_rules_own"   ON public.learning_notification_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learning_notif_rules_admin" ON public.learning_notification_rules FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- qa_category_corrections
DROP POLICY IF EXISTS "qa_category_corrections_admin" ON public.qa_category_corrections;
CREATE POLICY "qa_category_corrections_admin"
  ON public.qa_category_corrections FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());


-- ─────────────────────────────────────────────────────────────────────
-- د) إصلاح دوال SECURITY DEFINER — إضافة SET search_path = public
--    المشكلة: دالة بدون search_path قابلة لهجوم search_path injection
--    الحل: ALTER FUNCTION … SET search_path = public
-- ─────────────────────────────────────────────────────────────────────

-- ملاحظة: بعض الدوال لديها overloads، لذا نستخدم CASCADE احتياطياً.
-- إذا فشل أي ALTER FUNCTION بسبب عدم وجود الدالة في قاعدة البيانات
-- (قد لا تكون جميع الـ migrations قد نُفِّذت) يمكن تجاهله.

DO $$
DECLARE
  _funcs TEXT[] := ARRAY[
    'ake_engine_stats',
    'ake_search_semantic',
    'autonomous_platform_stats',
    'cms_search',
    'fiqh_council_sync_upsert',
    'fiqh_research_analytics',
    'get_published_auto_content',
    'get_published_auto_content_by_slug',
    'get_similar_users',
    'get_submission_stats',
    'global_reference_stats',
    'governance_platform_stats',
    'increment_fiqh_item_views',
    'intelligence_platform_stats',
    'kg_phase4_stats',
    'knowledge_pipeline_stats',
    'learning_platform_stats',
    'match_fiqh_council_embeddings',
    'match_knowledge_embeddings',
    'open_platform_stats',
    'populate_search_index_from_all',
    'reasoning_engine_stats',
    'record_lesson_view',
    'search_analytics_summary',
    'search_fiqh_council',
    'search_fiqh_council_advanced',
    'search_knowledge_hybrid',
    'search_platform',
    'search_scholarly_content',
    'upsert_user_interest'
  ];
  _fn TEXT;
  _oid OID;
BEGIN
  FOREACH _fn IN ARRAY _funcs LOOP
    -- نطبّق على كل overload بنفس الاسم في schema public
    FOR _oid IN
      SELECT p.oid
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = _fn
        AND p.prosecdef = true  -- SECURITY DEFINER فقط
    LOOP
      BEGIN
        EXECUTE format(
          'ALTER FUNCTION public.%I(%s) SET search_path = public',
          _fn,
          pg_get_function_arguments(_oid)
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not alter function %: %', _fn, SQLERRM;
      END;
    END LOOP;
  END LOOP;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────
-- هـ) إجراءات إضافية لتقليل صلاحيات anon على الجداول الحساسة
-- ─────────────────────────────────────────────────────────────────────

-- منع anon من رؤية سجلات المراجعة والتدقيق
REVOKE SELECT ON public.admin_audit_logs          FROM anon;
REVOKE SELECT ON public.governance_audit_log      FROM anon;
REVOKE SELECT ON public.fiqh_council_audit        FROM anon;
REVOKE SELECT ON public.search_queries            FROM anon;
REVOKE SELECT ON public.user_behavior_events      FROM anon;
REVOKE SELECT ON public.autonomous_security_audits FROM anon;

-- منع anon من كتابة البيانات في الجداول الحساسة (يكتفي بالقراءة العامة)
REVOKE INSERT, UPDATE, DELETE ON public.lessons               FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.sheikhs               FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.fatwas                FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.fawaid                FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.sharia_rulings        FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.qa_questions          FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.quiz_questions        FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.scientific_miracles   FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.verified_hadith_items FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.verified_adhkar_items FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.transcriptions        FROM anon;


-- ─────────────────────────────────────────────────────────────────────
-- نهاية الـ migration
-- ─────────────────────────────────────────────────────────────────────
