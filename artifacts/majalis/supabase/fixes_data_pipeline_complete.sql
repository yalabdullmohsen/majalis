-- ═══════════════════════════════════════════════════════════════════
--  fixes_data_pipeline_complete.sql  (v2 — safe for any existing schema)
--  الصق هذا الملف كاملاً في Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. إصلاح جدول quiz_questions: إضافة الأعمدة المفقودة ─────────────────

ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS section    TEXT,
  ADD COLUMN IF NOT EXISTS level      TEXT,
  ADD COLUMN IF NOT EXISTS answer     TEXT,
  ADD COLUMN IF NOT EXISTS hint       TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_used    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status     TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS category   TEXT;

-- تهيئة answer من correct_answer (فقط إن كان العمود موجوداً)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions' AND column_name = 'correct_answer'
  ) THEN
    UPDATE quiz_questions
       SET answer = correct_answer
     WHERE answer IS NULL AND correct_answer IS NOT NULL;
  END IF;
END;
$$;

-- تهيئة level من difficulty (فقط إن كان العمود موجوداً)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions' AND column_name = 'difficulty'
  ) THEN
    UPDATE quiz_questions
       SET level = CASE
         WHEN difficulty = 'easy'   THEN 'beginner'
         WHEN difficulty = 'medium' THEN 'intermediate'
         WHEN difficulty = 'hard'   THEN 'advanced'
         ELSE difficulty
       END
     WHERE level IS NULL;
  END IF;
END;
$$;

-- فهارس
CREATE INDEX IF NOT EXISTS idx_quiz_questions_section ON quiz_questions(section);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_level   ON quiz_questions(level);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_is_used ON quiz_questions(is_used);

-- ─── 2. مزامنة دروس LESSONS_SEED إلى جدول lessons ──────────────────────────

-- أضف جميع الأعمدة المستخدمة بالـ INSERT إن لم تكن موجودة
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now();
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS region       TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS audience     TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS delivery     TEXT DEFAULT 'in-person';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS activity_type TEXT DEFAULT 'درس';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_recurring  BOOLEAN DEFAULT true;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS status       TEXT DEFAULT 'approved';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description  TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS schedule     TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS mosque       TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS day_of_week  TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS lesson_time  TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS city         TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS category     TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS speaker_name TEXT;

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'othman-tafsir-nahl','تفسير سورة النحل','د. عثمان بن محمد الخميس','تفسير','العاصمة','الصديق','مسجد موضي','الجمعة','بعد المغرب','أسبوعي','الكل','حضور فقط','درس',true,'approved','درس أسبوعي ثابت — المتابعة الحالية تبدأ من الآية 40',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='othman-tafsir-nahl');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'othman-sahih-muslim','قراءة كتاب صحيح مسلم','د. عثمان بن محمد الخميس','حديث','العاصمة','الصديق','مسجد موضي','الجمعة','بعد المغرب','أسبوعي','الكل','حضور فقط','درس',true,'approved','درس قراءة كتاب ثابت — الحديث 989 الصفحة 400',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='othman-sahih-muslim');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'othman-aqeedah-nawaqid','نواقض الإسلام','د. عثمان بن محمد الخميس','عقيدة','العاصمة','','','الأحد','بعد العشاء','أسبوعي','الكل','حضور فقط','درس',true,'approved','شرح رسالة نواقض الإسلام',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='othman-aqeedah-nawaqid');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'anwar-tafsir-quran','تفسير القرآن الكريم','الشيخ أنور الصالح','تفسير','الجهراء','','مسجد القرآن الكريم','الاثنين','بعد المغرب','أسبوعي','الكل','حضور فقط','درس',true,'approved','درس تفسير أسبوعي ثابت',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='anwar-tafsir-quran');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'anwar-minhaj-muslim','منهاج المسلم','الشيخ أنور الصالح','فقه','الجهراء','','مسجد القرآن الكريم','الثلاثاء','بعد العشاء','أسبوعي','الكل','حضور فقط','درس',true,'approved','شرح كتاب منهاج المسلم',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='anwar-minhaj-muslim');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'shayeb-seerah','السيرة النبوية','الشيخ شايب الحمود','سيرة','حولي','','مسجد بلال بن رباح','الأربعاء','بعد المغرب','أسبوعي','الكل','حضور فقط','درس',true,'approved','درس السيرة النبوية الأسبوعي',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='shayeb-seerah');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'shayeb-fiqh-hanafi','الفقه الحنفي المقارن','الشيخ شايب الحمود','فقه','حولي','','مسجد بلال بن رباح','الأحد','بعد الفجر','أسبوعي','الكل','حضور فقط','درس',true,'approved','دراسة متقدمة في الفقه المقارن',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='shayeb-fiqh-hanafi');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'badr-aqeedah-wasitiyya','العقيدة الواسطية','الشيخ بدر العجمي','عقيدة','مبارك الكبير','','مسجد السلام','الجمعة','بعد الجمعة','أسبوعي','الكل','حضور فقط','درس',true,'approved','شرح كتاب العقيدة الواسطية لابن تيمية',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='badr-aqeedah-wasitiyya');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'badr-riyadh-salihin','رياض الصالحين','الشيخ بدر العجمي','حديث','مبارك الكبير','','مسجد السلام','الاثنين','بعد المغرب','أسبوعي','الكل','حضور فقط','درس',true,'approved','شرح كتاب رياض الصالحين للنووي',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='badr-riyadh-salihin');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'fadhl-tafsir-baqara','تفسير سورة البقرة','الشيخ فضل الجماعة','تفسير','الكويت','','مسجد الرحمن','الخميس','بعد العشاء','أسبوعي','الكل','حضور فقط','درس',true,'approved','تفسير تفصيلي لأم القرآن',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='fadhl-tafsir-baqara');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'fadhl-usool-fiqh','أصول الفقه','الشيخ فضل الجماعة','فقه','الكويت','','مسجد الرحمن','السبت','بعد المغرب','أسبوعي','الكل','حضور فقط','درس',true,'approved','شرح الورقات في أصول الفقه',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='fadhl-usool-fiqh');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'hussain-nawawi-arbaeen','الأربعون النووية','الشيخ حسين العوضي','حديث','الأحمدي','','الجامع الكبير','الاثنين','بعد الفجر','أسبوعي','الكل','حضور فقط','درس',true,'approved','شرح الأربعين النووية في الأحاديث الصحيحة',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='hussain-nawawi-arbaeen');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'hussain-aqeedah-tahawiyya','العقيدة الطحاوية','الشيخ حسين العوضي','عقيدة','الأحمدي','','الجامع الكبير','الأربعاء','بعد المغرب','أسبوعي','الكل','حضور فقط','درس',true,'approved','شرح متن العقيدة الطحاوية',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='hussain-aqeedah-tahawiyya');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'mansour-fiqh-shafii','الفقه الشافعي','الشيخ منصور الطيار','فقه','الفروانية','','مسجد الفتح','الثلاثاء','بعد العشاء','أسبوعي','الكل','حضور فقط','درس',true,'approved','شرح مختصر المزني في الفقه الشافعي',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='mansour-fiqh-shafii');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'mansour-seerah-nabawiyya','السيرة النبوية المعمقة','الشيخ منصور الطيار','سيرة','الفروانية','','مسجد الفتح','الجمعة','قبل الجمعة','أسبوعي','الكل','حضور فقط','درس',true,'approved','دراسة معمقة في السيرة النبوية',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='mansour-seerah-nabawiyya');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'course-tajweed-summer','دورة التجويد الصيفية','نخبة من المشايخ','تجويد','العاصمة','','مركز تحفيظ القرآن','','','دورة مكثفة','الكل','حضور فقط','دورة',false,'approved','دورة مكثفة في أحكام التجويد — صيف 2025',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='course-tajweed-summer');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'course-arabic-summer','دورة اللغة العربية للمبتدئين','د. خالد الأنصاري','أخرى','العاصمة','','معهد اللغة العربية','','','دورة صباحية','الكل','حضور فقط','دورة',false,'approved','دورة تأسيسية في اللغة العربية والنحو',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='course-arabic-summer');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'nasser-hadeeth-bukhari','صحيح البخاري','الشيخ ناصر العمر','حديث','العاصمة','','مسجد عمر بن الخطاب','السبت','بعد المغرب','أسبوعي','الكل','حضور فقط','درس',true,'approved','قراءة وشرح في صحيح الإمام البخاري',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='nasser-hadeeth-bukhari');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'nasser-tafsir-kahf','تفسير سورة الكهف','الشيخ ناصر العمر','تفسير','العاصمة','','مسجد عمر بن الخطاب','الجمعة','بعد الجمعة','أسبوعي','الكل','حضور فقط','درس',true,'approved','شرح وتفسير سورة الكهف',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='nasser-tafsir-kahf');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'anwar-women-fiqh','فقه المرأة المسلمة','الشيخ أنور الصالح','فقه','الجهراء','','مركز المرأة الإسلامي','الأحد','بعد العصر','أسبوعي','نساء','حضور فقط','درس',true,'approved','أحكام فقهية خاصة بالمرأة المسلمة',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='anwar-women-fiqh');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'badr-fiqh-worship','فقه العبادات','الشيخ بدر العجمي','فقه','مبارك الكبير','','مسجد السلام','الخميس','بعد الفجر','أسبوعي','الكل','حضور فقط','درس',true,'approved','شرح باب الطهارة والصلاة والزكاة والصيام والحج',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='badr-fiqh-worship');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'othman-mustalah-hadeeth','مصطلح الحديث','د. عثمان بن محمد الخميس','حديث','العاصمة','الصديق','مسجد موضي','الثلاثاء','بعد العصر','أسبوعي','الكل','حضور فقط','درس',true,'approved','علم مصطلح الحديث وأسماء الرجال',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='othman-mustalah-hadeeth');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'hussain-zad-mustaqni','زاد المستقنع','الشيخ حسين العوضي','فقه','الأحمدي','','الجامع الكبير','الجمعة','بعد الجمعة','أسبوعي','الكل','حضور فقط','درس',true,'approved','شرح كتاب زاد المستقنع في الفقه الحنبلي',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='hussain-zad-mustaqni');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'course-quran-memorization','دورة حفظ القرآن الكريم','نخبة من الحفّاظ','تجويد','الكويت','','مراكز تحفيظ القرآن','','','مستمر','الكل','حضور فقط','دورة',true,'approved','برنامج تحفيظ القرآن الكريم للناشئة والكبار',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='course-quran-memorization');

INSERT INTO lessons (external_key,title,speaker_name,category,city,region,mosque,day_of_week,lesson_time,schedule,audience,delivery,activity_type,is_recurring,status,description,updated_at)
SELECT 'fadhl-seerah-rasool','السيرة الرسول ﷺ','الشيخ فضل الجماعة','سيرة','الكويت','','مسجد الرحمن','الأربعاء','بعد المغرب','أسبوعي','الكل','حضور فقط','درس',true,'approved','دراسة تحليلية في سيرة الرسول محمد ﷺ',now()
WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE external_key='fadhl-seerah-rasool');

SELECT count(*) AS total_lessons FROM lessons WHERE status = 'approved';

-- ─── 3. أسئلة المسابقة — seed data ──────────────────────────────────────────

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأنبياء','intermediate','من أول الرسل إلى أهل الأرض بعد آدم؟','نوح عليه السلام','الأنبياء','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'من أول الرسل إلى أهل الأرض بعد آدم؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأنبياء','intermediate','من النبي الذي اتخذه الله خليلاً؟','إبراهيم عليه السلام','الأنبياء','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'من النبي الذي اتخذه الله خليلاً؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأنبياء','intermediate','كم سنة دعا نوح قومه؟','ألف سنة إلا خمسين عاماً','الأنبياء','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'كم سنة دعا نوح قومه؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأنبياء','beginner','ما اسم أبي البشر؟','آدم عليه السلام','الأنبياء','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'ما اسم أبي البشر؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأنبياء','advanced','من النبي الذي أُوتي ملكاً لا ينبغي لأحد من بعده؟','سليمان عليه السلام','الأنبياء','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'من النبي الذي أُوتي ملكاً لا ينبغي لأحد من بعده؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'السيرة','intermediate','في أي عام وُلد النبي ﷺ؟','عام الفيل — 571م','السيرة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'في أي عام وُلد النبي ﷺ؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'السيرة','intermediate','ما اسم أم النبي ﷺ؟','آمنة بنت وهب','السيرة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'ما اسم أم النبي ﷺ؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'السيرة','advanced','كم غزوة شارك فيها النبي ﷺ بنفسه؟','سبع وعشرون غزوة','السيرة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'كم غزوة شارك فيها النبي ﷺ بنفسه؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'السيرة','beginner','ما اسم أول زوجات النبي ﷺ؟','خديجة بنت خويلد رضي الله عنها','السيرة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'ما اسم أول زوجات النبي ﷺ؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الصحابة','intermediate','من أول من أسلم من الرجال؟','أبو بكر الصديق رضي الله عنه','الصحابة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'من أول من أسلم من الرجال؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الصحابة','intermediate','من الصحابي الملقّب بـ"سيف الله المسلول"؟','خالد بن الوليد رضي الله عنه','الصحابة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'من الصحابي الملقّب بـ"سيف الله المسلول"؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الصحابة','advanced','كم عدد العشرة المبشرين بالجنة؟','عشرة صحابة','الصحابة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'كم عدد العشرة المبشرين بالجنة؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأحكام','intermediate','كم عدد أركان الإسلام؟','خمسة أركان','الأحكام','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'كم عدد أركان الإسلام؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأحكام','beginner','كم عدد الصلوات المفروضة يومياً؟','خمس صلوات','الأحكام','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'كم عدد الصلوات المفروضة يومياً؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأحكام','advanced','ما نصاب زكاة الذهب بالغرام؟','خمسة وثمانون غراماً تقريباً','الأحكام','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'ما نصاب زكاة الذهب بالغرام؟');

SELECT count(*) AS total_quiz_questions FROM quiz_questions WHERE status = 'published';
