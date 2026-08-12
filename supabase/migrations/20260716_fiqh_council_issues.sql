-- =====================================================================
--  المسائل الخلافية (Fiqh Council Issues) — الجداول الثلاثة المفقودة
--  التاريخ: 2026-07-16
--  آمن للتشغيل مرات متعددة (IF NOT EXISTS)
--
--  fiqh-council-issues-service.ts يستعلم هذه الجداول الثلاثة منذ إنشائه
--  لكنها لم تُنشَأ إطلاقًا في DB الحية — كانت الخدمة تعمل بسقوط احتياطي
--  سليم لبيانات seed (src/lib/fiqh-issues-seed.ts، 58 مسألة). هذه الهجرة
--  تُنشئ الجداول فقط بمخطط مطابق تمامًا لأنواع TypeScript
--  (FiqhCouncilIssue، FiqhTimelineEvent) ولقيود fiqh_council_items
--  الموجودة (نفس قائمة category)، تمهيدًا لسكربت تعبئة منفصل.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.fiqh_council_issues (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text NOT NULL UNIQUE,
  title              text NOT NULL,
  summary            text,
  description        text,
  category           text NOT NULL CHECK (category IN (
                       'العبادات','المعاملات','الأسرة','الطب والنوازل',
                       'الاقتصاد الإسلامي','الأقليات المسلمة','القضايا المعاصرة',
                       'الأطعمة والأشربة','الزكاة والوقف','الحج والعمرة'
                     )),
  subcategory        text,
  ruling_summary     text,
  evidence_summary   text,
  documentation_level text NOT NULL DEFAULT 'imported_needs_review'
                       CHECK (documentation_level IN ('official_verified','imported_needs_review','admin_summary','rejected','archived')),
  status             text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','archived')),
  views_count        integer NOT NULL DEFAULT 0,
  published_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiqh_council_issues_status ON public.fiqh_council_issues(status, documentation_level);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_issues_category ON public.fiqh_council_issues(category);

ALTER TABLE public.fiqh_council_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fiqh_council_issues_public_read" ON public.fiqh_council_issues;
CREATE POLICY "fiqh_council_issues_public_read" ON public.fiqh_council_issues
  FOR SELECT USING (status = 'published' AND documentation_level = 'official_verified');
DROP POLICY IF EXISTS "fiqh_council_issues_service_all" ON public.fiqh_council_issues;
CREATE POLICY "fiqh_council_issues_service_all" ON public.fiqh_council_issues
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ── جدول ربط المسألة بعناصر المجمع (fiqh_council_items) ──────────────────
CREATE TABLE IF NOT EXISTS public.fiqh_issue_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    uuid NOT NULL REFERENCES public.fiqh_council_issues(id) ON DELETE CASCADE,
  item_id     uuid NOT NULL REFERENCES public.fiqh_council_items(id) ON DELETE CASCADE,
  link_type   text NOT NULL DEFAULT 'related',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issue_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_fiqh_issue_items_issue ON public.fiqh_issue_items(issue_id, sort_order);

ALTER TABLE public.fiqh_issue_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fiqh_issue_items_public_read" ON public.fiqh_issue_items;
CREATE POLICY "fiqh_issue_items_public_read" ON public.fiqh_issue_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.fiqh_council_issues i WHERE i.id = issue_id AND i.status = 'published' AND i.documentation_level = 'official_verified')
  );
DROP POLICY IF EXISTS "fiqh_issue_items_service_all" ON public.fiqh_issue_items;
CREATE POLICY "fiqh_issue_items_service_all" ON public.fiqh_issue_items
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ── الخط الزمني لأحداث المسألة ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fiqh_issue_timeline_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    uuid NOT NULL REFERENCES public.fiqh_council_issues(id) ON DELETE CASCADE,
  event_type  text NOT NULL CHECK (event_type IN (
                'first_research','first_resolution','later_resolution',
                'recommendation','update','statement','other'
              )),
  title       text NOT NULL,
  description text,
  event_date  date,
  item_id     uuid REFERENCES public.fiqh_council_items(id) ON DELETE SET NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiqh_issue_timeline_issue ON public.fiqh_issue_timeline_events(issue_id, event_date);

ALTER TABLE public.fiqh_issue_timeline_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fiqh_issue_timeline_public_read" ON public.fiqh_issue_timeline_events;
CREATE POLICY "fiqh_issue_timeline_public_read" ON public.fiqh_issue_timeline_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.fiqh_council_issues i WHERE i.id = issue_id AND i.status = 'published' AND i.documentation_level = 'official_verified')
  );
DROP POLICY IF EXISTS "fiqh_issue_timeline_service_all" ON public.fiqh_issue_timeline_events;
CREATE POLICY "fiqh_issue_timeline_service_all" ON public.fiqh_issue_timeline_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
