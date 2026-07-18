-- =====================================================================
--  خطط القراءة الذكية — جدول book_reading_plans
--  التاريخ: 2026-07-16
--  آمن للتشغيل مرات متعددة (IF NOT EXISTS)
--
--  ملاحظة معمارية مهمة: كتب /library مصدرها الأساسي ملف ثابت
--  (src/lib/library-catalog.ts) بمعرّفات نصية مثل "book-madarij"، وليست
--  صفوفًا في جدول library_items (UUID) إلا فيما ندر. لذا book_slug هنا
--  نص حر (يطابق library-catalog id) لا مفتاح خارجي — نفس نمط
--  getLibraryItemById في src/lib/supabase.ts.
--
--  التقدّم اليومي يُخزَّن كسجل JSONB (progress_log) بدل جدول منفصل —
--  كافٍ لحجم الاستخدام المتوقع (خطة واحدة نشطة لكل مستخدم لكل كتاب)
--  ويبسّط الاستعلامات (لا JOIN لعرض الخطة كاملة).
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.book_reading_plans (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_slug          text NOT NULL,
  book_title         text NOT NULL,
  total_pages        integer NOT NULL CHECK (total_pages > 0),
  start_date         date NOT NULL,
  end_date           date NOT NULL CHECK (end_date >= start_date),
  reading_days       text[] NOT NULL DEFAULT ARRAY['sat','sun','mon','tue','wed','thu','fri'],
  daily_minutes      integer NOT NULL DEFAULT 30 CHECK (daily_minutes > 0),
  pace_level         text NOT NULL DEFAULT 'medium' CHECK (pace_level IN ('easy','medium','intensive')),
  include_review_days boolean NOT NULL DEFAULT true,
  status             text NOT NULL DEFAULT 'not_started'
                       CHECK (status IN ('draft','not_started','in_progress','ahead','behind','paused','completed','cancelled')),
  current_page       integer NOT NULL DEFAULT 0 CHECK (current_page >= 0),
  progress_log       jsonb NOT NULL DEFAULT '[]'::jsonb,
  paused_at          timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_book_reading_plans_user ON public.book_reading_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_book_reading_plans_user_status ON public.book_reading_plans(user_id, status);

ALTER TABLE public.book_reading_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "book_reading_plans_own" ON public.book_reading_plans;
CREATE POLICY "book_reading_plans_own"
  ON public.book_reading_plans
  FOR ALL
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- trigger: حدّث updated_at تلقائيًا (يعيد استخدام دالة موجودة إن كانت متوفرة)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_book_reading_plans_updated_at ON public.book_reading_plans;
    CREATE TRIGGER trg_book_reading_plans_updated_at
      BEFORE UPDATE ON public.book_reading_plans
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
