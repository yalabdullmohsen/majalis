-- =====================================================================
--  توسيع fiqh_council_issues لدعم سياسة التحرير العلمي للمسائل الخلافية
--  التاريخ: 2026-07-17
--  آمن للتشغيل مرات متعددة (IF NOT EXISTS)
--
--  المالك طلب صراحة: عند وجود خلاف معتبر، تُعرض محل الاتفاق ومحل الخلاف
--  وأشهر الأقوال بأدلتها والقول المعتمد وسبب اختياره، مع تنبيه بأن المسألة
--  قد تختلف باختلاف الحال/المذهب/النازلة. هذه أعمدة جديدة فقط — **لا تُملأ
--  هنا بأي محتوى**، لأن الملء يتطلب بحثًا علميًا حقيقيًا بمصادر لكل مسألة
--  من الـ58 الموجودة، لا اختلاقًا. الحقول الفارغة تعني "لم تُراجَع علميًا
--  بهذا التفصيل بعد" وتُعرَض كذلك بوضوح في الواجهة، لا تُخفى.
-- =====================================================================

ALTER TABLE public.fiqh_council_issues
  ADD COLUMN IF NOT EXISTS area_of_agreement   text,
  ADD COLUMN IF NOT EXISTS area_of_disagreement text,
  -- opinions: [{ "holder": "الحنفية"، "position": "...", "evidence": "..." }, ...]
  ADD COLUMN IF NOT EXISTS opinions            jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS adopted_opinion      text,
  ADD COLUMN IF NOT EXISTS adopted_reason       text,
  ADD COLUMN IF NOT EXISTS context_disclaimer   text,
  ADD COLUMN IF NOT EXISTS reviewed_by          text,
  ADD COLUMN IF NOT EXISTS last_reviewed_at     date,
  ADD COLUMN IF NOT EXISTS content_version      integer NOT NULL DEFAULT 1;
