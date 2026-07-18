-- ════════════════════════════════════════════════════════════════════════
-- governance_user_roles Lockdown v1 — إغلاق استيلاء كامل غير مصادَق مؤكَّد
-- ════════════════════════════════════════════════════════════════════════
--
-- المشكلة (مؤكَّدة بتجربة حية مباشرة على الإنتاج، أثر منظَّف فورًا صفر بقايا):
-- السياسة الوحيدة على governance_user_roles اسمها "Service role
-- governance_user_roles" وتُوحي بأنها محصورة بـservice_role، لكن عبارة
-- CREATE POLICY الأصلية لم تتضمن TO service_role فطُبِّقت افتراضيًا على
-- PUBLIC (كل الأدوار). النتيجة: أي طلب مجهول الهوية (anon key فقط، بلا JWT
-- مستخدم إطلاقًا) كان يستطيع SELECT/INSERT/UPDATE/DELETE بحرية كاملة —
-- بما فيها منح role_id='super_admin' لأي user_id. is_admin() (المستخدَمة في
-- عشرات سياسات RLS الأخرى بالمنصة) تفحص هذا الجدول كمصدر بديل للصلاحية،
-- فهذه الثغرة كانت تكفي وحدها لتجاوز كل إصلاحات profiles في هذه الجلسة.
--
-- التحقق المباشر (مُوثَّق، أُزيل أثره فورًا):
--   POST .../governance_user_roles {"user_id":"1111...","role_id":"super_admin",...}
--   → 201 نجاح كامل بمفتاح anon العلني فقط. حُذف الصف فورًا بعده (DELETE
--   بنفس المفتاح — يؤكد أن DELETE كانت مفتوحة أيضًا). صفر بيانات حقيقية تأثرت.
--
-- الإصلاح: حذف السياسة الفضفاضة، واستبدالها بثلاث سياسات مضبوطة النطاق:
--   1) القارئ الذاتي: authenticated يقرأ صفّه هو فقط (يلزمه src/lib/supabase.ts
--      لعرض دور المستخدم في الواجهة).
--   2) المسؤول الفعلي (is_admin()): قراءة وكتابة كاملة (لوحة الإدارة).
--   3) لا شيء لـanon إطلاقًا — يعتمد على DEFAULT DENY بعد إزالة السياسة
--      المفتوحة (RLS مفعَّلة أصلًا على الجدول).
--   service_role يبقى يعمل بلا أي سياسة لأنه BYPASSRLS افتراضيًا في Supabase.
--
-- idempotent بالكامل. التشغيل:
--   npx supabase db query --linked --file supabase/governance_user_roles_lockdown_v1.sql
-- ════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Service role governance_user_roles" ON public.governance_user_roles;

CREATE POLICY "governance_roles_self_read" ON public.governance_user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "governance_roles_admin_all" ON public.governance_user_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
