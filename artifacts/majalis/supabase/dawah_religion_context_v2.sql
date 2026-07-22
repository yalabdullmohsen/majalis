-- توسيع قائمة الديانات المدعومة (v1 كانت 5 فقط) لتغطية أهم الأديان
-- والمعتقدات العالمية بلا استثناء ملحوظ. القيود القديمة أُسقطت في خطوة
-- منفصلة قبل هذا الملف (ALTER TABLE ... DROP CONSTRAINT).
ALTER TABLE dawah_questions
  ADD CONSTRAINT dawah_questions_target_religion_check
  CHECK (target_religion IN (
    'christian','jewish','hindu','buddhist','sikh','jain',
    'zoroastrian','bahai','chinese_folk','atheist_agnostic'
  ) OR target_religion IS NULL);

ALTER TABLE dawah_contact_requests
  ADD CONSTRAINT dawah_contact_requests_religious_background_check
  CHECK (religious_background IN (
    'christian','jewish','hindu','buddhist','sikh','jain',
    'zoroastrian','bahai','chinese_folk','atheist_agnostic',
    'other_religion','no_specific','prefer_not_to_say'
  ) OR religious_background IS NULL);
