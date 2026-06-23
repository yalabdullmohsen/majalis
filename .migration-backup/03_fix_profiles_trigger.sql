-- =====================================================================
--  إصلاح: ربط auth.users بجدول profiles تلقائياً
--  شغّل هذا في: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) إعادة إنشاء دالة المحفّز (تحذف القديمة إن وجدت)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) حذف المحفّز القديم إن وجد ثم إعادة إنشائه
-- ---------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3) تضييق سياسة INSERT لجدول profiles
--    تسمح للمستخدم بإنشاء ملفه الأساسي فقط، وتمنع حقن role/points/level مخصصة.
-- ---------------------------------------------------------------------
drop policy if exists "المحفّز ينشئ ملف المستخدم" on public.profiles;
drop policy if exists "المستخدم ينشئ ملفه الأساسي فقط" on public.profiles;

create policy "المستخدم ينشئ ملفه الأساسي فقط"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and role = 'user'
    and points = 0
    and level = 1
  );

-- ---------------------------------------------------------------------
-- 4) تعبئة المستخدمين الحاليين الذين ليس لهم profile بعد
--    (Backfill) — آمن تماماً لأنه يستخدم ON CONFLICT DO NOTHING
-- ---------------------------------------------------------------------
insert into public.profiles (id, full_name, role)
select
  au.id,
  coalesce(au.raw_user_meta_data->>'full_name', ''),
  'user'
from auth.users au
where not exists (
  select 1 from public.profiles p where p.id = au.id
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- نهاية الإصلاح.
-- =====================================================================
