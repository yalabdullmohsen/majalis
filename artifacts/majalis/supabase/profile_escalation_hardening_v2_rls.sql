-- ════════════════════════════════════════════════════════════════════════
-- Profile Privilege-Escalation Hardening v2 — دفاع ثانٍ على مستوى RLS
-- ════════════════════════════════════════════════════════════════════════
--
-- v1 (profile_escalation_hardening_v1.sql) أغلق الثغرة عبر توسعة trigger
-- واحد (protect_bootstrap_owners). هذا الملف يضيف طبقة دفاع مستقلة على
-- مستوى RLS نفسها — لا تعتمد على بقاء أي trigger مُفعَّلًا مستقبلًا (لو
-- عُطِّل trigger بالخطأ في هجرة قادمة، تبقى RLS وحدها كافية للمنع).
--
-- اكتُشف أثناء المراجعة: ملف supabase/hotfix_profile_role_escalation_2026-07-14.sql
-- (من جلسة سابقة) صمَّم بالضبط هذه الفكرة (سياستان: مسؤول = بلا قيد، صاحب
-- الصف = ممنوع من تغيير أعمدة الصلاحيات) لكن تعليقه الختامي يقرّ صراحةً:
-- "لم يُطبَّق أي شيء من هذا الملف على أي قاعدة بيانات". كما أن أسماء
-- السياسات التي يحاول حذفها (profiles_update_self وغيرها) لا تطابق الاسم
-- الفعلي الحالي ("كل شخص يعدّل ملفه فقط") — تطبيقه حرفيًا كان سيضيف سياسات
-- جديدة مقيَّدة **بجانب** السياسة القديمة الفضفاضة دون حذفها، فتبقى الثغرة
-- مفتوحة عمليًا رغم ظهور "إصلاح" في القاعدة (لأن سياسات RLS تُجمَع بـ OR).
-- هذا الملف يصحح ذلك: يحذف الاسم الفعلي الحالي صراحةً، ويعيد استخدام
-- is_admin() الموجودة أصلًا (أشمل من إعادة تعريف دالة مكافئة).
--
-- idempotent بالكامل. التشغيل:
--   npx supabase db query --linked --file supabase/profile_escalation_hardening_v2_rls.sql
-- ════════════════════════════════════════════════════════════════════════

-- تنظيف: prevent_profile_role_escalation() كانت موجودة في المخطّط (أنشأتها
-- هجرة قديمة) لكن غير مربوطة بأي trigger — ومنطقها معطوب فعليًا (خروج مبكر
-- IF NEW.is_owner=true THEN RETURN NEW بلا فحص — نفس ثغرة NEW-بدل-OLD).
-- كود ميت خطر: لو رُبطت بالخطأ مستقبلًا (نسخ-لصق من ملف هجرة قديم) تُعيد فتح
-- الثغرة فورًا. حُذفت لأنها غير مستخدمة ومنطقها غير قابل للإصلاح الآمن بأثر رجعي.
DROP FUNCTION IF EXISTS public.prevent_profile_role_escalation();

CREATE OR REPLACE FUNCTION public.profile_privileges_unchanged(
  p_id             uuid,
  p_role           text,
  p_is_admin       boolean,
  p_is_super_admin boolean,
  p_is_owner       boolean
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_id
      AND p.role::text     IS NOT DISTINCT FROM p_role
      AND p.is_admin       IS NOT DISTINCT FROM p_is_admin
      AND p.is_super_admin IS NOT DISTINCT FROM p_is_super_admin
      AND p.is_owner       IS NOT DISTINCT FROM p_is_owner
  );
$$;

REVOKE ALL ON FUNCTION public.profile_privileges_unchanged(uuid, text, boolean, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_privileges_unchanged(uuid, text, boolean, boolean, boolean)
  TO authenticated, service_role;

-- حذف الاسم الفعلي الحالي — هذا ما فات الملف السابق (كان يحذف اسمًا لا وجود له).
DROP POLICY IF EXISTS "كل شخص يعدّل ملفه فقط" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- (أ) مسؤول فعلي (is_admin() — تشمل profiles وgovernance_user_roles): تعديل كامل.
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- (ب) صاحب الصف: بياناته العامة فقط — ممنوع تغيير أي عمود صلاحيات إطلاقًا،
--     حتى لو حاول تمرير نفس القيمة الحالية أو غيّرها لأي اتجاه (لا فرق بين
--     تصعيد وتنزيل هنا؛ صاحب الصف ببساطة لا يملك حق لمس هذه الأعمدة).
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND public.profile_privileges_unchanged(
          id, role::text, is_admin, is_super_admin, is_owner
        )
  );
