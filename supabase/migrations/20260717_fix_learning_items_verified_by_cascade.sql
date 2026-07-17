-- =====================================================================
--  إصلاح: learning_items.verified_by كان NO ACTION (يمنع الحذف)
--  التاريخ: 2026-07-17
--
--  /api/account/delete يعتمد على Supabase Admin deleteUser() الذي يُطلق
--  ON DELETE CASCADE على كل الجداول المرتبطة تلقائيًا — لكن هذا العمود
--  الوحيد كان NO ACTION (أي RESTRICT ضمنيًا)، فلو حذف أي مراجع/مسؤول
--  تحقّق من درس واحد على الأقل حسابه، تفشل عملية حذف حسابه بالكامل
--  بخطأ قيد مرجعي. الإصلاح: SET NULL بدل الحذف — يطابق تمامًا نفس النمط
--  المستخدَم فعليًا لكل أعمدة "المراجع/المدقق" المشابهة في المشروع
--  (user_submissions.reviewer_id، tg_extracted_lessons.reviewed_by) —
--  يبقى الدرس نفسه، تُمسَح نسبة التحقق منه فقط.
-- =====================================================================

ALTER TABLE public.learning_items
  DROP CONSTRAINT IF EXISTS learning_items_verified_by_fkey;

ALTER TABLE public.learning_items
  ADD CONSTRAINT learning_items_verified_by_fkey
  FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
