-- ── RLS: islamic_stories ────────────────────────────────────────────────────
-- القصص الإسلامية: القراءة العامة للمعتمدة فقط، الكتابة للمشرفين فقط
-- يعتمد على دالة is_admin() الموجودة في قاعدة البيانات (MAJALISILM_PRODUCTION_SETUP.sql)

ALTER TABLE public.islamic_stories ENABLE ROW LEVEL SECURITY;

-- ── سياسة القراءة العامة (is_approved = true فقط) ────────────────────────
DROP POLICY IF EXISTS "islamic_stories_public_read" ON public.islamic_stories;
CREATE POLICY "islamic_stories_public_read"
  ON public.islamic_stories
  FOR SELECT
  USING (is_approved = true);

-- ── سياسة القراءة الإدارية (المشرفون يرون الكل) ─────────────────────────
DROP POLICY IF EXISTS "islamic_stories_admin_read" ON public.islamic_stories;
CREATE POLICY "islamic_stories_admin_read"
  ON public.islamic_stories
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND (role = 'admin' OR is_admin = true OR is_super_admin = true OR is_owner = true)
      )
    )
  );

-- ── سياسة الكتابة الإدارية (INSERT/UPDATE/DELETE للمشرفين) ───────────────
DROP POLICY IF EXISTS "islamic_stories_admin_write" ON public.islamic_stories;
CREATE POLICY "islamic_stories_admin_write"
  ON public.islamic_stories
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND (role = 'admin' OR is_admin = true OR is_super_admin = true OR is_owner = true)
      )
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND (role = 'admin' OR is_admin = true OR is_super_admin = true OR is_owner = true)
      )
    )
  );
