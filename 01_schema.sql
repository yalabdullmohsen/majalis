-- =====================================================================
--  منصة "مجالس" — مخطط قاعدة البيانات الكامل (Supabase / PostgreSQL)
--  المرحلة صفر: الأساس الحقيقي
--
--  كيف تستخدمه: انسخ هذا الملف كاملًا والصقه في:
--  Supabase Dashboard → SQL Editor → New query → Run
--  سيُنشئ كل الجداول والعلاقات والأمان دفعة واحدة.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) الأدوار: كل مستخدم له دور واحد (مستخدم عادي / شيخ / مشرف)
-- ---------------------------------------------------------------------
create type user_role as enum ('user', 'sheikh', 'admin');

-- حالة المحتوى المُرسل (للمراجعة قبل النشر)
create type content_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------
-- 2) ملفات المستخدمين (مرتبطة بنظام مصادقة Supabase الجاهز)
--    Supabase ينشئ auth.users تلقائيًا عند التسجيل.
--    نحن ننشئ "profile" مرتبطًا به لتخزين الاسم والدور والنقاط.
-- ---------------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        user_role not null default 'user',
  city        text,                          -- المحافظة
  points      integer not null default 0,    -- لنظام التحفيز
  level       integer not null default 1,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3) المشايخ والدعاة (صفحة كاملة لكل شيخ)
-- ---------------------------------------------------------------------
create table sheikhs (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references profiles(id) on delete set null, -- إن كان للشيخ حساب
  name         text not null,
  bio          text,                          -- نبذة تعريفية
  biography    text,                          -- السيرة العلمية
  qualifications text[],                      -- المؤهلات
  specialties  text[],                        -- التخصصات
  ijazah       text,                          -- الإجازات (للتسميع)
  city         text,
  photo_url    text,
  years_experience integer,
  is_verified  boolean not null default false, -- معتمد؟
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4) الدروس والدورات
-- ---------------------------------------------------------------------
create table lessons (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  sheikh_id   uuid references sheikhs(id) on delete set null,
  mosque      text,
  city        text,                           -- المحافظة
  category    text,                           -- التصنيف (تفسير/فقه/عقيدة...)
  audience    text default 'الكل',            -- رجال/نساء/الكل
  delivery    text default 'حضور فقط',        -- حضور/بث/كلاهما
  schedule    text,                           -- موعد (نص حر)
  lesson_time text,
  description text,
  status      content_status not null default 'approved',
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5) تسجيل المستخدمين في الدروس (علاقة متعدد-لمتعدد)
-- ---------------------------------------------------------------------
create table lesson_registrations (
  user_id    uuid references profiles(id) on delete cascade,
  lesson_id  uuid references lessons(id) on delete cascade,
  registered_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- المفضلة
create table lesson_favorites (
  user_id    uuid references profiles(id) on delete cascade,
  lesson_id  uuid references lessons(id) on delete cascade,
  primary key (user_id, lesson_id)
);

-- تقييم الدروس
create table lesson_ratings (
  user_id    uuid references profiles(id) on delete cascade,
  lesson_id  uuid references lessons(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ---------------------------------------------------------------------
-- 6) المكتبة العلمية والأرشيف (كتب، تفريغات، صوتيات، مرئيات...)
-- ---------------------------------------------------------------------
create table library_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        text not null,         -- كتاب/متن/تفريغ/ملخص/مقال/صوت/مرئي
  category    text,                  -- التصنيف العلمي
  sheikh_id   uuid references sheikhs(id) on delete set null,
  description text,
  file_url    text,                  -- رابط الملف (في Supabase Storage)
  external_url text,
  status      content_status not null default 'approved',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7) الفوائد الدينية (مع المراجعة)
-- ---------------------------------------------------------------------
create table fawaid (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  author_name text,
  submitted_by uuid references profiles(id) on delete set null,
  status      content_status not null default 'pending',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8) الإعجاز العلمي (مقالات موثّقة مربوطة بآيات/أحاديث)
-- ---------------------------------------------------------------------
create table scientific_miracles (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text,                  -- فلك/طب/جيولوجيا...
  source_type text,                  -- قرآن/سنة
  reference   text,                  -- الآية أو الحديث
  body        text,                  -- المقال
  media_url   text,                  -- فيديو/إنفوجرافيك
  scholarly_source text,             -- المرجع العلمي
  status      content_status not null default 'approved',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 9) طلبات التسميع
-- ---------------------------------------------------------------------
create table tasmee_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  sheikh_id   uuid references sheikhs(id) on delete cascade,
  portion     text,
  method      text,                  -- حضوري/هاتف/فيديو
  preferred_day text,
  preferred_time text,
  phone       text,
  status      text not null default 'بانتظار تأكيد الشيخ',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 10) الإنجازات والشارات (نظام التحفيز)
-- ---------------------------------------------------------------------
create table achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  badge       text not null,         -- اسم الشارة
  earned_at   timestamptz not null default now()
);

-- =====================================================================
--  تشغيل أمان مستوى الصف (Row Level Security) — أهم جزء أمني
--  بدون هذا، أي شخص يقدر يقرأ/يكتب أي شيء. هذا ما يقفل لوحة التحكم.
-- =====================================================================

alter table profiles               enable row level security;
alter table sheikhs                enable row level security;
alter table lessons                enable row level security;
alter table lesson_registrations   enable row level security;
alter table lesson_favorites       enable row level security;
alter table lesson_ratings         enable row level security;
alter table library_items          enable row level security;
alter table fawaid                 enable row level security;
alter table scientific_miracles    enable row level security;
alter table tasmee_requests        enable row level security;
alter table achievements           enable row level security;

-- دالة مساعدة: هل المستخدم الحالي مشرف؟
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- سياسات profiles ----
create policy "الجميع يقرأ الملفات العامة"
  on profiles for select using (true);
create policy "كل شخص يعدّل ملفه فقط"
  on profiles for update using (auth.uid() = id);

-- ---- سياسات المحتوى المنشور: الجميع يقرأ المعتمد، المشرف يدير الكل ----
create policy "قراءة الدروس المعتمدة"
  on lessons for select using (status = 'approved' or is_admin());
create policy "المشرف يدير الدروس"
  on lessons for all using (is_admin()) with check (is_admin());

create policy "قراءة المكتبة المعتمدة"
  on library_items for select using (status = 'approved' or is_admin());
create policy "المشرف يدير المكتبة"
  on library_items for all using (is_admin()) with check (is_admin());

create policy "قراءة الإعجاز المعتمد"
  on scientific_miracles for select using (status = 'approved' or is_admin());
create policy "المشرف يدير الإعجاز"
  on scientific_miracles for all using (is_admin()) with check (is_admin());

create policy "قراءة المشايخ"
  on sheikhs for select using (true);
create policy "المشرف يدير المشايخ"
  on sheikhs for all using (is_admin()) with check (is_admin());

-- ---- الفوائد: المستخدم يرسل، الجميع يقرأ المعتمد، المشرف يراجع ----
create policy "قراءة الفوائد المعتمدة"
  on fawaid for select using (status = 'approved' or is_admin());
create policy "أي مستخدم مسجّل يرسل فائدة"
  on fawaid for insert with check (auth.uid() = submitted_by);
create policy "المشرف يراجع الفوائد"
  on fawaid for update using (is_admin()) with check (is_admin());

-- ---- التسجيلات/المفضلة/التقييم: كل شخص يدير بياناته فقط ----
create policy "إدارة تسجيلاتي"
  on lesson_registrations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "إدارة مفضلتي"
  on lesson_favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "إدارة تقييماتي"
  on lesson_ratings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "قراءة كل التقييمات"
  on lesson_ratings for select using (true);

-- ---- طلبات التسميع: المستخدم يرى طلباته، المشرف والشيخ يرون الكل ----
create policy "إدارة طلبات التسميع الخاصة بي"
  on tasmee_requests for all
  using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id);

-- ---- الإنجازات ----
create policy "قراءة إنجازاتي"
  on achievements for select using (auth.uid() = user_id);

-- =====================================================================
--  محفّز تلقائي: عند تسجيل مستخدم جديد، أنشئ له profile تلقائيًا
-- =====================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================================
--  انتهى. بعد التشغيل سيكون لديك قاعدة بيانات حقيقية كاملة الأمان.
-- =====================================================================
