-- =====================================================================
--  منصة "مجالس" — إصلاحات أولوية 0 الأمنية
--
--  الهدف:
--  - إصلاح RLS على profiles.
--  - منع المستخدم العادي من تعديل role أو points أو level.
--  - إضافة سياسة واضحة للمشرف لتحديث أدوار المستخدمين.
--  - تضييق INSERT على profiles.
--  - إصلاح is_admin بإضافة search_path آمن.
--  - تمكين المشرفين من إدارة fawaid بالكامل.
--
--  شغّل هذا الملف على قاعدة Supabase الحالية بعد المخطط الأساسي.
-- =====================================================================

begin;

alter table public.profiles enable row level security;
alter table public.fawaid enable row level security;

-- ---------------------------------------------------------------------
-- دالة التحقق من المشرف بصلاحيات محددة ومسار بحث آمن
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- سياسات profiles
-- ---------------------------------------------------------------------
drop policy if exists "الجميع يقرأ الملفات العامة" on public.profiles;
drop policy if exists "كل شخص يعدّل ملفه فقط" on public.profiles;
drop policy if exists "المحفّز ينشئ ملف المستخدم" on public.profiles;
drop policy if exists "قراءة ملفي الشخصي" on public.profiles;
drop policy if exists "المستخدم ينشئ ملفه الأساسي فقط" on public.profiles;
drop policy if exists "المستخدم يعدل بياناته العامة فقط" on public.profiles;
drop policy if exists "المشرف يحدث ملفات المستخدمين والأدوار" on public.profiles;

create policy "قراءة ملفي الشخصي"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "المستخدم ينشئ ملفه الأساسي فقط"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and role = 'user'
    and points = 0
    and level = 1
  );

create policy "المستخدم يعدل بياناته العامة فقط"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "المشرف يحدث ملفات المستخدمين والأدوار"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- حاجز إضافي على الأعمدة الحساسة:
-- RLS لا يقيّد الأعمدة مباشرة، لذلك يمنع هذا trigger أي مستخدم غير مشرف
-- من تغيير role أو points أو level حتى لو حاول عبر update مباشر.
-- ---------------------------------------------------------------------
drop trigger if exists prevent_profile_protected_column_update on public.profiles;
drop function if exists public.prevent_profile_protected_column_update();

create function public.prevent_profile_protected_column_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin()
    and (
      new.role is distinct from old.role
      or new.points is distinct from old.points
      or new.level is distinct from old.level
    )
  then
    raise exception 'Only admins can update profile role, points, or level'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger prevent_profile_protected_column_update
  before update of role, points, level on public.profiles
  for each row
  execute function public.prevent_profile_protected_column_update();

-- ---------------------------------------------------------------------
-- سياسات fawaid للمشرفين
-- تبقى سياسة إرسال المستخدم لفائدته كما هي، ونضيف إدارة كاملة للمشرف
-- لتغطي insert/update/delete بوضوح.
-- ---------------------------------------------------------------------
drop policy if exists "المشرف يراجع الفوائد" on public.fawaid;
drop policy if exists "المشرف يدير الفوائد" on public.fawaid;

create policy "المشرف يدير الفوائد"
  on public.fawaid for all
  using (public.is_admin())
  with check (public.is_admin());

commit;
