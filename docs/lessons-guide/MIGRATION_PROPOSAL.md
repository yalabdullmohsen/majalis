# دليل الدروس — مقترح Migration (غير مطبَّق)

**الحالة:** مقترح فقط · **لا يُنفَّذ على Supabase المستضاف دون موافقة المالك.**  
**السبب:** الطبقة الجغرافية مصنّفة `BLOCKED_DATA` إلى أن تتوفر أعمدة + بيانات موثّقة.

## الوضع الحالي

جدول `lessons` (مرجع `.migration-backup/01_schema.sql` + حقول لاحقة في العميل):

- مكان نصي: `mosque`, `city`, `region`
- موعد نصي: `schedule`, `lesson_time`, `day_of_week`
- رابط: `maps_url` (أحيانًا يحتوي `?q=lat,lng` وأحيانًا بحثًا نصيًا فقط)
- **لا** أعمدة `latitude` / `longitude` / `starts_at` مخصّصة

## الأعمدة المقترحة (اختياري · موافقة مالك)

```sql
-- مقترح فقط — لا تُنفَّذ في هذه الموجة
alter table lessons
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists timezone text default 'Asia/Kuwait',
  add column if not exists schedule_status text
    check (schedule_status in (
      'upcoming','live','completed','cancelled','postponed','draft'
    ));

comment on column lessons.latitude is 'WGS84؛ فقط عند توثيق بشري — لا geocode آلي لاسم المسجد';
comment on column lessons.longitude is 'WGS84؛ فقط عند توثيق بشري';
```

## قواعد ملء البيانات

1. لا geocode آلي من اسم المسجد/المنطقة.
2. لا إظهار نقطة خريطة بلا `latitude`+`longitude` صالحين.
3. لا اعتبار درس «قادم» بلا موعد صالح (`day`+`time` أو `starts_at`).
4. Draft / cancelled خارج العرض العام.

## سلوك المنتج حتى الموافقة

- وضع **القائمة / الخط الزمني** يعمل من البيانات الحالية.
- تبويب **الخريطة** خلف `lessonsGuideMapEnabled` ويُعطَّل عند `BLOCKED_DATA` أو يعرض فقط الروابط ذات الإحداثيات الصريحة في `maps_url`.
