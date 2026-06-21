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
-- 3) إضافة سياسة INSERT لجدول profiles (مطلوبة لإدخال تلقائي من المحفّز)
--    إذا كانت موجودة بالفعل سيظهر خطأ "already exists" — تجاهله
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'profiles'
      and policyname = 'المحفّز ينشئ ملف المستخدم'
  ) then
    execute $policy$
      create policy "المحفّز ينشئ ملف المستخدم"
        on public.profiles for insert
        with check (true)
    $policy$;
  end if;
end;
$$;

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
