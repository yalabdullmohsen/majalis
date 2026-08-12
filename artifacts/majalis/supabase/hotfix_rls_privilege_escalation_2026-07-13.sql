-- ═══════════════════════════════════════════════════════════════════════════
-- HOTFIX P0 — إصلاح تصعيد صلاحيات RLS وتسريب PII (2026-07-13)
-- ═══════════════════════════════════════════════════════════════════════════
-- المشكلة: 20 سياسة RLS بصيغة "FOR ALL USING (true)" بلا "TO service_role"
-- كانت تنطبق افتراضيًا على PUBLIC (أي anon و authenticated)، مما يسمح لأي
-- مستخدم مسجّل (أو مجهول، حسب GRANTs الأساسية) بمنح نفسه صلاحية super_admin
-- عبر governance_user_roles، والتي تُستخدم في is_admin() المعتمَدة عليها
-- عشرات السياسات الحساسة الأخرى في المشروع (تصعيد صلاحيات كامل).
--
-- كما كانت سياسة user_submissions.user_sees_own تحتوي منطقًا معكوسًا
-- (OR auth.uid() IS NULL) يفتح كل طلبات المستخدمين (بيانات شخصية) لأي زائر
-- غير مسجّل الدخول.
--
-- شغّل هذا الملف مرة واحدة مباشرة على قاعدة بيانات الإنتاج عبر:
--   - Supabase Dashboard → SQL Editor، أو
--   - psql "$DATABASE_URL" -f hotfix_rls_privilege_escalation_2026-07-13.sql
--
-- آمن للتشغيل المتكرر (idempotent) — كل أمر DROP POLICY IF EXISTS ثم CREATE.
-- لا يحذف بيانات، لا يُنشئ/يحذف جداول، يعدّل تعريف السياسات فقط.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── governance_v1.sql: 7 جداول ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role governance_user_roles" ON governance_user_roles;
CREATE POLICY "Service role governance_user_roles" ON governance_user_roles FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role governance_audit_log" ON governance_audit_log;
CREATE POLICY "Service role governance_audit_log" ON governance_audit_log FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role governance_content_lifecycle" ON governance_content_lifecycle;
CREATE POLICY "Service role governance_content_lifecycle" ON governance_content_lifecycle FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role governance_lifecycle_history" ON governance_lifecycle_history;
CREATE POLICY "Service role governance_lifecycle_history" ON governance_lifecycle_history FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role governance_reviews" ON governance_reviews;
CREATE POLICY "Service role governance_reviews" ON governance_reviews FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role governance_backup_runs" ON governance_backup_runs;
CREATE POLICY "Service role governance_backup_runs" ON governance_backup_runs FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role governance_security_audits" ON governance_security_audits;
CREATE POLICY "Service role governance_security_audits" ON governance_security_audits FOR ALL TO service_role USING (true);

-- ── MAJALISILM_PRODUCTION_SETUP.sql: نفس جدولي governance (اسم سياسة مختلف) ─
DROP POLICY IF EXISTS "svc_governance_user_roles" ON governance_user_roles;
CREATE POLICY "svc_governance_user_roles" ON governance_user_roles FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "svc_governance_audit_log" ON governance_audit_log;
CREATE POLICY "svc_governance_audit_log" ON governance_audit_log FOR ALL TO service_role USING (true);

-- ── islamic_intelligence_v1.sql: 6 جداول ────────────────────────────────────
DROP POLICY IF EXISTS "Service role full access intelligence_runs" ON intelligence_runs;
CREATE POLICY "Service role full access intelligence_runs" ON intelligence_runs FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full access intelligence_audit_findings" ON intelligence_audit_findings;
CREATE POLICY "Service role full access intelligence_audit_findings" ON intelligence_audit_findings FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full access intelligence_content_plans" ON intelligence_content_plans;
CREATE POLICY "Service role full access intelligence_content_plans" ON intelligence_content_plans FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full access intelligence_discovery_items" ON intelligence_discovery_items;
CREATE POLICY "Service role full access intelligence_discovery_items" ON intelligence_discovery_items FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full access intelligence_weekly_reports" ON intelligence_weekly_reports;
CREATE POLICY "Service role full access intelligence_weekly_reports" ON intelligence_weekly_reports FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full access intelligence_agent_metrics" ON intelligence_agent_metrics;
CREATE POLICY "Service role full access intelligence_agent_metrics" ON intelligence_agent_metrics FOR ALL TO service_role USING (true);

-- ── open_platform_v1.sql: 4 جداول (يشمل open_api_keys — مفاتيح API فعلية) ──
DROP POLICY IF EXISTS "Service role open_api_keys" ON open_api_keys;
CREATE POLICY "Service role open_api_keys" ON open_api_keys FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role open_api_audit_logs" ON open_api_audit_logs;
CREATE POLICY "Service role open_api_audit_logs" ON open_api_audit_logs FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role open_webhooks" ON open_webhooks;
CREATE POLICY "Service role open_webhooks" ON open_webhooks FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role open_webhook_deliveries" ON open_webhook_deliveries;
CREATE POLICY "Service role open_webhook_deliveries" ON open_webhook_deliveries FOR ALL TO service_role USING (true);

-- ── auto_engine_production_complete.sql: جدولان ─────────────────────────────
DROP POLICY IF EXISTS auto_import_runs_service ON auto_import_runs;
CREATE POLICY auto_import_runs_service ON auto_import_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS service_all ON ai_generation_jobs';
  EXECUTE 'CREATE POLICY service_all ON ai_generation_jobs FOR ALL TO service_role USING (true) WITH CHECK (true)';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── learning_path_v1.sql: lp_streaks (كانت تُبطل سياسة "المستخدم يرى سجله
--    فقط" الموجودة أصلاً لأن Postgres يُجمّع سياسات FOR ALL بمنطق OR) ────────
DROP POLICY IF EXISTS "lp_achievements_service_insert" ON lp_achievements;
CREATE POLICY "lp_achievements_service_insert" ON lp_achievements FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "lp_streaks_service_write" ON lp_streaks;
CREATE POLICY "lp_streaks_service_write" ON lp_streaks FOR ALL TO service_role USING (true);

-- ── user_submissions_v1.sql: إصلاح منطق معكوس يُسرّب PII للمجهولين ─────────
DROP POLICY IF EXISTS "user_sees_own" ON user_submissions;
CREATE POLICY "user_sees_own"
  ON user_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- تحقق ما بعد التشغيل (اختياري) — يجب أن يُظهر roles = {service_role} فقط
-- لكل سياسة أعلاه:
--
-- SELECT tablename, policyname, roles FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'governance_user_roles','governance_audit_log','governance_content_lifecycle',
--     'governance_lifecycle_history','governance_reviews','governance_backup_runs',
--     'governance_security_audits','intelligence_runs','intelligence_audit_findings',
--     'intelligence_content_plans','intelligence_discovery_items',
--     'intelligence_weekly_reports','intelligence_agent_metrics',
--     'open_api_keys','open_api_audit_logs','open_webhooks','open_webhook_deliveries',
--     'auto_import_runs','ai_generation_jobs','lp_achievements','lp_streaks'
--   )
-- ORDER BY tablename, policyname;
-- ═══════════════════════════════════════════════════════════════════════════
