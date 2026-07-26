-- تدقيق fiqh_council_items (٢٠٢٦-٠٧-٢٦) — حذف ثلاثين صفًّا تنسب قرارات إلى مجامع
-- وجهات إفتاء حقيقية بأرقام دورات وتواريخ لا مستند لها.
--
-- المستند على الحذف (تحقُّق خارجي مباشر من الموقع الرسمي للمجمع):
--   • الدورة 24 لمجمع الفقه الإسلامي الدولي: 07-09 ربيع الأول 1441هـ الموافق
--     4-6 نوفمبر 2019م بدبي (القرار 237 (24/8) والقرار 230 (24/1)) — لا 2024.
--   • الدورة 26: 6-10 ذي القعدة 1446هـ الموافق 4-8 مايو 2025م بالدوحة
--     (القرار 265 (10/26) والقرار 266 (11/26)).
--   • الدورة 23 للمجمع الفقهي الإسلامي برابطة العالم الإسلامي: الرياض، أبريل 2024م
--     — فدورتا «24» و«25» المنسوب إليهما في هذه الصفوف لم تنعقدا أصلاً.
-- وكل صفٍّ من الثلاثين يحمل source_url = الصفحة الرئيسية للجهة فقط، بلا رقم قرار،
-- ومع ذلك موسوم documentation_level='official_verified'.
-- تناقض داخلي مؤكِّد: نفس رقم الدورة يحمل ثلاثة تواريخ مختلفة (الدورة 18 في
-- 2020-09-12 و2021-09-12 و2022-08-01)، وصفٌّ ينسب الدورة 21 إلى 2023 بينما
-- الدورة 24 الموثَّقة برابط رسمي في نفس الجدول تاريخها 2019.
-- وصفّان مكرَّران حرفياً: fiqh-ai-in-islamic-rulings نسخة من fiqh-ai-fatwa-tools،
-- وfiqh-zakat-stocks-calculation نسخة من fiqh-zakat-stocks (عنوان مطابق تماماً).
--
-- نسخة كاملة من الصفوف المحذوفة محفوظة في:
--   artifacts/majalis/data/fiqh-council-deleted-2026-07-26-backup.json
-- والمصدر المقابل حُذف من src/lib/fiqh-council-seed.ts في نفس الالتزام.
-- الباقي بعد التنفيذ: أربعة صفوف تحمل رابط قرار رسمي محدَّداً ورقم قرار.
--
-- idempotent: يعتمد على شرط slug NOT LIKE 'items-%' فتكراره بلا أثر.

BEGIN;

-- (١) تنظيف صفوف الربط أولاً (14 صفًّا في fiqh_issue_items و31 حدثاً زمنياً)
DELETE FROM fiqh_issue_timeline_events
WHERE item_id IN (SELECT id FROM fiqh_council_items WHERE slug NOT LIKE 'items-%');

DELETE FROM fiqh_issue_items
WHERE item_id IN (SELECT id FROM fiqh_council_items WHERE slug NOT LIKE 'items-%');

-- (٢) حذف العناصر نفسها
DELETE FROM fiqh_council_items WHERE slug NOT LIKE 'items-%';

-- (٣) تصحيح تاريخ القرار 237 (24/8): الدورة 24 انعقدت 4-6 نوفمبر 2019م، لا 20 نوفمبر
UPDATE fiqh_council_items
SET session_date = DATE '2019-11-06',
    published_at = TIMESTAMPTZ '2019-11-06T09:00:00Z',
    updated_at = now()
WHERE slug = 'items-encrypted-digital-currencies'
  AND session_date <> DATE '2019-11-06';

COMMIT;

-- تحقُّق بعد التنفيذ:
--   SELECT slug, session_number, session_date, source_url FROM fiqh_council_items ORDER BY slug;
--   ⇒ يجب أن تعود أربعة صفوف فقط، كلٌّ منها بـsource_url يحمل رقم صفحة قرار.
