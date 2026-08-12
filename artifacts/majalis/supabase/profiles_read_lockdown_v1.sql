-- ════════════════════════════════════════════════════════════════════════
-- Profiles Read Lockdown v1 — إغلاق آخر فجوة معروفة على الجداول الحساسة الأربعة
-- (profiles, governance_user_roles, open_api_keys, open_webhooks)
-- ════════════════════════════════════════════════════════════════════════
--
-- الثلاثة الأخرى (governance_user_roles, open_api_keys, open_webhooks) مُقفَلة
-- فعلًا من التزامات سابقة هذه الجلسة (تحقُّق: صفر سياسات PUBLIC متبقية عليها،
-- RLS مفعَّلة، صفر صفوف تُعاد لـanon). المتبقي فقط: profiles لا تزال تحمل
-- سياسة SELECT عامة ("الجميع يقرأ الملفات العامة"، USING(true) لكل الأدوار)
-- تتيح لأي مجهول قراءة id/is_owner/is_super_admin/role/... لكل مستخدم مسجَّل
-- في المنصة — تسريب معلومات (من هو المسؤول؟ من هو المالك؟) وإن لم تسمح بالكتابة.
--
-- فحص الاستهلاك الفعلي عبر src/ (عميل المتصفح فقط — lib/*.mjs تستخدم
-- service_role وغير معنية بـRLS إطلاقًا):
--   1) قراءة الملف الشخصي للمستخدم نفسه (تسجيل الدخول/الإعدادات) — self فقط.
--   2) عدّاد "إجمالي المستخدمين" في لوحة تحكم الإدارة (COUNT فقط) — يحتاج
--      رؤية كل الصفوف، لكن فقط من مسؤول فعلي.
--   لا وجود لأي "بطاقة مؤلف" أو عرض عام لملف مستخدم آخر في الكود الحالي.
--
-- الإصلاح: استبدال السياسة العامة بسياستين مضبوطتين. لا تغيير على INSERT
-- أو UPDATE (مُصلَحتان فعلًا من قبل).
--
-- idempotent بالكامل، غير مدمر (لا DROP TABLE ولا حذف بيانات — تعديل سياسات فقط).
-- التشغيل: npx supabase db query --linked --file supabase/profiles_read_lockdown_v1.sql
-- ════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "الجميع يقرأ الملفات العامة" ON public.profiles;

CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_admin_read" ON public.profiles
  FOR SELECT
  USING (public.is_admin());
