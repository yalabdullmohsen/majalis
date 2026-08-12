-- ترقية جدول submissions لدعم الأنواع الخمسة الجديدة
-- شغّل هذا في Supabase Dashboard → SQL Editor

ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_type_check;

ALTER TABLE submissions ADD CONSTRAINT submissions_type_check
  CHECK (type IN ('درس', 'فائدة', 'معلومة', 'سؤال لعبة', 'فكرة'));
