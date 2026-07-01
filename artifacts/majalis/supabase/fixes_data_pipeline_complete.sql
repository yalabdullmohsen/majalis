-- ═══════════════════════════════════════════════════════════════════
--  fixes_data_pipeline_complete.sql
--  الصق هذا الملف كاملاً في Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. إصلاح جدول quiz_questions: إضافة الأعمدة المفقودة ─────────────────

ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS section       TEXT,
  ADD COLUMN IF NOT EXISTS level         TEXT,
  ADD COLUMN IF NOT EXISTS answer        TEXT,
  ADD COLUMN IF NOT EXISTS hint          TEXT,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT now();

-- إضافة is_used إن لم تكن موجودة (ملف migration منفصل قد يكون نُفِّذ سابقاً)
ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT false;

-- تهيئة القيم الجديدة من الأعمدة القديمة (backward compat)
UPDATE quiz_questions
   SET answer = correct_answer
 WHERE answer IS NULL AND correct_answer IS NOT NULL;

UPDATE quiz_questions
   SET level = CASE
     WHEN difficulty = 'easy'   THEN 'beginner'
     WHEN difficulty = 'medium' THEN 'intermediate'
     WHEN difficulty = 'hard'   THEN 'advanced'
     ELSE difficulty
   END
 WHERE level IS NULL;

-- فهرس على section و level
CREATE INDEX IF NOT EXISTS idx_quiz_questions_section  ON quiz_questions(section);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_level    ON quiz_questions(level);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_is_used  ON quiz_questions(is_used);

-- ─── 2. مزامنة دروس LESSONS_SEED إلى جدول lessons ──────────────────────────
--  هذه بيانات نظيفة من الكود الداخلي — آمن تماماً (upsert بدون حذف)

INSERT INTO lessons (
  external_key, title, speaker_name, category, city, region,
  mosque, day_of_week, lesson_time, schedule, audience, delivery,
  activity_type, is_recurring, status, description, updated_at
) VALUES
-- درس 1
('othman-tafsir-nahl','تفسير سورة النحل','د. عثمان بن محمد الخميس',
 'تفسير','العاصمة','الصديق','مسجد موضي','الجمعة','بعد المغرب','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'درس أسبوعي ثابت — المتابعة الحالية تبدأ من الآية 40',now()),

-- درس 2
('othman-sahih-muslim','قراءة كتاب صحيح مسلم','د. عثمان بن محمد الخميس',
 'حديث','العاصمة','الصديق','مسجد موضي','الجمعة','بعد المغرب','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'درس قراءة كتاب ثابت — الحديث 989 الصفحة 400',now()),

-- درس 3
('othman-aqeedah-nawaqid','نواقض الإسلام','د. عثمان بن محمد الخميس',
 'عقيدة','العاصمة','','','الأحد','بعد العشاء','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'شرح رسالة نواقض الإسلام',now()),

-- درس 4
('anwar-tafsir-quran','تفسير القرآن الكريم','الشيخ أنور الصالح',
 'تفسير','الجهراء','','مسجد القرآن الكريم','الاثنين','بعد المغرب','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'درس تفسير أسبوعي ثابت',now()),

-- درس 5
('anwar-minhaj-muslim','منهاج المسلم','الشيخ أنور الصالح',
 'فقه','الجهراء','','مسجد القرآن الكريم','الثلاثاء','بعد العشاء','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'شرح كتاب منهاج المسلم',now()),

-- درس 6
('shayeb-seerah','السيرة النبوية','الشيخ شايب الحمود',
 'سيرة','حولي','','مسجد بلال بن رباح','الأربعاء','بعد المغرب','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'درس السيرة النبوية الأسبوعي',now()),

-- درس 7
('shayeb-fiqh-hanafi','الفقه الحنفي المقارن','الشيخ شايب الحمود',
 'فقه','حولي','','مسجد بلال بن رباح','الأحد','بعد الفجر','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'دراسة متقدمة في الفقه المقارن',now()),

-- درس 8
('badr-aqeedah-wasitiyya','العقيدة الواسطية','الشيخ بدر العجمي',
 'عقيدة','مبارك الكبير','','مسجد السلام','الجمعة','بعد الجمعة','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'شرح كتاب العقيدة الواسطية لابن تيمية',now()),

-- درس 9
('badr-riyadh-salihin','رياض الصالحين','الشيخ بدر العجمي',
 'حديث','مبارك الكبير','','مسجد السلام','الاثنين','بعد المغرب','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'شرح كتاب رياض الصالحين للنووي',now()),

-- درس 10
('fadhl-tafsir-baqara','تفسير سورة البقرة','الشيخ فضل الجماعة',
 'تفسير','الكويت','','مسجد الرحمن','الخميس','بعد العشاء','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'تفسير تفصيلي لأم القرآن',now()),

-- درس 11
('fadhl-usool-fiqh','أصول الفقه','الشيخ فضل الجماعة',
 'فقه','الكويت','','مسجد الرحمن','السبت','بعد المغرب','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'شرح الورقات في أصول الفقه',now()),

-- درس 12
('hussain-nawawi-arbaeen','الأربعون النووية','الشيخ حسين العوضي',
 'حديث','الأحمدي','','الجامع الكبير','الاثنين','بعد الفجر','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'شرح الأربعين النووية في الأحاديث الصحيحة',now()),

-- درس 13
('hussain-aqeedah-tahawiyya','العقيدة الطحاوية','الشيخ حسين العوضي',
 'عقيدة','الأحمدي','','الجامع الكبير','الأربعاء','بعد المغرب','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'شرح متن العقيدة الطحاوية',now()),

-- درس 14
('mansour-fiqh-shafii','الفقه الشافعي','الشيخ منصور الطيار',
 'فقه','الفروانية','','مسجد الفتح','الثلاثاء','بعد العشاء','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'شرح مختصر المزني في الفقه الشافعي',now()),

-- درس 15
('mansour-seerah-nabawiyya','السيرة النبوية المعمقة','الشيخ منصور الطيار',
 'سيرة','الفروانية','','مسجد الفتح','الجمعة','قبل الجمعة','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'دراسة معمقة في السيرة النبوية',now()),

-- درس 16 — دورة
('course-tajweed-summer','دورة التجويد الصيفية','نخبة من المشايخ',
 'تجويد','العاصمة','','مركز تحفيظ القرآن','','','دورة مكثفة',
 'الكل','حضور فقط','دورة',false,'approved',
 'دورة مكثفة في أحكام التجويد — صيف 2025',now()),

-- درس 17 — دورة
('course-arabic-summer','دورة اللغة العربية للمبتدئين','د. خالد الأنصاري',
 'أخرى','العاصمة','','معهد اللغة العربية','','','دورة صباحية',
 'الكل','حضور فقط','دورة',false,'approved',
 'دورة تأسيسية في اللغة العربية والنحو',now()),

-- درس 18
('nasser-hadeeth-bukhari','صحيح البخاري','الشيخ ناصر العمر',
 'حديث','العاصمة','','مسجد عمر بن الخطاب','السبت','بعد المغرب','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'قراءة وشرح في صحيح الإمام البخاري',now()),

-- درس 19
('nasser-tafsir-kahf','تفسير سورة الكهف','الشيخ ناصر العمر',
 'تفسير','العاصمة','','مسجد عمر بن الخطاب','الجمعة','بعد الجمعة','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'شرح وتفسير سورة الكهف',now()),

-- درس 20
('anwar-women-fiqh','فقه المرأة المسلمة','الشيخ أنور الصالح',
 'فقه','الجهراء','','مركز المرأة الإسلامي','الأحد','بعد العصر','أسبوعي',
 'نساء','حضور فقط','درس',true,'approved',
 'أحكام فقهية خاصة بالمرأة المسلمة',now()),

-- درس 21
('badr-fiqh-worship','فقه العبادات','الشيخ بدر العجمي',
 'فقه','مبارك الكبير','','مسجد السلام','الخميس','بعد الفجر','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'شرح باب الطهارة والصلاة والزكاة والصيام والحج',now()),

-- درس 22
('othman-mustalah-hadeeth','مصطلح الحديث','د. عثمان بن محمد الخميس',
 'حديث','العاصمة','الصديق','مسجد موضي','الثلاثاء','بعد العصر','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'علم مصطلح الحديث وأسماء الرجال',now()),

-- درس 23
('hussain-zad-mustaqni','زاد المستقنع','الشيخ حسين العوضي',
 'فقه','الأحمدي','','الجامع الكبير','الجمعة','بعد الجمعة','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'شرح كتاب زاد المستقنع في الفقه الحنبلي',now()),

-- درس 24 — دورة
('course-quran-memorization','دورة حفظ القرآن الكريم','نخبة من الحفّاظ',
 'تجويد','الكويت','','مراكز تحفيظ القرآن','','','مستمر',
 'الكل','حضور فقط','دورة',true,'approved',
 'برنامج تحفيظ القرآن الكريم للناشئة والكبار',now()),

-- درس 25
('fadhl-seerah-rasool','السيرة الرسول ﷺ','الشيخ فضل الجماعة',
 'سيرة','الكويت','','مسجد الرحمن','الأربعاء','بعد المغرب','أسبوعي',
 'الكل','حضور فقط','درس',true,'approved',
 'دراسة تحليلية في سيرة الرسول محمد ﷺ',now())

ON CONFLICT (external_key) DO UPDATE SET
  title        = EXCLUDED.title,
  speaker_name = EXCLUDED.speaker_name,
  category     = EXCLUDED.category,
  city         = EXCLUDED.city,
  mosque       = EXCLUDED.mosque,
  day_of_week  = EXCLUDED.day_of_week,
  lesson_time  = EXCLUDED.lesson_time,
  schedule     = EXCLUDED.schedule,
  status       = EXCLUDED.status,
  description  = EXCLUDED.description,
  updated_at   = now();

-- تأكيد: عدد الدروس بعد المزامنة
SELECT count(*) AS total_lessons FROM lessons WHERE status = 'approved';

-- ─── 3. أسئلة المسابقة — seed data ──────────────────────────────────────────
INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used) VALUES
('الأنبياء','intermediate','من أول الرسل إلى أهل الأرض بعد آدم؟','نوح عليه السلام','الأنبياء','published',false),
('الأنبياء','intermediate','من النبي الذي اتخذه الله خليلاً؟','إبراهيم عليه السلام','الأنبياء','published',false),
('الأنبياء','intermediate','كم سنة دعا نوح قومه؟','ألف سنة إلا خمسين عاماً','الأنبياء','published',false),
('الأنبياء','beginner','ما اسم أبي البشر؟','آدم عليه السلام','الأنبياء','published',false),
('الأنبياء','advanced','من النبي الذي أُوتي ملكاً لا ينبغي لأحد من بعده؟','سليمان عليه السلام','الأنبياء','published',false),
('السيرة','intermediate','في أي عام وُلد النبي ﷺ؟','عام الفيل — 571م','السيرة','published',false),
('السيرة','intermediate','ما اسم أم النبي ﷺ؟','آمنة بنت وهب','السيرة','published',false),
('السيرة','advanced','كم غزوة شارك فيها النبي ﷺ بنفسه؟','سبع وعشرون غزوة','السيرة','published',false),
('السيرة','beginner','ما اسم أول زوجات النبي ﷺ؟','خديجة بنت خويلد رضي الله عنها','السيرة','published',false),
('الصحابة','intermediate','من أول من أسلم من الرجال؟','أبو بكر الصديق رضي الله عنه','الصحابة','published',false),
('الصحابة','intermediate','من الصحابي الملقّب بـ"سيف الله المسلول"؟','خالد بن الوليد رضي الله عنه','الصحابة','published',false),
('الصحابة','advanced','كم عدد العشرة المبشرين بالجنة؟','عشرة صحابة','الصحابة','published',false),
('الأحكام','intermediate','كم عدد أركان الإسلام؟','خمسة أركان','الأحكام','published',false),
('الأحكام','beginner','كم عدد الصلوات المفروضة يومياً؟','خمس صلوات','الأحكام','published',false),
('الأحكام','advanced','ما نصاب زكاة الذهب بالغرام؟','خمسة وثمانون غراماً تقريباً','الأحكام','published',false)
ON CONFLICT DO NOTHING;

-- تأكيد: عدد أسئلة المسابقة
SELECT count(*) AS total_quiz_questions FROM quiz_questions WHERE status = 'published';
