-- ═══════════════════════════════════════════════════════════════════════════
--  اختبار التسميع بالذكاء الاصطناعي — v2: إضافة وضع "freeform"
--
--  خلل حقيقي مُكتشَف 2026-07-18: وضع "التسميع الحر" (freeform) أُضيف إلى
--  RecitationMode في الكود (src/lib/recitation-ai/types.ts) بعد أن كانت
--  quran_recitation_ai_test_v1.sql قد كتبت قيد CHECK على عمود `mode` في
--  recitation_sessions يقتصر على القيم الخمس الأصلية فقط (بلا 'freeform')
--  — أي محاولة حفظ جلسة "تسميع حر" ستُرفَض صامتًا من قاعدة البيانات (الكود
--  الحالي في recitation-session-service.ts لا يُبلِّغ المستخدم بفشل الحفظ
--  إطلاقًا، فقط يُعيد null بصمت — راجع الإصلاح المصاحب لهذا في نفس الكوميت
--  الذي يضيف console.error على الأقل للتشخيص).
--
--  هذه الهجرة **إضافية بحتة**: لا تُنشئ جدولًا جديدًا، فقط تُصحِّح قيد
--  CHECK قائمًا على عمود `mode` في recitation_sessions ليشمل 'freeform'.
--  آمنة للتشغيل أكثر من مرة (idempotent): تبحث عن أي قيد CHECK على عمود
--  mode بالاسم الفعلي (لا افتراض تسمية Postgres التلقائية) وتستبدله.
--
--  ⚠️ لا تُشغَّل تلقائيًا من هذه الجلسة — تحتاج تشغيلًا يدويًا من المالك
--  بصلاحية DATABASE_URL على قاعدة الإنتاج (نفس نمط v1 ونمط باقي سكربتات
--  apply-*-migration.mjs القائمة في المشروع). حتى يُشغَّل: أي مستخدم
--  يُنهي جلسة "تسميع حر" ستُفقَد نتيجتها بصمت (لا تُحفَظ في السجل، لا
--  تُضاف مراجعات أخطاء تلقائية) — التلاوة والتحليل الحيّ يعملان بشكل
--  طبيعي تمامًا، فقط الحفظ النهائي في قاعدة البيانات يفشل.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT pgc.conname
    FROM pg_constraint pgc
    JOIN pg_class rel ON rel.oid = pgc.conrelid
    WHERE rel.relname = 'recitation_sessions'
      AND pgc.contype = 'c'
      AND pg_get_constraintdef(pgc.oid) LIKE '%full_hide%'
  LOOP
    EXECUTE format('ALTER TABLE recitation_sessions DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE recitation_sessions
  ADD CONSTRAINT recitation_sessions_mode_check
  CHECK (mode IN ('full_hide','assisted','word_follow','interactive_mushaf','teacher_test','freeform'));
