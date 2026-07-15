-- ════════════════════════════════════════════════════════════════════════
-- إنشاء annual_courses — لوحة إدارة الدورات السنوية كانت معطَّلة بالكامل
-- ════════════════════════════════════════════════════════════════════════
--
-- نفس نمط fatwas (create_fatwas_v1.sql): اكتُشف عبر تدقيق حي بالمتصفح أن
-- /annual-courses يستدعي annual_courses على كل تحميل فيفشل بـ404 (PGRST205)
-- — سقوط احتياطي سليم لبيانات ثابتة فلا يكسر الزائر العادي، لكن
-- src/views/admin/AnnualCoursesSection.tsx وplatform-supabase.ts
-- (adminGetAllCourses/adminUpsertCourse/adminDeleteCourse) معطَّلة بالكامل.
--
-- المخطّط مطابق حرفيًا لنوع AnnualCourse في src/lib/platform-types.ts، بالإضافة
-- إلى archived_at (تُستخدم فعليًا في الاستعلام في platform-content-service.ts
-- رغم غياب الحقل من التعريف — تناقض طفيف بين الكود والنوع، أُصلح بإضافتها هنا
-- لأنها الحقل المُستهلَك فعليًا لا التعريف).
--
-- idempotent بالكامل.
-- التشغيل: npx supabase db query --linked --file supabase/create_annual_courses_v1.sql
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.annual_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key text,
  title text NOT NULL,
  summary text,
  body text,
  course_type text NOT NULL DEFAULT 'سنوية' CHECK (course_type IN ('سنوية', 'موسمية', 'برنامج', 'متن')),
  season text,
  year integer,
  sheikh_names text[] NOT NULL DEFAULT '{}',
  mutoon text[] NOT NULL DEFAULT '{}',
  schedule jsonb NOT NULL DEFAULT '[]',
  venue_name text,
  venue_address text,
  venue_city text,
  map_url text,
  registration_url text,
  registration_open boolean NOT NULL DEFAULT false,
  start_date date,
  end_date date,
  keywords text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'archived', 'rejected')),
  view_count integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS annual_courses_external_key_key ON public.annual_courses (external_key) WHERE external_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS annual_courses_status_idx ON public.annual_courses (status);
CREATE INDEX IF NOT EXISTS annual_courses_year_idx ON public.annual_courses (year);

DROP TRIGGER IF EXISTS trg_annual_courses_updated_at ON public.annual_courses;
CREATE TRIGGER trg_annual_courses_updated_at BEFORE UPDATE ON public.annual_courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.annual_courses ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.annual_courses FROM anon, authenticated;
GRANT SELECT ON public.annual_courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.annual_courses TO authenticated;

DROP POLICY IF EXISTS "annual_courses_public_read" ON public.annual_courses;
CREATE POLICY "annual_courses_public_read" ON public.annual_courses
  FOR SELECT
  USING (status = 'approved' AND archived_at IS NULL);

DROP POLICY IF EXISTS "annual_courses_admin_all" ON public.annual_courses;
CREATE POLICY "annual_courses_admin_all" ON public.annual_courses
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
