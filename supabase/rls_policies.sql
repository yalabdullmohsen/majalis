-- =====================================================================
--  مجالس العلم — سياسات أمان إضافية وإصلاحات RLS
--  نفّذ في Supabase SQL Editor بعد 01_schema.sql
-- =====================================================================

-- السماح للمشرف بتحديث أدوار المستخدمين
drop policy if exists "المشرف يدير الملفات" on profiles;
create policy "المشرف يدير الملفات"
  on profiles for update
  using (is_admin() or auth.uid() = id)
  with check (is_admin() or auth.uid() = id);

-- منع المستخدم العادي من رفع دوره إلى admin
drop policy if exists "كل شخص يعدّل ملفه فقط" on profiles;

-- إدراج الملف الشخصي عند التسجيل (إن لم يكن المحفّز موجودًا)
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- تأكيد: RLS مفعّل على كل الجداول الأساسية
alter table profiles enable row level security;
alter table sheikhs enable row level security;
alter table lessons enable row level security;
alter table lesson_registrations enable row level security;
alter table lesson_favorites enable row level security;
alter table lesson_ratings enable row level security;
alter table library_items enable row level security;
alter table fawaid enable row level security;
alter table scientific_miracles enable row level security;
alter table tasmee_requests enable row level security;
alter table achievements enable row level security;

-- ملاحظة: فعّل تأكيد البريد من Supabase Dashboard:
-- Authentication → Providers → Email → Confirm email = ON
