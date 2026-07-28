/**
 * ترحيل آمن لتوسيع حالات التصنيفات + سجل تدقيق.
 * يُطبَّق يدويًا في محرّر SQL في Supabase.
 *
 * لا يحذف أي صف. يوحّد الأسماء القديمة ويوسّع CHECK.
 */

-- 1) توسيع قيد الحالة
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_status_check;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_status_check
  CHECK (status IN (
    'draft',
    'pending_review',
    'published',
    'hidden',
    'rejected',
    'archived'
  ));

-- 2) توحيد القيم القديمة إن وُجدت (لا تُفقد البيانات)
UPDATE public.categories
SET status = 'pending_review'
WHERE lower(trim(status)) IN (
  'pending', 'review_pending', 'under_review', 'in_review', 'needs_review', 'pending_review'
);

UPDATE public.categories
SET status = 'hidden'
WHERE lower(trim(status)) IN ('hidden', 'unpublished', 'private');

UPDATE public.categories
SET status = 'rejected'
WHERE lower(trim(status)) IN ('rejected', 'declined');

UPDATE public.categories
SET status = 'archived'
WHERE lower(trim(status)) IN ('archived', 'archive', 'deleted');

UPDATE public.categories
SET status = 'published'
WHERE lower(trim(status)) IN ('published', 'approved', 'live');

UPDATE public.categories
SET status = 'draft'
WHERE status IS NULL
   OR trim(status) = ''
   OR lower(trim(status)) NOT IN (
     'draft', 'pending_review', 'published', 'hidden', 'rejected', 'archived'
   );

-- 3) أعمدة تتبع الحالة
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_changed_by UUID;

-- 4) سجل تدقيق
CREATE TABLE IF NOT EXISTS public.category_status_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS category_status_audit_category_idx
  ON public.category_status_audit (category_id, changed_at DESC);

ALTER TABLE public.category_status_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS category_status_audit_admin_all ON public.category_status_audit;
CREATE POLICY category_status_audit_admin_all
  ON public.category_status_audit
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5) إصلاح بنيوي آمن: نشر آباء العناصر المنشورة إن كانوا مسودة
--    (لا ينشر أوراقًا فارغة؛ يصلح فقط ثقب الأب المسودة الذي يخفي الفروع)
WITH RECURSIVE published_nodes AS (
  SELECT id, parent_id FROM public.categories WHERE status = 'published'
  UNION
  SELECT c.id, c.parent_id
  FROM public.categories c
  JOIN published_nodes p ON c.id = p.parent_id
)
UPDATE public.categories c
SET status = 'published',
    status_reason = COALESCE(c.status_reason, 'إصلاح تلقائي: أب لعنصر منشور'),
    status_changed_at = now()
WHERE c.id IN (SELECT id FROM published_nodes)
  AND c.status = 'draft';

-- 6) RLS: العام يرى المنشور فقط؛ المشرف يرى الكل (بدون تغيير منطق الكتابة إن وُجد)
DROP POLICY IF EXISTS categories_select ON public.categories;
CREATE POLICY categories_select ON public.categories
  FOR SELECT
  USING (status = 'published' OR public.is_admin());
