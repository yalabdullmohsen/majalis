-- توسيع جدول الدروس لدعم مرجع دروس الكويت
-- نفّذ يدويًا في Supabase SQL Editor

alter table lessons
  add column if not exists region text,
  add column if not exists day_of_week text,
  add column if not exists end_date date,
  add column if not exists speaker_name text,
  add column if not exists sheikh_image_url text,
  add column if not exists external_key text;

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
