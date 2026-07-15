-- ════════════════════════════════════════════════════════════════════════
-- Public Write-Policy Lockdown v2 — دفعة ثانية (سياسات INSERT فقط فات
-- الفحصَ الأول لأن INSERT ليس له USING، بل WITH CHECK فقط)
-- ════════════════════════════════════════════════════════════════════════
--
-- v1 (public_write_policies_lockdown_v1.sql) فحص polqual (USING) فقط، فأغفل
-- سياسات INSERT الخالصة (polcmd='a') التي تُبنى على polwithcheck لا polqual.
-- إعادة الفحص شاملًا للحقلين كشف 8 سياسات إضافية بنفس النمط PUBLIC + true.
--
-- التصنيف بعد فحص كل جدول ضد src/ (عميل) وlib/api-handlers/ (خادم):
--   • lp_achievements، research_queries: يُستهلكان حصرًا من
--     lib/api-handlers/*.js عبر service_role — لا حاجة لأي سياسة PUBLIC.
--   • sin_jeem_leaderboard_entries، sin_jeem_matches، sin_jeem_players:
--     صفر مراجع في src/ أو lib/ أو api/ بالكامل — ميزة غير مُستهلَكة حاليًا.
--   • submissions: يُستهلك حصرًا من lib/api-handlers/submissions.js عبر
--     service_role (admin client) — رغم اسم السياسة "anyone can submit"،
--     المسار الفعلي للعميل هو نقطة API الخادمية (تحقق/تنظيف قبل الإدراج)،
--     لا PostgREST مباشر. سياسة PUBLIC هنا سطح هجوم إضافي لا فائدة منه
--     (يتيح تجاوز أي تحقق خادمي في submissions.js).
--   • user_submissions: **استُثنيت عمدًا ولم تُغيَّر** — تحقّق فعلي أن
--     src/lib/user-submissions-service.ts يُدرج مباشرة من العميل (لا خادم
--     وسيط)، وهي نموذج "أرسل محتوى دون تسجيل دخول" شرعي (submitter_name/
--     email حقول نصية حرة تدعم ضيوفًا). حذف هذه السياسة سيكسر ميزة رفع
--     الأذان/الدروس الحقيقية الحالية.
--
-- idempotent بالكامل.
-- التشغيل: npx supabase db query --linked --file supabase/public_write_policies_lockdown_v2.sql
-- ════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "lp_achievements_service_insert" ON public.lp_achievements;
DROP POLICY IF EXISTS "service insert research_queries" ON public.research_queries;
DROP POLICY IF EXISTS "sin_jeem_lb_insert" ON public.sin_jeem_leaderboard_entries;
DROP POLICY IF EXISTS "sin_jeem_matches_insert" ON public.sin_jeem_matches;
DROP POLICY IF EXISTS "sin_jeem_players_write" ON public.sin_jeem_players;
DROP POLICY IF EXISTS "anyone can submit" ON public.submissions;
DROP POLICY IF EXISTS "public_insert" ON public.submissions;

-- user_submissions: بلا تغيير عمدًا — راجع التعليق أعلاه.
