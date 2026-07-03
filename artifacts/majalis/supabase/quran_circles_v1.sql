-- ============================================================
-- Migration: quran_circles — حلقات تحفيظ القرآن الكريم
-- Convention: snake_case, consistent with existing tables
-- ============================================================

create table if not exists public.quran_circles (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  sheikh_name     text,                      -- اسم الشيخ/المعلم (نص مباشر أو مرتبط)
  level           text not null default 'مبتدئ'
                    check (level in ('مبتدئ', 'متوسط', 'متقدم')),
  track           text not null default 'عام'
                    check (track in ('رجال', 'نساء', 'أطفال', 'عام')),
  mode            text not null default 'حضوري'
                    check (mode in ('حضوري', 'عن بُعد', 'هجين')),
  meeting_link    text,                      -- رابط المجلس عن بُعد (إن وُجد)
  location        text,                      -- موقع موثّق — لا تخمين
  schedule_days   text[],                    -- أيام الأسبوع ["الأحد","الثلاثاء"]
  schedule_time   text,                      -- "HH:MM" — توقيت المجلس
  capacity        integer,
  enrolled_count  integer not null default 0,
  description     text,
  cover_image     text,                      -- رابط صورة الغلاف
  contact_info    text,                      -- رقم تواصل أو بريد
  verified_by     text,                      -- اسم المتحقق البشري
  is_approved     boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- فهارس الأداء
create index if not exists quran_circles_level_idx    on public.quran_circles (level);
create index if not exists quran_circles_track_idx    on public.quran_circles (track);
create index if not exists quran_circles_mode_idx     on public.quran_circles (mode);
create index if not exists quran_circles_active_idx   on public.quran_circles (is_active, is_approved);

-- تحديث updated_at تلقائياً
create or replace function public.update_quran_circles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quran_circles_updated_at on public.quran_circles;
create trigger quran_circles_updated_at
  before update on public.quran_circles
  for each row execute function public.update_quran_circles_updated_at();

-- RLS: القراءة مفتوحة للمعتمدة والنشطة
alter table public.quran_circles enable row level security;

create policy "quran_circles_public_read"
  on public.quran_circles for select
  using (is_active = true and is_approved = true);

create policy "quran_circles_admin_all"
  on public.quran_circles for all
  using (public.is_admin());
