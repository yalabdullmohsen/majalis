-- ═══════════════════════════════════════════════════════════════════════════
-- delete_admins_except_owner_v1.sql
-- حذف جميع حسابات المشرفين نهائياً عدا الحساب الرسمي الوحيد للمالك.
--
--   الحساب المُبقى (المالك): yalabdullmohsen1@gmail.com
--   (نفس الإيميل المحمي في owner_bootstrap_v1.sql / protect_bootstrap_owners)
--
-- تعريف "حساب مشرف" = أي حساب يحقّق أحد شروط is_admin():
--   profiles.role IN ('admin','super_admin') أو is_admin/is_super_admin/is_owner
--   أو governance_user_roles.role_id IN ('super_admin','system_admin','content_manager')
--
-- الأثر:
--   • يحذف صفوف هؤلاء من profiles ثم من auth.users (يحذف الحساب نهائياً).
--   • بيانات المستخدم الشخصية (إشارات مرجعية، تقييمات، مقترحات...) تُحذف تِبَعاً
--     عبر ON DELETE CASCADE — وهذا سلوك مقصود لحذف الحساب.
--   • المحتوى الديني (دروس/أحكام/فتاوى...) لا يُحذف: كل مراجع created_by نحو
--     profiles هي ON DELETE SET NULL، فيبقى المحتوى وتُفرَّغ نسبة التأليف فقط.
--
-- ⚠️ عملية غير قابلة للتراجع. نفّذ القسم (أ) أولاً للمعاينة، ثم القسم (ب).
-- شغّل في Supabase SQL Editor بدور الخدمة/المالك.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────
-- القسم (أ) — معاينة: من الذي سيُحذف؟  (لا يحذف شيئاً — نفّذه أولاً وراجعه)
-- ─────────────────────────────────────────────────────────────────────────
SELECT u.email,
       p.role, p.is_admin, p.is_super_admin, p.is_owner,
       (SELECT g.role_id FROM governance_user_roles g WHERE g.user_id = p.id) AS governance_role
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE lower(trim(u.email)) <> 'yalabdullmohsen1@gmail.com'
  AND (
    p.role IN ('admin', 'super_admin')
    OR p.is_admin OR p.is_super_admin OR p.is_owner
    OR EXISTS (
      SELECT 1 FROM governance_user_roles g
      WHERE g.user_id = p.id AND g.role_id IN ('super_admin', 'system_admin', 'content_manager')
    )
  )
ORDER BY u.email;


-- ─────────────────────────────────────────────────────────────────────────
-- القسم (ب) — التنفيذ: احذف حسابات المشرفين عدا المالك
--   نفّذه فقط بعد مراجعة نتيجة القسم (أ) والتأكد من القائمة.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_owner_email TEXT := 'yalabdullmohsen1@gmail.com';
  v_owner_id    UUID;
  v_targets     UUID[];
  v_deleted     INTEGER := 0;
BEGIN
  -- تحديد المالك — الإجهاض إن لم يوجد حتى لا نحذف كل المشرفين بلا بديل
  SELECT id INTO v_owner_id
  FROM auth.users WHERE lower(trim(email)) = v_owner_email LIMIT 1;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'حساب المالك % غير موجود — تم الإجهاض تفادياً لحذف جميع المشرفين.', v_owner_email;
  END IF;

  -- جمع معرّفات حسابات المشرفين (عدا المالك) من profiles ومن governance
  SELECT array_agg(DISTINCT uid) INTO v_targets FROM (
    SELECT p.id AS uid
    FROM profiles p
    WHERE p.id <> v_owner_id
      AND (p.role IN ('admin','super_admin') OR p.is_admin OR p.is_super_admin OR p.is_owner)
    UNION
    SELECT g.user_id AS uid
    FROM governance_user_roles g
    WHERE g.user_id <> v_owner_id
      AND g.role_id IN ('super_admin','system_admin','content_manager')
  ) t;

  IF v_targets IS NULL OR array_length(v_targets, 1) IS NULL THEN
    RAISE NOTICE 'لا توجد حسابات مشرفين أخرى للحذف. المالك % وحده.', v_owner_email;
    RETURN;
  END IF;

  -- حماية صريحة: تأكيد أن المالك ليس ضمن القائمة إطلاقاً
  IF v_owner_id = ANY(v_targets) THEN
    RAISE EXCEPTION 'خطأ حماية: معرّف المالك ظهر ضمن قائمة الحذف — تم الإجهاض.';
  END IF;

  -- حذف صفوف profiles أولاً (مراجع created_by نحوها = SET NULL فيبقى المحتوى)
  DELETE FROM profiles WHERE id = ANY(v_targets);

  -- حذف الحسابات من auth.users (يحذف بيانات المستخدم الشخصية تِبَعاً عبر CASCADE)
  DELETE FROM auth.users WHERE id = ANY(v_targets);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RAISE NOTICE 'تم حذف % حساب مشرف نهائياً. المالك % محتفَظ به.', v_deleted, v_owner_email;
END $$;


-- ─────────────────────────────────────────────────────────────────────────
-- القسم (ج) — تحقّق: يُفترض أن يبقى المالك وحده صاحب صلاحية إشراف
-- ─────────────────────────────────────────────────────────────────────────
SELECT u.email, p.role, p.is_admin, p.is_super_admin, p.is_owner,
       (SELECT g.role_id FROM governance_user_roles g WHERE g.user_id = p.id) AS governance_role
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role IN ('admin', 'super_admin')
   OR p.is_admin OR p.is_super_admin OR p.is_owner
   OR EXISTS (
     SELECT 1 FROM governance_user_roles g
     WHERE g.user_id = p.id AND g.role_id IN ('super_admin', 'system_admin', 'content_manager')
   )
ORDER BY u.email;
