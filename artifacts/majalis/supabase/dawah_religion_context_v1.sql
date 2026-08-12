-- خانة الديانة (لغير المسلمين) في نموذج التواصل — تساعد الداعية
-- المكلَّف على تحضير رد يراعي خلفية المتواصل الدينية. اختيارية دومًا
-- ("أفضّل عدم الذكر" خيار صريح متاح دائمًا).
ALTER TABLE dawah_contact_requests
  ADD COLUMN IF NOT EXISTS religious_background TEXT
    CHECK (religious_background IN (
      'christian','jewish','hindu','buddhist','atheist_agnostic',
      'other_religion','no_specific','prefer_not_to_say'
    ));

-- وسم المحتوى الموجَّه لخلفية دينية سابقة معينة — يبقى NULL لأي سؤال
-- عام غير موجَّه لديانة بعينها (لا يغيّر شيئًا في الأسئلة القائمة).
ALTER TABLE dawah_questions
  ADD COLUMN IF NOT EXISTS target_religion TEXT
    CHECK (target_religion IN ('christian','jewish','hindu','buddhist','atheist_agnostic') OR target_religion IS NULL);

CREATE INDEX IF NOT EXISTS dawah_questions_target_religion_idx ON dawah_questions(target_religion) WHERE target_religion IS NOT NULL;
