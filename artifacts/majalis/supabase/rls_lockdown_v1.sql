-- ════════════════════════════════════════════════════════════════════════
-- RLS Lockdown v1 — إغلاق تحذيرات Supabase Security Advisor (rls_disabled_in_public)
-- ════════════════════════════════════════════════════════════════════════
--
-- السبب الجذري (مؤكَّد بالفحص المباشر لقاعدة الإنتاج قبل كتابة هذا الملف):
--
-- 1. يوجد ALTER DEFAULT PRIVILEGES على مستوى مخطط public (لكل من الدورين
--    postgres وsupabase_admin كمالكين) يمنح anon وauthenticated تلقائيًا
--    SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN على
--    أي جدول جديد يُنشأ — أي جدول لم يُصلَح صراحةً بعد إنشائه يبقى مفتوحًا
--    بالكامل لأي زائر مجهول عبر مفتاح anon العام (المُضمَّن في حزمة المتصفح).
--
-- 2. 49 جدولًا في public كانت RLS معطّلة عليها تمامًا (relrowsecurity=false)
--    وقت الفحص، وكلها تحمل هذه المنح الخطيرة فعليًا لـanon وauthenticated —
--    بما فيها TRUNCATE (يُفرَّغ الجدول بالكامل، ولا تحكمه سياسات RLS إطلاقًا
--    حتى لو فُعِّلت RLS لاحقًا) على جداول مثل autonomous_security_audits
--    وschema_migrations وcontent_engine_publish_audit.
--
-- 3. islamic_stories (الجدول الذي ذكره التحذير تحديدًا) كانت RLS عليها مفعَّلة
--    فعلًا بسياسات صحيحة (islamic_stories_rls_v1.sql نُفِّذ سابقًا ونجح) — لذا
--    تحذير Security Advisor على الأرجح إمّا لم يُحدَّث بعد آخر تشغيل، أو كان
--    يشمل أصلًا هذه الـ49 جدولًا الأخرى التي لم يشملها الإصلاح السابق.
--
-- الإصلاح (بالترتيب أدناه):
--   أ) سحب TRUNCATE/MAINTAIN/TRIGGER/REFERENCES من anon وauthenticated على
--      كل جداول public — لا حاجة لها إطلاقًا من أي عميل PostgREST، وTRUNCATE
--      تحديدًا خطر لا تمنعه RLS.
--   ب) تصحيح ALTER DEFAULT PRIVILEGES بحيث لا تُمنَح هذه الصلاحيات تلقائيًا
--      لأي جدول يُنشأ مستقبلًا.
--   ج) تفعيل RLS على الـ49 جدولًا، مقسَّمة حسب الاستخدام الفعلي (تحقَّق منه
--      بالبحث في الكود قبل كتابة هذا الملف):
--        - محتوى عام (5 جداول): قراءة عامة للمحتوى المعتمد/الموثَّق فقط،
--          كتابة للمشرفين فقط عبر is_admin() الموجودة مسبقًا في القاعدة.
--        - بيانات مستخدم (user_search_preferences): كل مستخدم مسجَّل يرى
--          ويُعدِّل صفّه فقط (auth.uid() = user_id).
--        - جداول تشغيلية داخلية بحتة (43 جدولًا: محركات أتمتة/استيراد/
--          استدلال/سجلات) لا يقرأها أي كود واجهة أمامية بمفتاح anon —
--          تُقفَل بالكامل (RLS مفعَّلة بلا أي سياسة anon/authenticated،
--          والوصول الوحيد المتبقي service_role الذي يتجاوز RLS أساسًا).
--
-- الملف idempotent بالكامل: يمكن تشغيله أكثر من مرة بأمان (DROP POLICY IF
-- EXISTS قبل كل CREATE POLICY، وALTER TABLE ... ENABLE RLS آمن التكرار).
--
-- التشغيل: source .env محليًا ثم node scripts/run-migrations.mjs
-- أو مباشرة: npx supabase db query --linked "$(cat supabase/rls_lockdown_v1.sql)"
-- ════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────
-- أ) سحب TRUNCATE/MAINTAIN/TRIGGER/REFERENCES من anon وauthenticated —
--    على كل الجداول الحالية في public دفعة واحدة (لا تحتاجها أي واجهة API).
-- ────────────────────────────────────────────────────────────────────────

REVOKE TRUNCATE, MAINTAIN, TRIGGER, REFERENCES
  ON ALL TABLES IN SCHEMA public
  FROM anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────
-- ب) تصحيح الصلاحيات الافتراضية لأي جدول يُنشأ مستقبلًا في public —
--    محاولة لكلا الدورين المالكين (postgres وsupabase_admin)؛ الدور المتّصل
--    عبر واجهة الإدارة قد لا يملك صلاحية تغيير defaults لدور آخر (42501) —
--    نتجاهل هذا الخطأ تحديدًا لأنه لا يؤثر على الجداول الحالية (الجزء ج
--    أدناه يُصلحها صراحةً بلا اعتماد على هذا القسم)، ونكتفي بمحاولته قدر
--    الإمكان لتضييق الفجوة مستقبلًا.
-- ────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
      REVOKE TRUNCATE, MAINTAIN, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'تخطّي: لا صلاحية لتعديل defaults لدور postgres (42501) — غير حرج';
  END;
  BEGIN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
      REVOKE TRUNCATE, MAINTAIN, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'تخطّي: لا صلاحية لتعديل defaults لدور supabase_admin (42501) — غير حرج';
  END;
END $$;


-- ────────────────────────────────────────────────────────────────────────
-- ج.١) محتوى عام — قراءة معتمدة فقط، كتابة مشرفين فقط عبر public.is_admin()
-- ────────────────────────────────────────────────────────────────────────

-- prophet_stories (is_approved boolean)
ALTER TABLE public.prophet_stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prophet_stories_public_read" ON public.prophet_stories;
CREATE POLICY "prophet_stories_public_read" ON public.prophet_stories
  FOR SELECT USING (is_approved = true);
DROP POLICY IF EXISTS "prophet_stories_admin_all" ON public.prophet_stories;
CREATE POLICY "prophet_stories_admin_all" ON public.prophet_stories
  FOR ALL
  USING (auth.role() = 'service_role' OR public.is_admin())
  WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.prophet_stories FROM anon;

-- sharia_rulings (status = 'approved' من بين قيم أخرى محتملة)
ALTER TABLE public.sharia_rulings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sharia_rulings_public_read" ON public.sharia_rulings;
CREATE POLICY "sharia_rulings_public_read" ON public.sharia_rulings
  FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS "sharia_rulings_admin_all" ON public.sharia_rulings;
CREATE POLICY "sharia_rulings_admin_all" ON public.sharia_rulings
  FOR ALL
  USING (auth.role() = 'service_role' OR public.is_admin())
  WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.sharia_rulings FROM anon;

-- sharia_ruling_categories (تصنيفات — قراءة عامة دومًا، لا حقل حالة، الكتابة للمشرفين فقط)
ALTER TABLE public.sharia_ruling_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sharia_ruling_categories_public_read" ON public.sharia_ruling_categories;
CREATE POLICY "sharia_ruling_categories_public_read" ON public.sharia_ruling_categories
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "sharia_ruling_categories_admin_write" ON public.sharia_ruling_categories;
CREATE POLICY "sharia_ruling_categories_admin_write" ON public.sharia_ruling_categories
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
DROP POLICY IF EXISTS "sharia_ruling_categories_admin_update" ON public.sharia_ruling_categories;
CREATE POLICY "sharia_ruling_categories_admin_update" ON public.sharia_ruling_categories
  FOR UPDATE
  USING (auth.role() = 'service_role' OR public.is_admin())
  WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
DROP POLICY IF EXISTS "sharia_ruling_categories_admin_delete" ON public.sharia_ruling_categories;
CREATE POLICY "sharia_ruling_categories_admin_delete" ON public.sharia_ruling_categories
  FOR DELETE USING (auth.role() = 'service_role' OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.sharia_ruling_categories FROM anon;

-- verified_adhkar_items (verification_status = 'verified')
ALTER TABLE public.verified_adhkar_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "verified_adhkar_items_public_read" ON public.verified_adhkar_items;
CREATE POLICY "verified_adhkar_items_public_read" ON public.verified_adhkar_items
  FOR SELECT USING (verification_status = 'verified');
DROP POLICY IF EXISTS "verified_adhkar_items_admin_all" ON public.verified_adhkar_items;
CREATE POLICY "verified_adhkar_items_admin_all" ON public.verified_adhkar_items
  FOR ALL
  USING (auth.role() = 'service_role' OR public.is_admin())
  WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.verified_adhkar_items FROM anon;

-- verified_adhkar_categories (verification_status = 'verified')
ALTER TABLE public.verified_adhkar_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "verified_adhkar_categories_public_read" ON public.verified_adhkar_categories;
CREATE POLICY "verified_adhkar_categories_public_read" ON public.verified_adhkar_categories
  FOR SELECT USING (verification_status = 'verified');
DROP POLICY IF EXISTS "verified_adhkar_categories_admin_all" ON public.verified_adhkar_categories;
CREATE POLICY "verified_adhkar_categories_admin_all" ON public.verified_adhkar_categories
  FOR ALL
  USING (auth.role() = 'service_role' OR public.is_admin())
  WITH CHECK (auth.role() = 'service_role' OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.verified_adhkar_categories FROM anon;


-- ────────────────────────────────────────────────────────────────────────
-- ج.٢) بيانات مستخدم — كل مستخدم مسجَّل يدير صفّه فقط
-- ────────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_search_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_search_preferences_own_row" ON public.user_search_preferences;
CREATE POLICY "user_search_preferences_own_row" ON public.user_search_preferences
  FOR ALL
  USING (auth.role() = 'service_role' OR auth.uid() = user_id)
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);
REVOKE ALL ON public.user_search_preferences FROM anon;


-- ────────────────────────────────────────────────────────────────────────
-- ج.٣) جداول تشغيلية داخلية بحتة — لا كود واجهة أمامية يقرأها بمفتاح anon
--      (تحقَّق منه بالبحث في المستودع قبل كتابة هذا الملف). تُقفَل بالكامل:
--      RLS مفعَّلة بلا أي سياسة anon/authenticated + سحب كل الصلاحيات.
--      service_role وحده (يتجاوز RLS) يبقى قادرًا على الوصول، وهو ما تستخدمه
--      كل سكربتات lib/*.mjs الخادمية فعليًا.
-- ────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
  internal_tables text[] := ARRAY[
    '_db_connection_test', 'ake_connector_plugins', 'ake_content_changes',
    'ake_content_sources', 'ake_unified_fingerprints', 'ake_v2_settings',
    'autonomous_daily_content', 'autonomous_daily_rotation',
    'autonomous_pipeline_events', 'autonomous_pipeline_runs',
    'autonomous_reports', 'autonomous_retry_queue', 'autonomous_security_audits',
    'content_engine_backfill_status', 'content_engine_config',
    'content_engine_logs', 'content_engine_publish_audit',
    'content_engine_recommendations', 'content_engine_runs',
    'content_import_jobs', 'content_import_staging', 'content_topic_links',
    'content_version_snapshots', 'fiqh_issue_profiles', 'graph_audit_snapshots',
    'hadith_profiles', 'kg_citations', 'kg_edges', 'kg_nodes',
    'learning_notification_rules', 'platform_bootstrap_runs',
    'quran_surah_profiles', 'reasoning_inference_runs',
    'reasoning_pipeline_steps', 'reasoning_quality_issues',
    'reasoning_query_logs', 'reference_review_cycles',
    'reference_review_issues', 'schema_migrations', 'search_analytics_events',
    'search_topics', 'sharia_ruling_imports', 'source_slug_map'
  ];
BEGIN
  FOREACH t IN ARRAY internal_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated;', t);
    END IF;
  END LOOP;
END $$;
