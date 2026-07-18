-- ════════════════════════════════════════════════════════════════════════
-- إنشاء content_views — جدول موجود في كود التطبيق منذ فترة لكن غير منشأ فعليًا
-- ════════════════════════════════════════════════════════════════════════
--
-- اكتُشف عبر تدقيق حي بالمتصفح (Playwright): src/lib/content-analytics.ts
-- يُدرج فيه على كل مشاهدة محتوى (كتاب/عالم/درس)، وsrc/lib/lesson-stats.ts
-- وsrc/lib/supabase.ts (لوحة الإدارة) يقرآن منه — لكن الجدول لم يُنشأ قط
-- (404 PGRST205 على كل استدعاء، مُلتقَط بصمت بـtry/catch فلا يكسر شيئًا،
-- لكن عدّاد "المشاهدات" على صفحات الدروس يعرض 0 دائمًا، ولوحة الإدارة لا
-- ترى أي بيانات مشاهدة حقيقية).
--
-- المخطط مُستنبَط من كل نقاط الاستهلاك الأربع في الكود (لا افتراض جديد):
--   content_type, content_id (نص)، user_id (uuid، اختياري)، viewed_at.
--
-- RLS: إدراج مفتوح للجميع (تتبّع مجهول شرعي — trackContentView() يُستدعى
-- من زوار غير مسجَّلين)، وقراءة مفتوحة (عدّاد المشاهدات المعروض علنًا على
-- صفحات الدروس + قراءة لوحة الإدارة كلاهما من العميل مباشرة، لا مسار
-- خادمي بديل حاليًا). لا تعديل ولا حذف لغير service_role — سجلّات مشاهدة
-- لا يجوز لمستخدم عادي التلاعب بها.
--
-- idempotent بالكامل (CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS).
-- التشغيل: npx supabase db query --linked --file supabase/create_content_views_v1.sql
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_views_type_id_idx ON public.content_views (content_type, content_id);
CREATE INDEX IF NOT EXISTS content_views_viewed_at_idx ON public.content_views (viewed_at);

ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;

-- إعادة ضبط صريحة للصلاحيات الأساسية بصرف النظر عن حالة ALTER DEFAULT
-- PRIVILEGES على هذا المشروع (موثّقة سابقًا كغير مؤكَّدة النجاح الكامل) —
-- لا نعتمد على أن الجدول الجديد سيرث صلاحيات ضيّقة تلقائيًا.
REVOKE ALL ON public.content_views FROM anon, authenticated;
GRANT INSERT ON public.content_views TO anon, authenticated;

DROP POLICY IF EXISTS "content_views_public_insert" ON public.content_views;
CREATE POLICY "content_views_public_insert" ON public.content_views
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "content_views_public_read" ON public.content_views;
CREATE POLICY "content_views_public_read" ON public.content_views
  FOR SELECT
  USING (true);

-- user_id يبقى خاصًا: عدّاد المشاهدات العلني (fetchLessonEngagementStats) لا
-- يقرأ إلا count، ولوحة الإدارة تقرأ content_type/content_id فقط — لا حاجة
-- فعلية لأي طرف عميل لقراءة "أي مستخدم شاهد ماذا". صلاحية العمود تمنع تسريب
-- سجل تصفّح المستخدمين حتى مع RLS مفتوحة على مستوى الصف.
REVOKE SELECT ON public.content_views FROM anon, authenticated;
GRANT SELECT (id, content_type, content_id, viewed_at) ON public.content_views TO anon, authenticated;
