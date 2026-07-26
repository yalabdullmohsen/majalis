-- إضافة عمود درجة التحرير لموضوعات الإشارات الكونية (scientific_miracles)
-- يُشغَّل يدويًا في SQL Editor على الإنتاج. Idempotent.
-- بعد التطبيق: الصفوف بلا قيمة تُعدّ «verified» للتوافق مع الكود الحالي،
-- وما يُراد حجبه يُحدَّث إلى needs_review.

ALTER TABLE IF EXISTS public.scientific_miracles
  ADD COLUMN IF NOT EXISTS verification_status text;

UPDATE public.scientific_miracles
SET verification_status = 'verified'
WHERE verification_status IS NULL OR btrim(verification_status) = '';

-- قيد اختياري للقيم المعروفة (لا يفشل إن وُجدت قيم أخرى قديمة)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'scientific_miracles_verification_status_chk'
  ) THEN
    ALTER TABLE public.scientific_miracles
      ADD CONSTRAINT scientific_miracles_verification_status_chk
      CHECK (verification_status IN ('verified', 'needs_review'));
  END IF;
END $$;

COMMENT ON COLUMN public.scientific_miracles.verification_status IS
  'verified = ظاهر للعامة؛ needs_review = محجوب (ربط علمي غير محرَّر)';
