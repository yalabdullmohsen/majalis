-- ════════════════════════════════════════════════════════════════════════════
-- إصلاح أمني حرج — ثغرة تصعيد الصلاحيات في profiles
-- التاريخ: 2026-07-14
-- ملف هجرة جديد فقط — لا يعدّل أي ملف SQL سابق، ويُشغَّل بعدها جميعًا.
-- ════════════════════════════════════════════════════════════════════════════
--
-- ● وصف الثغرة (CRITICAL — تصعيد صلاحيات من أي مستخدم مسجَّل إلى مالك المنصة)
--
--   الدالة prevent_profile_role_escalation() — كما هي في:
--     • artifacts/majalis/supabase/MAJALISILM_PRODUCTION_SETUP.sql:149-175
--     • artifacts/majalis/supabase/owner_bootstrap_v1.sql:95
--   تبدأ بهذا الشرط:
--
--       IF NEW.is_owner = true OR NEW.is_super_admin = true OR NEW.role = 'super_admin' THEN
--         RETURN NEW;   -- ← خروج مبكر بلا أي فحص
--       END IF;
--
--   الفحص يقع على NEW (القيم القادمة من طلب المستخدم) لا على OLD (القيم
--   المخزَّنة فعلًا). أي مستخدم عادي يستطيع تنفيذ:
--
--       update profiles set is_owner = true where id = auth.uid();
--
--   فتُطابق NEW.is_owner = true فيُرجَع الصف كما هو دون أن يمرّ على منطق
--   الإرجاع القسري أدناه — فيصبح مالك المنصة. النية الأصلية كانت «إعفاء صفوف
--   المالكين القائمين من القسر»، لكن بناءها على NEW حوّل الحارس إلى باب خلفي.
--
--   السياسة الحالية على profiles تسمح بذلك (supabase/platform_v2_schema_fixed.sql:517-520):
--       FOR UPDATE USING (is_admin() OR auth.uid() = id)
--                WITH CHECK (is_admin() OR auth.uid() = id)
--   أي أن المحفّز كان خط الدفاع الوحيد.
--
-- ● الإصلاح
--   1) الإعفاء يُبنى على OLD: من كان فعلًا مالكًا/مشرفًا أعلى في الصف المخزَّن
--      هو وحده المعفى — ولا اعتبار إطلاقًا لما يدّعيه NEW.
--   2) أي مستدعٍ ليس مشرفًا فعليًا تُعاد أعمدة الصلاحيات
--      (role, is_admin, is_super_admin, is_owner) إلى قيم OLD قسرًا وبلا شرط.
--   3) دفاع ثانٍ على مستوى RLS: سياسة UPDATE جديدة لا تسمح لغير المشرف بتغيير
--      أعمدة الصلاحيات إطلاقًا (لا تعتمد على المحفّز وحده).
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) دالة مساعدة: هل المستدعي الحالي مشرف فعلي؟
--    is_admin() القديمة في platform_v2 تفحص role = 'admin' فقط، فلا تعترف
--    بـ super_admin/owner. هذه الدالة تغطي الحالات كلها.
--    SECURITY DEFINER كي تقرأ profiles دون الاصطدام بسياسات RLS.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role::text IN ('admin', 'super_admin')
        OR COALESCE(p.is_admin, false)       = true
        OR COALESCE(p.is_super_admin, false) = true
        OR COALESCE(p.is_owner, false)       = true
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) الحارس المصحَّح — الإعفاء على OLD، والقسر على كل غير مشرف
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean := public.is_platform_admin();
  row_was_owner   boolean := COALESCE(OLD.is_owner, false)
                             OR COALESCE(OLD.is_super_admin, false)
                             OR OLD.role::text = 'super_admin';
BEGIN
  -- ملاحظة أمنية: الشرط مبنيّ على OLD حصرًا. البناء على NEW (الباغ القديم)
  -- كان يسمح لأي مستخدم بمنح نفسه is_owner ثم الإفلات من الفحص.
  IF caller_is_admin AND row_was_owner THEN
    -- الصف مالك/مشرف أعلى فعلًا، والمستدعي مشرف فعلي → لا قسر.
    RETURN NEW;
  END IF;

  IF caller_is_admin THEN
    -- مشرف فعلي يعدّل صف مستخدم عادي → مسموح (إدارة الأدوار وظيفة إدارية).
    RETURN NEW;
  END IF;

  -- ── أي مستدعٍ غير مشرف: تُعاد أعمدة الصلاحيات إلى قيم OLD قسرًا وبلا شرط.
  --    (بلا IF ... IS DISTINCT FROM — الإسناد المباشر أضيق للخطأ.)
  NEW.role           := OLD.role;
  NEW.is_admin       := OLD.is_admin;
  NEW.is_super_admin := OLD.is_super_admin;
  NEW.is_owner       := OLD.is_owner;

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) إعادة ربط المحفّز (الاسم كما في platform_v2_schema_fixed.sql:474-477)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) دفاع ثانٍ — RLS لا تعتمد على المحفّز
--
--    RLS لا تتيح الإشارة إلى OLD داخل WITH CHECK، فنقارن قيم NEW بالقيم
--    المخزَّنة عبر دالة STABLE تقرأ لقطة ما قبل التحديث للصف نفسه.
-- ─────────────────────────────────────────────────────────────────────────────
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
SET search_path = public
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

-- إزالة السياسة الفضفاضة القديمة (كانت تسمح للمستخدم بكتابة أعمدة الصلاحيات
-- على صفه، تاركةً الحارس المعطوب خطَّ الدفاع الوحيد).
DROP POLICY IF EXISTS "المشرف يدير الملفات" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- (أ) المشرف الفعلي: تعديل كامل.
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- (ب) المستخدم على صفه هو: مسموح بتعديل البيانات العامة فقط،
--     وممنوع منعًا باتًّا من تغيير أي عمود صلاحيات.
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND public.profile_privileges_unchanged(
          id, role::text, is_admin, is_super_admin, is_owner
        )
  );

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- ● اختبار تحقق يدوي (توضيحي — لا يُشغَّل تلقائيًا)
--
--   لم يُطبَّق أي شيء من هذا الملف على أي قاعدة بيانات؛ الخطوات أدناه هي
--   ما يجب تنفيذه يدويًا على بيئة اختبار بعد تشغيل الهجرة.
--
--   -- (0) تحضير: مستخدم عادي معروف
--   --     نفّذ التالي بجلسة مستخدم عادي (JWT عبر PostgREST/Supabase client)
--   --     أو بمحاكاة الدور:
--   --       set local role authenticated;
--   --       set local request.jwt.claims = '{"sub":"<USER_UUID>","role":"authenticated"}';
--
--   -- (1) محاولة الاستيلاء المباشرة — يجب أن تفشل أو لا تُحدث أثرًا
--   update profiles set is_owner = true where id = auth.uid();
--   -- المتوقع: خطأ "new row violates row-level security policy" (سياسة ب)،
--   --          أو نجاح شكلي مع بقاء is_owner = false (قسر المحفّز).
--   select role, is_admin, is_super_admin, is_owner from profiles where id = auth.uid();
--   -- المتوقع: (user, false, false, false)  ← لا تصعيد
--
--   -- (2) بقية صيغ الاستيلاء — يجب أن تفشل جميعها بالمثل
--   update profiles set is_super_admin = true where id = auth.uid();
--   update profiles set role = 'super_admin'  where id = auth.uid();
--   update profiles set is_admin = true       where id = auth.uid();
--   update profiles set role = 'super_admin', is_owner = true, is_super_admin = true
--     where id = auth.uid();
--   select role, is_admin, is_super_admin, is_owner from profiles where id = auth.uid();
--   -- المتوقع في كل الحالات: (user, false, false, false)
--
--   -- (3) التعديل المشروع للبيانات العامة — يجب أن ينجح
--   update profiles set full_name = 'اسم محدَّث', city = 'الكويت' where id = auth.uid();
--   -- المتوقع: نجاح، وبقاء أعمدة الصلاحيات كما هي.
--
--   -- (4) صف مستخدم آخر — يجب أن يفشل
--   update profiles set full_name = 'اختراق' where id <> auth.uid();
--   -- المتوقع: 0 صفوف متأثرة (USING تمنع الرؤية للتحديث).
--
--   -- (5) المشرف الفعلي — يجب أن ينجح
--   --     بجلسة مشرف (role = 'admin' أو is_admin = true):
--   update profiles set role = 'sheikh' where id = '<SOME_USER_UUID>';
--   -- المتوقع: نجاح.
--
--   -- (6) تراجع (rollback) عند الحاجة:
--   --     أعد تشغيل تعريف الدالة/السياسة القديم من
--   --     supabase/platform_v2_schema_fixed.sql — لكن انتبه أن ذلك يُعيد الثغرة.
-- ════════════════════════════════════════════════════════════════════════════
