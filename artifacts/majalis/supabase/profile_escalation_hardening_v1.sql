-- ════════════════════════════════════════════════════════════════════════
-- Profile Privilege-Escalation Hardening v1
-- ════════════════════════════════════════════════════════════════════════
--
-- المشكلة المكتشفة (فحص حي لسياسات RLS ومُشغِّلات profiles):
--
-- 1) سياسة UPDATE على profiles هي `auth.uid() = id` بلا with_check — أي عمود
--    قابل للتعديل من صاحب الصف نفسه، بما فيها is_owner/is_super_admin/is_admin/role.
-- 2) المُشغِّل الوحيد على UPDATE (protect_bootstrap_owners) يحمي فقط من:
--      أ) تعديل صف المالك المحمي (بريده في protected_emails) — يُعيد فرض
--         صلاحياته الكاملة دائمًا (سليم، يبقى كما هو).
--      ب) تنزيل is_owner من true إلى false لأي صف (يمنع non-owner من خفض مالك).
--    لكنه لا يفحص إطلاقًا الاتجاه المعاكس: أي مستخدم عادي مسجَّل (لا علاقة له
--    بالبريد المحمي) يستطيع استدعاء PATCH على صفه الخاص مباشرة عبر PostgREST
--    ويضبط is_owner=true أو is_super_admin=true أو role='super_admin' بنفسه —
--    السياسة تسمح بذلك (auth.uid()=id يتحقق لأنه يعدّل صفّه هو) والمُشغِّل لا
--    يعترض لأن الشرط الوحيد الموجود هو "true → false" لا "false → true".
--    هذه ثغرة تصعيد صلاحيات كاملة قابلة للاستغلال بطلب PATCH واحد بلا أي علم برمجي متقدم.
--
-- التحقق: المسار الشرعي الوحيد لمنح is_owner/admin هو promote_bootstrap_owner()
-- (SECURITY DEFINER، محصور ببريد واحد ثابت) — لا وجود لواجهة "ترقية مستخدم"
-- عادية تعتمد على UPDATE مباشر من طرف مستخدم غير مسؤول، فحظر هذا المسار كليًا
-- لا يكسر أي ميزة قائمة.
--
-- الإصلاح:
--  1) توسعة protect_bootstrap_owners(): أي محاولة رفع is_owner/is_super_admin/
--     is_admin/role إلى قيمة أعلى صلاحية من صف لا يخص البريد المحمي تُرفض ما لم
--     يكن المستدعي (auth.uid()) مسؤولًا بالفعل (is_admin()).
--  2) تضييق سياسة INSERT (كانت with_check: true بلا قيد) — دفاع بعمق: لا يوجد
--     مسار عميل حقيقي يُدرج صفًا مباشرة (handle_new_user() هو من يُنشئ الصف
--     تلقائيًا)، فتُقيَّد الإدراجات المباشرة بألا تحمل صلاحيات مرتفعة إلا من مسؤول.
--
-- idempotent بالكامل (CREATE OR REPLACE FUNCTION + DROP POLICY IF EXISTS).
-- التشغيل: npx supabase db query --linked --file supabase/profile_escalation_hardening_v1.sql
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.protect_bootstrap_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  owner_email TEXT;
  protected_emails TEXT[] := ARRAY['yalabdullmohsen1@gmail.com'];
  is_protected_row BOOLEAN;
BEGIN
  SELECT lower(trim(u.email)) INTO owner_email
  FROM auth.users u
  WHERE u.id = COALESCE(NEW.id, OLD.id);

  is_protected_row := owner_email IS NOT NULL AND owner_email = ANY(protected_emails);

  IF is_protected_row THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete protected platform owner: %', owner_email;
    END IF;

    NEW.role := 'super_admin';
    NEW.is_admin := true;
    NEW.is_super_admin := true;
    NEW.is_owner := true;
    NEW.status := 'active';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_owner = true AND NEW.is_owner = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE p.id = auth.uid()
        AND (
          p.is_owner = true
          OR lower(trim(u.email)) = ANY(protected_emails)
        )
    ) THEN
      RAISE EXCEPTION 'Cannot demote a platform owner';
    END IF;
  END IF;

  -- إغلاق ثغرة التصعيد: صف غير محمي يحاول رفع صلاحيته من false/عادي إلى admin/owner.
  -- auth.uid() IS NULL يعني الاستدعاء ليس بجلسة مستخدم (service_role أو اتصال DB
  -- مباشر) — هذان مسیاران موثوقان أصلًا بامتلاك مفتاح الخدمة السرّي، فيُستثنيان
  -- (هما مسار lib/owner-promotion.mjs الشرعي، وقد يُرقّي بريدًا غير المالك الثابت).
  IF TG_OP = 'UPDATE' AND NOT is_protected_row AND auth.uid() IS NOT NULL THEN
    IF (NEW.is_owner IS TRUE AND COALESCE(OLD.is_owner, false) = false)
       OR (NEW.is_super_admin IS TRUE AND COALESCE(OLD.is_super_admin, false) = false)
       OR (NEW.is_admin IS TRUE AND COALESCE(OLD.is_admin, false) = false)
       OR (NEW.role::text IN ('admin', 'super_admin') AND COALESCE(OLD.role::text, '') NOT IN ('admin', 'super_admin'))
    THEN
      IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'privilege_escalation_blocked: only an existing admin can grant admin/owner privileges';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS "المحفّز ينشئ ملف المستخدم" ON public.profiles;
CREATE POLICY "المحفّز ينشئ ملف المستخدم" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND COALESCE(is_owner, false) = false
    AND COALESCE(is_super_admin, false) = false
    AND COALESCE(is_admin, false) = false
    AND COALESCE(role, 'user') NOT IN ('admin', 'super_admin')
  );
