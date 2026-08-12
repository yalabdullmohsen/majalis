-- ════════════════════════════════════════════════════════════════════════
-- Public Write-Policy Lockdown v1 — 20 جدولًا بصلاحية كتابة كاملة لأي مجهول
-- ════════════════════════════════════════════════════════════════════════
--
-- اكتُشف أثناء تدقيق أوسع بعد إغلاق ثغرة governance_user_roles (والتي كانت
-- أول مثال على هذا النمط بالضبط): مسح شامل لكل سياسة RLS في مخطط public
-- غير SELECT، بشرط PUBLIC role (لا service_role/authenticated محدَّد) و
-- USING(true) — كشف **20 سياسة** بنفس الخطأ، جميعها تقريبًا مسمّاة "Service
-- role X" (تُوحي بأنها محصورة بـservice_role) لكن CREATE POLICY الأصلية لم
-- تتضمن TO service_role فطُبِّقت على PUBLIC. من بينها جداول بالغة الحساسية:
--   open_api_keys (مفاتيح API!)، open_webhooks/open_webhook_deliveries،
--   governance_audit_log/governance_security_audits (سجلات تدقيق — يمكن
--   لمهاجم محو أثره)، ai_generation_jobs، auto_import_runs، intelligence_*
--   (6 جداول أتمتة داخلية)، lp_streaks، sin_jeem_leaderboard_entries.
--
-- تحقّق منها بنفس أسلوب governance_user_roles (فحص حي غير مدمِّر، دون
-- تنفيذ إدراج/تعديل فعلي هذه المرة لتفادي أي احتمال أثر جانبي على 20 جدولًا
-- دفعة واحدة) — النمط الهيكلي (polroles = ARRAY[0], polqual = 'true',
-- polcmd IN CRUD) مطابق حرفيًا لما أُثبت استغلاله فعليًا على governance_user_roles.
--
-- فحص مصدر الاستهلاك: صفر مراجع من src/ (كود العميل) لـ19 من أصل 20 جدولًا —
-- كلها جداول أتمتة/تدقيق داخلية خالصة، لا تحتاج service_role إلا (وهو
-- BYPASSRLS افتراضيًا في Supabase، فلا يحتاج أي سياسة إطلاقًا). الاستثناءان:
--   • auto_import_runs: تُقرأ من src/lib/auto-content-service.ts عبر
--     adminGetAutoImportRuns() — دالة إدارية بوضوح. أُبقيت القراءة/الكتابة
--     لكن قُيِّدت بـis_admin() بدل PUBLIC.
--   • sin_jeem_leaderboard_entries: صفر مراجع في src/ أو lib/ أو api/ —
--     ميزة لعبة إما لم تُبنَ في الواجهة أو أُزيلت. لا مستهلك شرعي حاليًا،
--     فحُذفت صلاحية الكتابة العامة كليًا (يمكن إعادة تصميمها بنطاق ضيق
--     صحيح — مثلًا device/session id لا auth.uid() لأنها قد تكون للزوار —
--     عند إحياء الميزة فعليًا).
--
-- الإصلاح: حذف كل سياسة من الـ18 الأخرى بلا استبدال (RLS تبقى مفعَّلة،
-- DEFAULT DENY لغير service_role — الاعتماد الكلي). auto_import_runs
-- تُستبدل بسياسة is_admin(). idempotent بالكامل.
--
-- التشغيل: npx supabase db query --linked --file supabase/public_write_policies_lockdown_v1.sql
-- ════════════════════════════════════════════════════════════════════════

-- ── 18 جدول أتمتة/تدقيق داخلي خالص — لا مستهلك من العميل إطلاقًا ──────────
DROP POLICY IF EXISTS "service_all" ON public.ai_generation_jobs;
DROP POLICY IF EXISTS "Service role governance_audit_log" ON public.governance_audit_log;
DROP POLICY IF EXISTS "Service role governance_backup_runs" ON public.governance_backup_runs;
DROP POLICY IF EXISTS "Service role governance_content_lifecycle" ON public.governance_content_lifecycle;
DROP POLICY IF EXISTS "Service role governance_lifecycle_history" ON public.governance_lifecycle_history;
DROP POLICY IF EXISTS "Service role governance_reviews" ON public.governance_reviews;
DROP POLICY IF EXISTS "Service role governance_security_audits" ON public.governance_security_audits;
DROP POLICY IF EXISTS "Service role full access intelligence_agent_metrics" ON public.intelligence_agent_metrics;
DROP POLICY IF EXISTS "Service role full access intelligence_audit_findings" ON public.intelligence_audit_findings;
DROP POLICY IF EXISTS "Service role full access intelligence_content_plans" ON public.intelligence_content_plans;
DROP POLICY IF EXISTS "Service role full access intelligence_discovery_items" ON public.intelligence_discovery_items;
DROP POLICY IF EXISTS "Service role full access intelligence_runs" ON public.intelligence_runs;
DROP POLICY IF EXISTS "Service role full access intelligence_weekly_reports" ON public.intelligence_weekly_reports;
DROP POLICY IF EXISTS "lp_streaks_service_write" ON public.lp_streaks;
DROP POLICY IF EXISTS "Service role open_api_audit_logs" ON public.open_api_audit_logs;
DROP POLICY IF EXISTS "Service role open_api_keys" ON public.open_api_keys;
DROP POLICY IF EXISTS "Service role open_webhook_deliveries" ON public.open_webhook_deliveries;
DROP POLICY IF EXISTS "Service role open_webhooks" ON public.open_webhooks;

-- ── لعبة سين جيم: لا مستهلك حاليًا، حُذفت الكتابة العامة ─────────────────
DROP POLICY IF EXISTS "sin_jeem_lb_update" ON public.sin_jeem_leaderboard_entries;

-- ── auto_import_runs: تُستهلك فعليًا من لوحة الإدارة — استُبدلت بـis_admin() ──
DROP POLICY IF EXISTS "auto_import_runs_service" ON public.auto_import_runs;
CREATE POLICY "auto_import_runs_admin_all" ON public.auto_import_runs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
