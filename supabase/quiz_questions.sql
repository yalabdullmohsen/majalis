-- =====================================================================
--  مجالس العلم — مسابقات المعرفة الشرعية
--  جدول: quiz_questions
--  نفّذ في Supabase SQL Editor (بعد 01_schema.sql)
-- =====================================================================

create table if not exists quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  section     text not null,
  category    text not null,
  level       text not null default 'متوسط'
                check (level in ('سهل', 'متوسط', 'صعب')),
  question    text not null,
  answer      text not null,
  status      text default 'published'
                check (status in ('draft', 'published')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists quiz_questions_section_idx  on quiz_questions (section);
create index if not exists quiz_questions_category_idx on quiz_questions (category);
create index if not exists quiz_questions_status_idx   on quiz_questions (status);
create index if not exists quiz_questions_level_idx    on quiz_questions (level);

alter table quiz_questions enable row level security;

drop policy if exists "قراءة أسئلة المسابقة المنشورة" on quiz_questions;
create policy "قراءة أسئلة المسابقة المنشورة"
  on quiz_questions for select
  using (status = 'published' or is_admin());

drop policy if exists "المشرف يدير أسئلة المسابقة" on quiz_questions;
create policy "المشرف يدير أسئلة المسابقة"
  on quiz_questions for all
  using (is_admin()) with check (is_admin());

-- ── بيانات أولية (55 سؤالاً) ──
-- يُعاد توليدها عبر: pnpm --filter @workspace/majalis run generate:quiz
-- Auto-generated seed — included from quiz_questions.sql
insert into quiz_questions (section, category, level, question, answer, status) values ('الأنبياء', 'الرسل', 'متوسط', 'من أول الرسل إلى أهل الأرض بعد آدم؟', 'نوح عليه السلام', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأنبياء', 'الرسل', 'متوسط', 'من النبي الذي اتخذه الله خليلاً؟', 'إبراهيم عليه السلام', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأنبياء', 'الرسل', 'متوسط', 'من النبي الذي كلمه الله تكليماً؟', 'موسى عليه السلام', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأنبياء', 'الرسل', 'متوسط', 'من النبي الذي أرسل إلى قوم عاد؟', 'هود عليه السلام', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأنبياء', 'الرسل', 'متوسط', 'من النبي الذي أرسل إلى قوم ثمود؟', 'صالح عليه السلام', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأنبياء', 'الرسل', 'متوسط', 'من النبي الذي ابتلعه الحوت؟', 'يونس عليه السلام', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأنبياء', 'الرسل', 'متوسط', 'من النبي الذي رفعه الله إليه؟', 'عيسى عليه السلام', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأنبياء', 'الرسل', 'متوسط', 'من والد إسماعيل عليه السلام؟', 'إبراهيم عليه السلام', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأنبياء', 'الرسل', 'متوسط', 'من النبي الذي سخر الله له الريح؟', 'سليمان عليه السلام', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأنبياء', 'الرسل', 'متوسط', 'من النبي الذي اشتهر بالصبر على البلاء؟', 'أيوب عليه السلام', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصحابة', 'الخلفاء', 'متوسط', 'من أول الخلفاء الراشدين؟', 'أبو بكر الصديق', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصحابة', 'الخلفاء', 'متوسط', 'من ثاني الخلفاء الراشدين؟', 'عمر بن الخطاب', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصحابة', 'الخلفاء', 'متوسط', 'من ثالث الخلفاء الراشدين؟', 'عثمان بن عفان', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصحابة', 'الخلفاء', 'متوسط', 'من رابع الخلفاء الراشدين؟', 'علي بن أبي طالب', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصحابة', 'الألقاب', 'متوسط', 'من الصحابي الملقب بذي النورين؟', 'عثمان بن عفان', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصحابة', 'الألقاب', 'متوسط', 'من الصحابي الملقب بالفاروق؟', 'عمر بن الخطاب', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصحابة', 'الحديث', 'متوسط', 'من أكثر الصحابة رواية للحديث؟', 'أبو هريرة', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصحابة', 'السيرة', 'متوسط', 'من أول الرجال إسلاماً؟', 'أبو بكر الصديق', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصحابة', 'السيرة', 'متوسط', 'من أول الصبيان إسلاماً؟', 'علي بن أبي طالب', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصحابة', 'أمهات المؤمنين', 'متوسط', 'من أم المؤمنين ابنة أبي بكر؟', 'عائشة رضي الله عنها', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('السيرة', 'الدعوة', 'متوسط', 'في أي غار نزل الوحي أول مرة؟', 'غار حراء', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('السيرة', 'الدعوة', 'متوسط', 'من أول من آمن من النساء؟', 'خديجة بنت خويلد', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('السيرة', 'الهجرة', 'متوسط', 'إلى أي مدينة هاجر النبي صلى الله عليه وسلم؟', 'المدينة المنورة', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('السيرة', 'الهجرة', 'متوسط', 'من صاحب النبي صلى الله عليه وسلم في الهجرة؟', 'أبو بكر الصديق', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('السيرة', 'المساجد', 'متوسط', 'ما أول مسجد أسسه النبي صلى الله عليه وسلم بعد الهجرة؟', 'مسجد قباء', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('السيرة', 'الغزوات', 'متوسط', 'ما أول غزوة كبرى في الإسلام؟', 'غزوة بدر', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('السيرة', 'الغزوات', 'متوسط', 'في أي غزوة وقع حفر الخندق؟', 'غزوة الخندق', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('السيرة', 'الغزوات', 'متوسط', 'ما الغزوة التي وقعت في السنة الثالثة للهجرة؟', 'غزوة أحد', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('السيرة', 'الصلح', 'متوسط', 'ما اسم الصلح الذي عقده النبي صلى الله عليه وسلم مع قريش؟', 'صلح الحديبية', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('السيرة', 'الفتح', 'متوسط', 'ما الحدث الذي دخل فيه النبي صلى الله عليه وسلم مكة فاتحاً؟', 'فتح مكة', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأحكام', 'الصلاة', 'متوسط', 'ما أول ما يحاسب عليه العبد من عمله؟', 'الصلاة', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأحكام', 'الصلاة', 'متوسط', 'كم عدد الصلوات المفروضة في اليوم والليلة؟', 'خمس صلوات', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأحكام', 'الصلاة', 'متوسط', 'ما القبلة التي يتجه إليها المسلمون في الصلاة؟', 'الكعبة', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأحكام', 'الطهارة', 'متوسط', 'بماذا يتطهر المسلم عند عدم وجود الماء؟', 'التيمم', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأحكام', 'الطهارة', 'متوسط', 'ما الطهارة المطلوبة قبل الصلاة؟', 'الوضوء', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأحكام', 'الصيام', 'متوسط', 'في أي شهر يصوم المسلمون؟', 'رمضان', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأحكام', 'الصيام', 'متوسط', 'ما الوجبة التي تكون قبل الفجر للصائم؟', 'السحور', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأحكام', 'الزكاة', 'متوسط', 'ما العبادة المالية الواجبة على المال بشروطها؟', 'الزكاة', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأحكام', 'الحج', 'متوسط', 'ما الركن الأعظم في الحج؟', 'الوقوف بعرفة', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الأحكام', 'الحج', 'متوسط', 'ما البيت الذي يقصده المسلمون في الحج؟', 'الكعبة', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصالحون', 'العلماء', 'متوسط', 'من مؤسس المذهب الحنفي؟', 'أبو حنيفة النعمان', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصالحون', 'العلماء', 'متوسط', 'من مؤسس المذهب المالكي؟', 'مالك بن أنس', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصالحون', 'العلماء', 'متوسط', 'من مؤسس المذهب الشافعي؟', 'محمد بن إدريس الشافعي', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصالحون', 'العلماء', 'متوسط', 'من مؤسس المذهب الحنبلي؟', 'أحمد بن حنبل', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصالحون', 'الحديث', 'متوسط', 'من صاحب صحيح البخاري؟', 'محمد بن إسماعيل البخاري', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصالحون', 'الحديث', 'متوسط', 'من صاحب صحيح مسلم؟', 'مسلم بن الحجاج', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصالحون', 'الفقه', 'متوسط', 'من الإمام المعروف بإمام دار الهجرة؟', 'مالك بن أنس', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصالحون', 'التفسير', 'متوسط', 'من الصحابي المشهور بتفسير القرآن؟', 'عبد الله بن عباس', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصالحون', 'الزهد', 'متوسط', 'من التابعي المشهور من أهل البصرة بالزهد والموعظة؟', 'الحسن البصري', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الصالحون', 'العلماء', 'متوسط', 'من الإمام صاحب كتاب الموطأ؟', 'مالك بن أنس', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الألغاز الشرعية', 'عام', 'متوسط', 'شيء يزداد بالإنفاق منه في الخير، فما هو؟', 'الأجر', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الألغاز الشرعية', 'عام', 'متوسط', 'عبادة لا تصح إلا بدخول الوقت والطهارة واستقبال القبلة، فما هي؟', 'الصلاة', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الألغاز الشرعية', 'عام', 'متوسط', 'شهر فيه ليلة خير من ألف شهر، فما هو؟', 'رمضان', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الألغاز الشرعية', 'عام', 'متوسط', 'كتاب لا يأتيه الباطل من بين يديه ولا من خلفه، فما هو؟', 'القرآن الكريم', 'published');
insert into quiz_questions (section, category, level, question, answer, status) values ('الألغاز الشرعية', 'عام', 'متوسط', 'بيت يطوف حوله المسلمون في الحج والعمرة، فما هو؟', 'الكعبة', 'published');
