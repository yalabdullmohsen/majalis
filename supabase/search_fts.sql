-- =====================================================================
--  منصة "مجالس العلم" — Full Text Search + فهارس الأداء
--  شغّل هذا الملف في Supabase SQL Editor بعد 01_schema.sql و qa_questions.sql
-- =====================================================================

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- 1) أعمدة البحث للدروس (المجالس)
-- ---------------------------------------------------------------------
alter table lessons
  add column if not exists keywords text[] default '{}',
  add column if not exists speaker_name text;

-- مزامنة اسم الشيخ
create or replace function sync_lesson_speaker_name()
returns trigger language plpgsql as $$
begin
  if new.sheikh_id is not null then
    select name into new.speaker_name from sheikhs where id = new.sheikh_id;
  else
    new.speaker_name := coalesce(new.speaker_name, '');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lessons_speaker_name on lessons;
create trigger trg_lessons_speaker_name
  before insert or update of sheikh_id on lessons
  for each row execute function sync_lesson_speaker_name();

update lessons l
set speaker_name = s.name
from sheikhs s
where l.sheikh_id = s.id and (l.speaker_name is null or l.speaker_name = '');

-- ---------------------------------------------------------------------
-- 2) تطبيع عربي للبحث (غير حساس للهمزات والتشكيل)
-- ---------------------------------------------------------------------
create or replace function normalize_ar(input text)
returns text language sql immutable as $$
  select lower(
    translate(
      regexp_replace(coalesce(input, ''), '[ً-ْٰ]', '', 'g'),
      'أإآٱؤئةى', 'ااااوييهي'
    )
  );
$$;

-- ---------------------------------------------------------------------
-- 3) فهارس B-tree + GIN trigram
-- ---------------------------------------------------------------------
create index if not exists lessons_title_idx on lessons (title);
create index if not exists lessons_description_idx on lessons (description);
create index if not exists lessons_speaker_name_idx on lessons (speaker_name);

create index if not exists lessons_title_trgm_idx
  on lessons using gin (normalize_ar(title) gin_trgm_ops);
create index if not exists lessons_description_trgm_idx
  on lessons using gin (normalize_ar(description) gin_trgm_ops);
create index if not exists lessons_speaker_trgm_idx
  on lessons using gin (normalize_ar(speaker_name) gin_trgm_ops);

create index if not exists sheikhs_name_trgm_idx
  on sheikhs using gin (normalize_ar(name) gin_trgm_ops);

create index if not exists library_title_trgm_idx
  on library_items using gin (normalize_ar(title) gin_trgm_ops);

create index if not exists qa_question_trgm_idx
  on qa_questions using gin (normalize_ar(question) gin_trgm_ops);

-- ---------------------------------------------------------------------
-- 4) عمود search_vector للـ FTS
-- ---------------------------------------------------------------------
alter table lessons add column if not exists search_vector tsvector;
alter table sheikhs add column if not exists search_vector tsvector;
alter table library_items add column if not exists search_vector tsvector;
alter table qa_questions add column if not exists search_vector tsvector;

create or replace function lessons_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(new.title)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(new.description, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(new.speaker_name, ''))), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(new.keywords, ' '), ''))), 'C');
  return new;
end;
$$;

drop trigger if exists trg_lessons_search_vector on lessons;
create trigger trg_lessons_search_vector
  before insert or update on lessons
  for each row execute function lessons_search_vector_update();

create or replace function sheikhs_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(new.name)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(new.bio, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(new.biography, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(new.specialties, ' '), ''))), 'C');
  return new;
end;
$$;

drop trigger if exists trg_sheikhs_search_vector on sheikhs;
create trigger trg_sheikhs_search_vector
  before insert or update on sheikhs
  for each row execute function sheikhs_search_vector_update();

create or replace function library_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(new.title)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(new.description, ''))), 'B');
  return new;
end;
$$;

drop trigger if exists trg_library_search_vector on library_items;
create trigger trg_library_search_vector
  before insert or update on library_items
  for each row execute function library_search_vector_update();

create or replace function qa_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(new.question)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(new.answer, ''))), 'B');
  return new;
end;
$$;

drop trigger if exists trg_qa_search_vector on qa_questions;
create trigger trg_qa_search_vector
  before insert or update on qa_questions
  for each row execute function qa_search_vector_update();

-- backfill vectors
update lessons set search_vector =
  setweight(to_tsvector('simple', normalize_ar(title)), 'A') ||
  setweight(to_tsvector('simple', normalize_ar(coalesce(description, ''))), 'B') ||
  setweight(to_tsvector('simple', normalize_ar(coalesce(speaker_name, ''))), 'A') ||
  setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(keywords, ' '), ''))), 'C');

update sheikhs set search_vector =
  setweight(to_tsvector('simple', normalize_ar(name)), 'A') ||
  setweight(to_tsvector('simple', normalize_ar(coalesce(bio, ''))), 'B') ||
  setweight(to_tsvector('simple', normalize_ar(coalesce(biography, ''))), 'B') ||
  setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(specialties, ' '), ''))), 'C');

update library_items set search_vector =
  setweight(to_tsvector('simple', normalize_ar(title)), 'A') ||
  setweight(to_tsvector('simple', normalize_ar(coalesce(description, ''))), 'B');

update qa_questions set search_vector =
  setweight(to_tsvector('simple', normalize_ar(question)), 'A') ||
  setweight(to_tsvector('simple', normalize_ar(coalesce(answer, ''))), 'B');

create index if not exists lessons_search_vector_idx on lessons using gin (search_vector);
create index if not exists sheikhs_search_vector_idx on sheikhs using gin (search_vector);
create index if not exists library_search_vector_idx on library_items using gin (search_vector);
create index if not exists qa_search_vector_idx on qa_questions using gin (search_vector);

-- ---------------------------------------------------------------------
-- 5) دالة RPC للبحث الشامل
-- ---------------------------------------------------------------------
create or replace function search_platform(query text)
returns json language plpgsql security definer stable as $$
declare
  q_norm text := normalize_ar(trim(coalesce(query, '')));
  q_like text := '%' || q_norm || '%';
begin
  if length(q_norm) < 1 then
    return json_build_object(
      'lessons', '[]'::json,
      'sheikhs', '[]'::json,
      'library', '[]'::json,
      'miracles', '[]'::json,
      'qa', '[]'::json,
      'fawaid', '[]'::json
    );
  end if;

  return json_build_object(
    'lessons', coalesce((
      select json_agg(row_to_json(t))
      from (
        select id, title, category, speaker_name
        from lessons
        where status = 'approved'
          and (
            normalize_ar(title) like q_like
            or normalize_ar(coalesce(description, '')) like q_like
            or normalize_ar(coalesce(speaker_name, '')) like q_like
            or exists (
              select 1 from unnest(coalesce(keywords, '{}')) kw
              where normalize_ar(kw) like q_like
            )
            or search_vector @@ plainto_tsquery('simple', q_norm)
          )
        order by created_at desc
        limit 30
      ) t
    ), '[]'::json),
    'sheikhs', coalesce((
      select json_agg(row_to_json(t))
      from (
        select id, name
        from sheikhs
        where normalize_ar(name) like q_like
           or normalize_ar(coalesce(bio, '')) like q_like
           or search_vector @@ plainto_tsquery('simple', q_norm)
        order by name
        limit 20
      ) t
    ), '[]'::json),
    'library', coalesce((
      select json_agg(row_to_json(t))
      from (
        select id, title, type
        from library_items
        where status = 'approved'
          and (
            normalize_ar(title) like q_like
            or normalize_ar(coalesce(description, '')) like q_like
            or search_vector @@ plainto_tsquery('simple', q_norm)
          )
        order by created_at desc
        limit 20
      ) t
    ), '[]'::json),
    'miracles', coalesce((
      select json_agg(row_to_json(t))
      from (
        select id, title, category
        from scientific_miracles
        where status = 'approved'
          and (
            normalize_ar(title) like q_like
            or normalize_ar(coalesce(body, '')) like q_like
          )
        order by created_at desc
        limit 15
      ) t
    ), '[]'::json),
    'qa', coalesce((
      select json_agg(row_to_json(t))
      from (
        select q.id, q.question, json_build_object('name', c.name) as qa_categories
        from qa_questions q
        left join qa_categories c on c.id = q.category_id
        where q.status = 'published'
          and (
            normalize_ar(q.question) like q_like
            or normalize_ar(coalesce(q.answer, '')) like q_like
            or search_vector @@ plainto_tsquery('simple', q_norm)
          )
        order by q.created_at desc
        limit 20
      ) t
    ), '[]'::json),
    'fawaid', coalesce((
      select json_agg(row_to_json(t))
      from (
        select id, text, author_name
        from fawaid
        where status = 'approved'
          and normalize_ar(text) like q_like
        order by created_at desc
        limit 15
      ) t
    ), '[]'::json)
  );
end;
$$;

grant execute on function search_platform(text) to anon, authenticated;

-- =====================================================================
--  انتهى. بعد التشغيل استخدم supabase.rpc('search_platform', { query })
-- =====================================================================
