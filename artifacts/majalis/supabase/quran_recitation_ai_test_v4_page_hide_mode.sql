-- ═══════════════════════════════════════════════════════════════════════════
--  اختبار التسميع بالذكاء الاصطناعي — v4: وضع "إخفاء الصفحة"
--
--  فجوة من نفس فئة v2 (وضع freeform): reveal_granularity في
--  recitation_settings كان يقبل 'word'/'ayah' فقط، والآن أُضيف وضع ثالث
--  'page' في الكود (TASMEE_AUDIT.md — المرحلة السادسة من المواصفة
--  الشاملة، الوضع الثالث الناقص). خلافًا لخلل v2: هذا **لا يُفشل الجلسة
--  نفسها إطلاقًا** (كل منطق الكشف/الإخفاء عمل عميل بحت لا يعتمد على
--  القاعدة) — الأثر الوحيد لغياب هذه الهجرة: تفضيل "إخفاء الصفحة" لن
--  يُحفَظ كإعداد افتراضي دائم للمستخدم (يُصمَت الفشل عبر .catch() قائم
--  أصلاً في نقطة الاستدعاء) حتى تُطبَّق هذه الهجرة.
--
--  هجرة إضافية بحتة، آمنة للتشغيل أكثر من مرة (تبحث عن القيد ديناميكيًا).
--  ⚠️ لا تُشغَّل تلقائيًا من هذه الجلسة — تحتاج تشغيلًا يدويًا من المالك.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT pgc.conname
    FROM pg_constraint pgc
    JOIN pg_class rel ON rel.oid = pgc.conrelid
    WHERE rel.relname = 'recitation_settings'
      AND pgc.contype = 'c'
      AND pg_get_constraintdef(pgc.oid) LIKE '%reveal_granularity%'
  LOOP
    EXECUTE format('ALTER TABLE recitation_settings DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE recitation_settings
  ADD CONSTRAINT recitation_settings_reveal_granularity_check
  CHECK (reveal_granularity IN ('word','ayah','page'));
