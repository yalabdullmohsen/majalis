-- ═══════════════════════════════════════════════════════════════════════════
-- fix_legacy_quiz_sections.sql
--
-- إصلاح 15 سؤالاً قديماً في quiz_questions باستخدام section بالإنجليزية
-- الصغيرة (ahkam/anbiya/sahaba/seera) غير الموجودة في خريطة
-- SECTION_TO_CATEGORY الفعلية (islamicQuizData.ts) — فتختفي هذه الأسئلة
-- صامتاً من لعبة "الأسئلة الجاهزة" الحية رغم كونها أسئلة صحيحة وسليمة
-- (تحقَّق يدوياً من عيّنة: كم أركان الإسلام، من أول من أسلم، متى وُلد
-- النبي ﷺ... كلها معلومات عامة صحيحة، لا محتوى تجريبي).
--
-- الإصلاح: تحديث عمود section للقيم العربية المكافئة المسموحة أصلاً في
-- CHECK constraint (تحقَّق أنها موجودة فعلاً في pg_constraint قبل التطبيق)
-- والمُعرَّفة في SECTION_TO_CATEGORY:
--   ahkam   → الأحكام  (→ fiqh)
--   anbiya  → الأنبياء (→ anbiya)
--   sahaba  → الصحابة  (→ akhlaq)
--   seera   → السيرة   (→ sira)
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE quiz_questions SET section = 'الأحكام' WHERE section = 'ahkam';
UPDATE quiz_questions SET section = 'الأنبياء' WHERE section = 'anbiya';
UPDATE quiz_questions SET section = 'الصحابة' WHERE section = 'sahaba';
UPDATE quiz_questions SET section = 'السيرة' WHERE section = 'seera';
