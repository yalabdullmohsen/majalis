-- ══════════════════════════════════════════════════════
-- بطاقات الحفظ — هجرة Supabase
-- الموضع: supabase/migrations/20260805000000_flashcards.sql
-- التشغيل: supabase db push   (أو الصقها في SQL Editor)
-- ══════════════════════════════════════════════════════

-- ١ · الرزم
create table if not exists sr_decks (
  slug        text primary key,
  title       text not null,
  section     text,                       -- 'hadith' | 'fiqh' | 'quran' …
  sort_order  int  default 0,
  created_at  timestamptz default now()
);

-- ٢ · البطاقات (مشتركة بين جميع المستخدمين — لا تتضاعف نصوص المتون)
create table if not exists sr_cards (
  id          uuid primary key default gen_random_uuid(),
  deck_slug   text not null references sr_decks(slug) on delete cascade,
  ordinal     int  not null,
  face        text not null,              -- وجه البطاقة
  back        text not null,              -- التكملة
  source_ref  text,                       -- «متفق عليه · عن عمر بن الخطاب»
  created_at  timestamptz default now(),
  unique (deck_slug, ordinal)
);

-- ٣ · حالة المراجعة (خاصة بكل مستخدم)
create table if not exists sr_reviews (
  user_id     uuid not null references auth.users(id) on delete cascade,
  card_id     uuid not null references sr_cards(id)  on delete cascade,
  due_on      date not null default current_date,
  interval    int  not null default 0,
  ease        numeric(3,2) not null default 2.5,
  reps        int  not null default 0,
  lapses      int  not null default 0,
  last_rating text check (last_rating in ('hard','later','ok')),
  updated_at  timestamptz default now(),
  primary key (user_id, card_id)
);

create index if not exists sr_reviews_due_idx on sr_reviews (user_id, due_on);
create index if not exists sr_cards_deck_idx  on sr_cards (deck_slug, ordinal);

-- ٤ · الأمان
alter table sr_decks   enable row level security;
alter table sr_cards   enable row level security;
alter table sr_reviews enable row level security;

drop policy if exists "قراءة الرزم للجميع" on sr_decks;
create policy "قراءة الرزم للجميع" on sr_decks for select using (true);

drop policy if exists "قراءة البطاقات للجميع" on sr_cards;
create policy "قراءة البطاقات للجميع" on sr_cards for select using (true);

drop policy if exists "صفوف المستخدم نفسه" on sr_reviews;
create policy "صفوف المستخدم نفسه" on sr_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ٥ · بطاقات اليوم: المستحقة + الجديدة التي لم تُراجع بعد
create or replace function sr_due_cards(p_deck text default null, p_limit int default 20)
returns table (
  id uuid, deck_slug text, ordinal int, face text, back text, source_ref text,
  "interval" int, ease numeric, reps int
)
language sql stable security invoker
set search_path = public
as $$
  select c.id, c.deck_slug, c.ordinal, c.face, c.back, c.source_ref,
         coalesce(r.interval, 0) as "interval",
         coalesce(r.ease, 2.5)   as ease,
         coalesce(r.reps, 0)     as reps
  from sr_cards c
  left join sr_reviews r
         on r.card_id = c.id and r.user_id = auth.uid()
  where (p_deck is null or c.deck_slug = p_deck)
    and (r.card_id is null or r.due_on <= current_date)
  order by r.due_on nulls last, c.ordinal
  limit p_limit;
$$;

-- ٦ · ملخّص الرزم لشاشة البداية
create or replace function sr_deck_summary()
returns table (slug text, title text, total bigint, due bigint, next_due date)
language sql stable security invoker
set search_path = public
as $$
  select d.slug, d.title,
         count(c.id) as total,
         count(*) filter (where r.card_id is null or r.due_on <= current_date) as due,
         min(r.due_on) filter (where r.due_on > current_date) as next_due
  from sr_decks d
  join sr_cards c on c.deck_slug = d.slug
  left join sr_reviews r on r.card_id = c.id and r.user_id = auth.uid()
  group by d.slug, d.title, d.sort_order
  order by d.sort_order, d.slug;
$$;

-- ٧ · بذرة مبدئية (احذفها إن كنت ستستورد المحتوى من جرد الموقع)
insert into sr_decks (slug, title, section, sort_order) values
  ('arbaeen', 'الأربعون النووية', 'hadith', 1),
  ('terms',   'مصطلحات الحديث',  'hadith', 2),
  ('qawaid',  'القواعد الفقهية',  'fiqh',   3)
on conflict (slug) do nothing;

insert into sr_cards (deck_slug, ordinal, face, back, source_ref) values
  ('arbaeen', 1, 'إنما الأعمال بالنيات…', 'وإنما لكل امرئ ما نوى.', 'متفق عليه · عن عمر بن الخطاب'),
  ('arbaeen', 2, 'من حسن إسلام المرء…', 'تركه ما لا يعنيه.', 'الترمذي · حديث حسن'),
  ('arbaeen', 3, 'لا يؤمن أحدكم حتى…', 'يحب لأخيه ما يحب لنفسه.', 'متفق عليه · عن أنس'),
  ('terms',   1, 'الحديث الحسن', 'ما اتصل سنده بنقل عدل خفّ ضبطه، من غير شذوذ ولا علة.', 'علوم الحديث'),
  ('terms',   2, 'الحديث الشاذ', 'ما خالف فيه الثقةُ من هو أوثق منه.', 'علوم الحديث'),
  ('qawaid',  1, 'الأمور بمقاصدها', 'الفعل الواحد يكون عبادة أو عادة بحسب نية صاحبه.', 'القاعدة الأولى')
on conflict (deck_slug, ordinal) do nothing;
