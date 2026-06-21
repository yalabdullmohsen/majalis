-- =====================================================================
--  منصة "مجالس" — قسم الأسئلة والأجوبة الدينية
--  جداول: qa_categories (التصنيفات) + qa_questions (الأسئلة)
--
--  كيف تستخدمه: انسخ هذا الملف كاملًا والصقه في:
--  Supabase Dashboard → SQL Editor → New query → Run
--
--  ملاحظة: السطران التاليان (drop) يعيدان ضبط جداول القسم لتطبيق المخطط
--  بشكل نظيف. احذفهما إذا كان لديك بيانات لا تريد فقدانها.
-- =====================================================================

drop table if exists qa_questions  cascade;
drop table if exists qa_categories cascade;

-- ---------------------------------------------------------------------
-- 1) التصنيفات الرئيسية
-- ---------------------------------------------------------------------
create table if not exists qa_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  description text,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 2) الأسئلة والأجوبة
-- ---------------------------------------------------------------------
create table if not exists qa_questions (
  id            uuid primary key default gen_random_uuid(),
  question      text not null,                       -- السؤال
  answer        text not null,                       -- الجواب
  category_id   uuid references qa_categories(id) on delete set null,  -- التصنيف
  ruling_type   text check (                         -- نوع الحكم (لأحكام الشرعية)
    ruling_type in ('حلال','حرام','مكروه','مباح','سنة','مندوب')
    or ruling_type is null
  ),
  evidence      text,                                -- الدليل الشرعي
  reference     text,                                -- المرجع
  status        text default 'draft'                 -- حالة النشر
                  check (status in ('draft','published')),
  review_status text default 'needs_review'          -- درجة الاعتماد
                  check (review_status in ('approved','needs_review')),
  created_at    timestamptz default now(),           -- تاريخ الإضافة
  updated_at    timestamptz default now()
);

create index if not exists qa_questions_category_idx on qa_questions (category_id);
create index if not exists qa_questions_status_idx    on qa_questions (status);
create index if not exists qa_questions_created_idx   on qa_questions (created_at desc);

-- ---------------------------------------------------------------------
-- 3) التصنيفات الافتراضية
-- ---------------------------------------------------------------------
insert into qa_categories (name, slug, description) values
('أحكام شرعية',   'rulings',                'أسئلة وأجوبة في الأحكام الشرعية'),
('قصص الأنبياء',  'prophets-stories',       'أسئلة عن قصص الأنبياء عليهم السلام'),
('سير الصالحين',  'righteous-biographies',  'فوائد وسير من حياة الصالحين'),
('السيرة النبوية','seerah',                 'أسئلة في سيرة النبي محمد صلى الله عليه وسلم'),
('الصحابة',       'companions',             'أسئلة عن الصحابة رضي الله عنهم'),
('ألغاز فقهية',   'fiqh-puzzles',           'ألغاز ومسائل فقهية تعليمية')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 4) أمان مستوى الصف (RLS)
--    الجميع يقرأ المنشور فقط، والمشرف يدير كل شيء.
--    يعتمد على دالة is_admin() المعرّفة في 01_schema.sql — شغّل المخطط الأساسي أولًا.
-- ---------------------------------------------------------------------
alter table qa_categories enable row level security;
alter table qa_questions  enable row level security;

drop policy if exists "قراءة التصنيفات" on qa_categories;
create policy "قراءة التصنيفات"
  on qa_categories for select using (true);

drop policy if exists "المشرف يدير التصنيفات" on qa_categories;
create policy "المشرف يدير التصنيفات"
  on qa_categories for all using (is_admin()) with check (is_admin());

drop policy if exists "قراءة الأسئلة المنشورة" on qa_questions;
create policy "قراءة الأسئلة المنشورة"
  on qa_questions for select using (status = 'published' or is_admin());

drop policy if exists "المشرف يدير الأسئلة" on qa_questions;
create policy "المشرف يدير الأسئلة"
  on qa_questions for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- 5) بيانات أولية (اختيارية) — أمثلة علمية تعليمية موثّقة
-- ---------------------------------------------------------------------
insert into qa_questions (question, answer, category_id, ruling_type, evidence, reference, status, review_status) values
(
  'ما حكم صيام يوم عرفة لغير الحاج؟',
  'صيام يوم عرفة لغير الحاج سنة مؤكدة، وهو من أفضل الأيام التي يُستحب صيامها لما فيه من تكفير الذنوب.',
  (select id from qa_categories where slug = 'rulings'), 'سنة',
  'عن أبي قتادة رضي الله عنه أن النبي ﷺ سُئل عن صوم يوم عرفة فقال: «يُكفِّر السنة الماضية والباقية».',
  'صحيح مسلم، كتاب الصيام',
  'published', 'approved'
),
(
  'ما حكم أكل الميتة عند الاضطرار؟',
  'يجوز أكل الميتة عند الاضطرار الشديد الذي يُخشى معه الهلاك، بقدر ما يسد الرمق، رفعًا للحرج.',
  (select id from qa_categories where slug = 'rulings'), 'مباح',
  'قال تعالى: ﴿فَمَنِ اضْطُرَّ غَيْرَ بَاغٍ وَلَا عَادٍ فَلَا إِثْمَ عَلَيْهِ﴾ [البقرة: 173].',
  'تفسير ابن كثير',
  'published', 'approved'
),
(
  'كم عدد أولي العزم من الرسل وما أسماؤهم؟',
  'أولو العزم من الرسل خمسة، وهم: نوح وإبراهيم وموسى وعيسى ومحمد عليهم الصلاة والسلام، وقد خصّهم الله بالصبر والثبات في الدعوة.',
  (select id from qa_categories where slug = 'prophets-stories'), null,
  'قال تعالى: ﴿وَإِذْ أَخَذْنَا مِنَ النَّبِيِّينَ مِيثَاقَهُمْ وَمِنكَ وَمِن نُّوحٍ وَإِبْرَاهِيمَ وَمُوسَىٰ وَعِيسَى ابْنِ مَرْيَمَ﴾ [الأحزاب: 7].',
  'تفسير السعدي',
  'published', 'approved'
),
(
  'من هو أول من أسلم من الرجال الأحرار؟',
  'أول من أسلم من الرجال الأحرار هو أبو بكر الصديق رضي الله عنه، وكان من أقرب الناس إلى النبي ﷺ وأكثرهم تصديقًا له.',
  (select id from qa_categories where slug = 'companions'), null,
  'ثبت في السيرة سبقُه إلى الإسلام ومبادرته بتصديق النبي ﷺ ليلة الإسراء.',
  'سيرة ابن هشام',
  'published', 'approved'
),
(
  'في أي عام كانت الهجرة النبوية إلى المدينة؟',
  'كانت الهجرة النبوية من مكة إلى المدينة في السنة الثالثة عشرة من البعثة، واتُّخذت بداية للتقويم الهجري في عهد عمر بن الخطاب رضي الله عنه.',
  (select id from qa_categories where slug = 'seerah'), null,
  'أجمع أهل السير على وقوع الهجرة بعد البعثة بثلاث عشرة سنة.',
  'الرحيق المختوم',
  'published', 'approved'
),
(
  'لغز: رجل عليه صيام شهرين متتابعين كفّارة، فأفطر يومًا لعذر شرعي في أثنائهما، فهل ينقطع التتابع؟',
  'إذا كان الفطر لعذر شرعي كالمرض أو الحيض، فالراجح عند جمهور أهل العلم أنه لا ينقطع التتابع، بل يبني على ما مضى بعد زوال العذر؛ لأن الفطر لم يكن باختياره.',
  (select id from qa_categories where slug = 'fiqh-puzzles'), null,
  'قياسًا على قطع التتابع المنهي عنه بالفطر دون عذر، فإن العذر يرفع الإثم ويحفظ التتابع.',
  'المغني لابن قدامة',
  'published', 'needs_review'
);

-- =====================================================================
--  انتهى. بعد التشغيل سيظهر قسم "الأسئلة والأجوبة" بمحتواه.
-- =====================================================================
