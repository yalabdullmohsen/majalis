-- ملاحظة: يُستخدم الرمز __OWNER_EMAIL__ بدلًا من بريد المالك الفعلي حتى لا يُخزَّن بريد شخصي في المستودع.
-- قبل التشغيل استبدله ببريد المالك، أو مرِّر MAJALIS_OWNER_EMAILS لسكربت التطبيق ليستبدله تلقائيًا.
-- ═══════════════════════════════════════════════════════════════════════════
-- ensure_admin_delete_v1.sql
-- حلّ جذري لمشكلة "لا يسمح بحذف الدرس". السبب الشائع: is_admin() تُرجع false على
-- الخادم (RLS) فيُمنع الحذف صامتاً (0 صفوف، بلا خطأ)، أو مفتاح خارجي يمنع الحذف.
--
-- هذا الملف:
--   1) يعيد ترسيخ صلاحيات المالك الرسمي (حتى تنجح is_admin() على الخادم).
--   2) يعيد إنشاء سياسة RLS التي تسمح للمشرف بالحذف (FOR ALL) على lessons.
--   3) يكشف أي مفتاح خارجي نحو lessons يمنع الحذف (NO ACTION/RESTRICT).
-- آمن وidempotent، لا يحذف أي بيانات.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1) تأكيد صلاحيات المالك (سبب RLS الأكثر شيوعاً) ────────────────────────
DO $$
DECLARE v_owner_id UUID;
BEGIN
  SELECT id INTO v_owner_id FROM auth.users
  WHERE lower(trim(email)) = '__OWNER_EMAIL__' LIMIT 1;

  IF v_owner_id IS NULL THEN
    RAISE NOTICE '⚠️ حساب المالك غير موجود في auth.users.';
  ELSE
    UPDATE profiles
    SET role='super_admin', is_admin=true, is_super_admin=true, is_owner=true, status='active'
    WHERE id = v_owner_id;

    INSERT INTO governance_user_roles (user_id, role_id, assigned_by, assigned_at, updated_at)
    VALUES (v_owner_id, 'super_admin', v_owner_id, now(), now())
    ON CONFLICT (user_id) DO UPDATE SET role_id='super_admin', updated_at=now();

    RAISE NOTICE '✅ تم تأكيد صلاحيات المالك (super_admin/is_admin/is_owner).';
  END IF;
END $$;

-- ── 2) ضمان سياسة RLS التي تسمح للمشرف بالحذف على lessons ─────────────────
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lessons_admin ON lessons;
CREATE POLICY lessons_admin ON lessons
  FOR ALL
  USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ── 3) كشف المفاتيح الخارجية التي قد تمنع حذف الدرس ───────────────────────
DO $$
DECLARE r RECORD; n INT := 0;
BEGIN
  RAISE NOTICE '── مفاتيح خارجية نحو lessons تمنع الحذف (NO ACTION/RESTRICT) ──';
  FOR r IN
    SELECT c.relname AS tbl, con.conname, pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    JOIN pg_class c  ON c.oid  = con.conrelid
    JOIN pg_class fc ON fc.oid = con.confrelid
    JOIN pg_namespace fn ON fn.oid = fc.relnamespace
    WHERE con.contype = 'f' AND fc.relname = 'lessons' AND fn.nspname = 'public'
      AND con.confdeltype IN ('a', 'r')   -- a=NO ACTION، r=RESTRICT
  LOOP
    n := n + 1;
    RAISE NOTICE '  %.% : %', r.tbl, r.conname, r.def;
  END LOOP;
  IF n = 0 THEN
    RAISE NOTICE '  ✅ لا مفاتيح مانعة — كلها CASCADE/SET NULL، الحذف لن يُحجب بسبب FK.';
  ELSE
    RAISE NOTICE '  ⚠️ % مفتاح مانع — حوّله إلى ON DELETE CASCADE أو SET NULL ليُسمح بالحذف.', n;
  END IF;
END $$;
