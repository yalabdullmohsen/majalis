-- توسيع جدول الدروس لدعم مرجع دروس الكويت والاستيراد
-- Applied automatically before content import when columns are missing.

alter table lessons
  add column if not exists region text,
  add column if not exists day_of_week text,
  add column if not exists end_date date,
  add column if not exists speaker_name text,
  add column if not exists sheikh_image_url text,
  add column if not exists external_key text,
  add column if not exists maps_url text,
  add column if not exists poster_image_url text,
  add column if not exists activity_type text default 'درس',
  add column if not exists is_course boolean default false,
  add column if not exists course_id text,
  add column if not exists session_count integer,
  add column if not exists linked_titles text[],
  add column if not exists website_url text,
  add column if not exists live_url text,
  add column if not exists organizer text,
  add column if not exists co_organizer text;

create unique index if not exists lessons_external_key_uidx
  on lessons (external_key)
  where external_key is not null and external_key <> '';

create index if not exists lessons_kuwait_city_idx on lessons (city);
create index if not exists lessons_kuwait_end_date_idx on lessons (end_date);

comment on column lessons.region is 'المنطقة داخل المحافظة — مثل الصديق';
comment on column lessons.day_of_week is 'يوم الدرس — مثل الجمعة';
comment on column lessons.end_date is 'تاريخ انتهاء الدرس — يُخفى تلقائيًا بعده';
comment on column lessons.speaker_name is 'اسم الشيخ عند عدم الربط بجدول sheikhs';
comment on column lessons.external_key is 'مفتاح فريد لمنع التكرار عند الاستيراد';
