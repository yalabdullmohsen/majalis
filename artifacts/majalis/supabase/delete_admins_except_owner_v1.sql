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
--   • نقل ملكية المحتوى: قبل الحذف تُنقل أعمدة التأليف (created_by /
--     created_by_user_id / author_id / contributed_by) من الحسابات المحذوفة
--     إلى المالك — فيصبح المالك مؤلّف محتواهم بدل تفريغ النسبة.
--   • يحذف صفوف هؤلاء من profiles ثم من auth.users (يحذف الحساب نهائياً).
--   • بيانات المستخدم الشخصية (إشارات مرجعية، تقييمات، مقترحات...) تُحذف تِبَعاً
--     عبر ON DELETE CASCADE — وهذا سلوك مقصود لحذف الحساب.
--   • أعمدة التوثيق/المراجعة (reviewed_by / verified_by) وأعمدة التدقيق
--     (changed_by) لا تُنقل عمداً — كي لا نُزوّر مَن راجَع/وثّق المحتوى الديني؛
--     تبقى كما هي أو تُفرَّغ طبيعياً (SET NULL).
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

  -- نقل ملكية المحتوى للمالك قبل الحذف:
  -- نكتشف من كتالوج القاعدة كل عمود FK نحو profiles(id) أو auth.users(id)
  -- اسمه ضمن قائمة التأليف، ونحوّل صفوف الحسابات المحذوفة إلى المالك.
  -- (أعمدة المراجعة/التوثيق/التدقيق مستثناة عمداً — انظر رأس الملف)
  DECLARE
    r        RECORD;
    v_rows   INTEGER;
    v_moved  INTEGER := 0;
    authorship_cols TEXT[] := ARRAY['created_by', 'created_by_user_id', 'author_id', 'contributed_by'];
  BEGIN
    FOR r IN
      SELECT n.nspname AS sch, c.relname AS tbl, a.attname AS col
      FROM pg_constraint con
      JOIN pg_class     c  ON c.oid  = con.conrelid
      JOIN pg_namespace n  ON n.oid  = c.relnamespace
      JOIN pg_attribute a  ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
      JOIN pg_class     fc ON fc.oid = con.confrelid
      JOIN pg_namespace fn ON fn.oid = fc.relnamespace
      WHERE con.contype = 'f'
        AND ( (fn.nspname = 'auth'   AND fc.relname = 'users')
           OR (fn.nspname = 'public' AND fc.relname = 'profiles') )
        AND a.attname = ANY(authorship_cols)
        AND array_length(con.conkey, 1) = 1   -- مفاتيح مفردة فقط
    LOOP
      EXECUTE format('UPDATE %I.%I SET %I = $1 WHERE %I = ANY($2)', r.sch, r.tbl, r.col, r.col)
        USING v_owner_id, v_targets;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows > 0 THEN
        RAISE NOTICE '  نقل % صف: %.% (%)', v_rows, r.sch, r.tbl, r.col;
        v_moved := v_moved + v_rows;
      END IF;
    END LOOP;
    RAISE NOTICE 'إجمالي صفوف المحتوى المنقولة ملكيتها للمالك: %', v_moved;
  END;

  -- حذف صفوف profiles أولاً (بقية المراجع نحوها = SET NULL)
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
