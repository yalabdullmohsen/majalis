-- تنظيف بقيّتَي قوالب الاستيراد التجريبيّ العائدتين — الكتاب والشيخ (ج-٢٥٨).
--
-- عادتا بنفس السبب الذي أعاد صفَّ `qa_questions` ثالثةً: جدولةُ
-- `/api/cron/import-phase2-trial` كلَّ ستّ ساعات في `vercel.json` تستورد قوالبَ
-- `data/imports/trial/*.phase2.json` الأربعة إلى الجداول الحيّة. وقد **حُذفت
-- الجدولةُ في هذه الدورة** (راجع `qa_questions_phase2_test_row_cleanup_3.sql`)،
-- فهذا الحذفُ الآن نهائيٌّ لا يُبطله تشغيلٌ تالٍ.
--
--   library_items f8771396-4e8e-4785-b603-3203376f05f5
--     «كتاب تجريبي Phase2 — مختصر الحكم»، status='approved' ⇒ حيٌّ للقارئ.
--     (حذفت ج-٢٢٥ نظيرَه بمعرِّفٍ آخر في `library_items_unsourced_attribution_cleanup.sql`)
--   sheikhs d7e51560-612b-4254-b5d3-04b58f8fb97c
--     «الشيخ التجريبي Phase2»، status='approved' ⇒ حيٌّ كذلك.
--     (وهو **الثالث**: حذفت `cleanup_test_sheikh_record_v1/v2.sql` نظيرَيه)
--
-- فحص المراجع قبل الحذف: `course_books.library_item_id` ⇒ **صفر إشارة** إلى
-- الكتاب، و`lessons.sheikh_id` ⇒ **صفر إشارة** إلى الشيخ، و**٠ درسًا** بقالب
-- الدروس التجريبيّ (`title ILIKE '%Phase 2%' OR external_key ILIKE '%phase2%'`)
-- ⇒ لا صفَّ ثالثًا يُحذف. نسختان احتياطيّتان بكلّ الأعمدة:
--   `artifacts/majalis/data/library-items-deleted-2026-07-27-backup-2.json` (١٨ عمودًا)
--   `artifacts/majalis/data/sheikhs-deleted-2026-07-27-backup.json` (٢٣ عمودًا)
--
-- idempotent: كلُّ حذفٍ مقيَّدٌ بالمعرِّف وبنصّ العنوان/الاسم الأصلي.
BEGIN;

DELETE FROM library_items
 WHERE id = 'f8771396-4e8e-4785-b603-3203376f05f5'
   AND title = 'كتاب تجريبي Phase2 — مختصر الحكم';

DELETE FROM sheikhs
 WHERE id = 'd7e51560-612b-4254-b5d3-04b58f8fb97c'
   AND name = 'الشيخ التجريبي Phase2';

COMMIT;
