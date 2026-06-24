-- =====================================================================
-- Majalis security hardening
-- Run in Supabase SQL Editor after the base schema and qa_questions.sql.
-- =====================================================================

-- Harden SECURITY DEFINER helper against search_path hijacking.
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

-- Prevent non-admin users from escalating privileged profile fields.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    if new.role is distinct from old.role
      or new.points is distinct from old.points
      or new.level is distinct from old.level then
      raise exception 'cannot modify privileged profile fields';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileged_columns();

-- Profiles: no public profile enumeration, no role escalation, admin manages users.
drop policy if exists "الجميع يقرأ الملفات العامة" on public.profiles;
drop policy if exists "كل شخص يعدّل ملفه فقط" on public.profiles;
drop policy if exists "المحفّز ينشئ ملف المستخدم" on public.profiles;
drop policy if exists "المستخدم ينشئ ملفه" on public.profiles;
drop policy if exists "المشرف يدير الملفات" on public.profiles;

create policy "قراءة الملف الشخصي"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "المستخدم ينشئ ملفه"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and role = 'user'::user_role
    and points = 0
    and level = 1
  );

create policy "كل شخص يعدّل ملفه فقط"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and points = (select p.points from public.profiles p where p.id = auth.uid())
    and level = (select p.level from public.profiles p where p.id = auth.uid())
  );

create policy "المشرف يدير الملفات"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Fawaid: users can only submit pending items for themselves; admins manage all.
drop policy if exists "أي مستخدم مسجّل يرسل فائدة" on public.fawaid;
drop policy if exists "المشرف يراجع الفوائد" on public.fawaid;
drop policy if exists "المشرف يدير الفوائد" on public.fawaid;
drop policy if exists "المستخدم يرى فوائده" on public.fawaid;

create policy "المستخدم يرسل فائدة"
  on public.fawaid for insert
  with check (
    auth.uid() is not null
    and auth.uid() = submitted_by
    and status = 'pending'::content_status
  );

create policy "المستخدم يرى فوائده"
  on public.fawaid for select
  using (auth.uid() = submitted_by);

create policy "المشرف يدير الفوائد"
  on public.fawaid for all
  using (public.is_admin())
  with check (public.is_admin());

-- QA: public reads require both published and approved.
drop policy if exists "قراءة الأسئلة المنشورة" on public.qa_questions;
create policy "قراءة الأسئلة المنشورة"
  on public.qa_questions for select
  using (
    (status = 'published' and review_status = 'approved')
    or public.is_admin()
  );

-- Tasmee requests: split user and admin policies so admins can update others.
drop policy if exists "إدارة طلبات التسميع الخاصة بي" on public.tasmee_requests;
drop policy if exists "المستخدم يدير طلباته" on public.tasmee_requests;
drop policy if exists "المشرف يدير طلبات التسميع" on public.tasmee_requests;

create policy "المستخدم يدير طلباته"
  on public.tasmee_requests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "المشرف يدير طلبات التسميع"
  on public.tasmee_requests for all
  using (public.is_admin())
  with check (public.is_admin());

-- Achievements: users read their own; admins can award/manage.
drop policy if exists "المشرف يدير الإنجازات" on public.achievements;
create policy "المشرف يدير الإنجازات"
  on public.achievements for all
  using (public.is_admin())
  with check (public.is_admin());
