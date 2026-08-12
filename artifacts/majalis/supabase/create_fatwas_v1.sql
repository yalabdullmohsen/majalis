-- ════════════════════════════════════════════════════════════════════════
-- إنشاء fatwas — جدول تستهلكه لوحة الإدارة والواجهة العامة لكنه لم يُنشأ قط
-- ════════════════════════════════════════════════════════════════════════
--
-- اكتُشف عبر تدقيق حي بالمتصفح (Playwright): /fatwa و/fiqh يستدعيان
-- fatwas في كل تحميل فيفشلان بـ404 (PGRST205)، مُلتقَط بصمت (سقوط احتياطي
-- سليم لـFATWA_SEED الثابت في src/lib/fatwa-seed.ts) فلا يكسر شيئًا للزائر
-- العادي — لكن src/views/admin/FatwaAdminSection.tsx وsrc/lib/platform-supabase.ts
-- (adminGetAllFatwas/adminUpsertFatwa/adminDeleteFatwa) يعتمدان على هذا
-- الجدول فعليًا لإدارة الفتاوى، وهو معطَّل بالكامل حاليًا. كما أن
-- sharia_rulings.linked_fatwa_ids (عمود موجود فعلًا) يفترض وجوده.
--
-- المخطّط مطابق حرفيًا لنوع Fatwa في src/lib/platform-types.ts — لا حقل
-- إضافي ولا حقل ناقص، تفاديًا لأي بيانات أو افتراضات غير موجودة في الكود.
--
-- RLS: قراءة عامة لما هو approved وغير مؤرشَف فقط (يطابق شرط الاستعلام
-- الفعلي في platform-content-service.ts). كتابة كاملة لـis_admin() فقط
-- (لوحة الإدارة تستخدم عميل المتصفح العادي الخاضع لـRLS، لا service_role).
--
-- idempotent بالكامل.
-- التشغيل: npx supabase db query --linked --file supabase/create_fatwas_v1.sql
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.fatwas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key text,
  question text NOT NULL,
  answer text NOT NULL,
  summary text,
  category text NOT NULL,
  format text NOT NULL DEFAULT 'written' CHECK (format IN ('written', 'audio', 'both')),
  audio_url text,
  mufti_name text,
  source_urls text[] NOT NULL DEFAULT '{}',
  "references" jsonb NOT NULL DEFAULT '[]',
  keywords text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'archived', 'rejected')),
  view_count integer NOT NULL DEFAULT 0,
  search_count integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS fatwas_external_key_key ON public.fatwas (external_key) WHERE external_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS fatwas_status_idx ON public.fatwas (status);
CREATE INDEX IF NOT EXISTS fatwas_category_idx ON public.fatwas (category);

DROP TRIGGER IF EXISTS trg_fatwas_updated_at ON public.fatwas;
CREATE TRIGGER trg_fatwas_updated_at BEFORE UPDATE ON public.fatwas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.fatwas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.fatwas FROM anon, authenticated;
GRANT SELECT ON public.fatwas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.fatwas TO authenticated;

DROP POLICY IF EXISTS "fatwas_public_read" ON public.fatwas;
CREATE POLICY "fatwas_public_read" ON public.fatwas
  FOR SELECT
  USING (status = 'approved' AND archived_at IS NULL);

DROP POLICY IF EXISTS "fatwas_admin_all" ON public.fatwas;
CREATE POLICY "fatwas_admin_all" ON public.fatwas
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
