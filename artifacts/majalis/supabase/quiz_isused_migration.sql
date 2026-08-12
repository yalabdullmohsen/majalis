-- إضافة عمود is_used لتتبع الأسئلة المستخدمة
ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS is_used boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_quiz_questions_is_used ON quiz_questions(is_used);
