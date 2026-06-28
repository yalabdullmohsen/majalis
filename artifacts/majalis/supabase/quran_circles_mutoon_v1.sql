-- =====================================================================
--  المجلس العلمي — Quran Circles + Mutoon + Contact v1
--  حلقات القرآن | المتون | رسائل التواصل | تتبع التقدم | جودة المحتوى
--  شغّل بعد platform_expansion_v3.sql و search_fts.sql
--  Idempotent — safe to re-run
-- =====================================================================

-- ── 1. quran_circles ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quran_circles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key      TEXT UNIQUE,
  slug              TEXT UNIQUE,
  title             TEXT NOT NULL,
  summary           TEXT,
  body              TEXT,
  circle_type       TEXT NOT NULL DEFAULT 'حلقة'
    CHECK (circle_type IN ('حلقة', 'ختمة', 'تجويد', 'حفظ', 'تفسير', 'برنامج')),
  sheikh_name       TEXT,
  mosque            TEXT,
  city              TEXT NOT NULL DEFAULT 'العاصمة',
  region            TEXT,
  country           TEXT NOT NULL DEFAULT 'الكويت',
  schedule          JSONB NOT NULL DEFAULT '[]',
  day_of_week       TEXT,
  circle_time       TEXT,
  start_date        DATE,
  end_date          DATE,
  capacity          INT,
  registration_open BOOLEAN NOT NULL DEFAULT true,
  registration_url  TEXT,
  maps_url          TEXT,
  live_url          TEXT,
  poster_image_url  TEXT,
  keywords          TEXT[] DEFAULT '{}',
  status            platform_content_status NOT NULL DEFAULT 'approved',
  view_count        INT NOT NULL DEFAULT 0,
  search_count      INT NOT NULL DEFAULT 0,
  archived_at       TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  quality_score     NUMERIC(5,2),
  quality_stages    JSONB NOT NULL DEFAULT '[]',
  source_url        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quran_circles_status_idx ON quran_circles (status);
CREATE INDEX IF NOT EXISTS quran_circles_city_idx ON quran_circles (city);
CREATE INDEX IF NOT EXISTS quran_circles_type_idx ON quran_circles (circle_type);
CREATE INDEX IF NOT EXISTS quran_circles_slug_idx ON quran_circles (slug) WHERE slug IS NOT NULL;

-- ── 2. mutoon_texts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mutoon_texts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key      TEXT UNIQUE,
  slug              TEXT UNIQUE,
  title             TEXT NOT NULL,
  author            TEXT,
  summary           TEXT,
  body              TEXT,
  category          TEXT NOT NULL DEFAULT 'متن'
    CHECK (category IN ('متن', 'نظم', 'مختصر', 'شرح', 'منظومة')),
  level             TEXT DEFAULT 'متوسط'
    CHECK (level IN ('مبتدئ', 'متوسط', 'متقدم')),
  total_pages       INT DEFAULT 0,
  total_lessons     INT DEFAULT 0,
  sheikh_names      TEXT[] DEFAULT '{}',
  keywords          TEXT[] DEFAULT '{}',
  cover_image_url   TEXT,
  source_url        TEXT,
  status            platform_content_status NOT NULL DEFAULT 'approved',
  view_count        INT NOT NULL DEFAULT 0,
  search_count      INT NOT NULL DEFAULT 0,
  archived_at       TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  quality_score     NUMERIC(5,2),
  quality_stages    JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mutoon_texts_status_idx ON mutoon_texts (status);
CREATE INDEX IF NOT EXISTS mutoon_texts_category_idx ON mutoon_texts (category);
CREATE INDEX IF NOT EXISTS mutoon_texts_slug_idx ON mutoon_texts (slug) WHERE slug IS NOT NULL;

-- ── 3. mutoon_lessons ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mutoon_lessons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mutoon_id         UUID NOT NULL REFERENCES mutoon_texts(id) ON DELETE CASCADE,
  sort_order        INT NOT NULL DEFAULT 0,
  title             TEXT NOT NULL,
  summary           TEXT,
  body              TEXT,
  page_start        INT,
  page_end          INT,
  audio_url         TEXT,
  video_url         TEXT,
  explanation_url   TEXT,
  status            platform_content_status NOT NULL DEFAULT 'approved',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mutoon_lessons_mutoon_idx ON mutoon_lessons (mutoon_id, sort_order);

-- ── 4. contact_messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  subject           TEXT NOT NULL DEFAULT 'استفسار عام',
  message           TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'content_error', 'suggestion', 'technical', 'account', 'other')),
  status            TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'read', 'in_progress', 'resolved', 'archived')),
  admin_notes       TEXT,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON contact_messages (status, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_category_idx ON contact_messages (category);

-- ── 5. user progress — mutoon ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_mutoon_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mutoon_id         UUID NOT NULL REFERENCES mutoon_texts(id) ON DELETE CASCADE,
  progress_pct      NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_lesson_id    UUID REFERENCES mutoon_lessons(id) ON DELETE SET NULL,
  last_page         INT,
  last_explanation  TEXT,
  quiz_scores       JSONB NOT NULL DEFAULT '[]',
  notes             TEXT,
  started_at        TIMESTAMPTZ DEFAULT now(),
  last_seen_at      TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  UNIQUE(user_id, mutoon_id)
);

CREATE INDEX IF NOT EXISTS user_mutoon_progress_user_idx ON user_mutoon_progress (user_id);

CREATE TABLE IF NOT EXISTS user_mutoon_bookmarks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mutoon_id         UUID NOT NULL REFERENCES mutoon_texts(id) ON DELETE CASCADE,
  lesson_id         UUID REFERENCES mutoon_lessons(id) ON DELETE SET NULL,
  page_number       INT,
  label             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mutoon_id, lesson_id, page_number)
);

-- ── 6. user progress — quran circles ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_quran_circle_enrollments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  circle_id         UUID NOT NULL REFERENCES quran_circles(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'active', 'completed', 'withdrawn', 'waitlist')),
  rating            INT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  rating_comment    TEXT,
  enrolled_at       TIMESTAMPTZ DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  UNIQUE(user_id, circle_id)
);

CREATE INDEX IF NOT EXISTS user_quran_circle_enrollments_user_idx ON user_quran_circle_enrollments (user_id);

CREATE TABLE IF NOT EXISTS user_quran_circle_attendance (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id     UUID NOT NULL REFERENCES user_quran_circle_enrollments(id) ON DELETE CASCADE,
  session_date      DATE NOT NULL,
  attended          BOOLEAN NOT NULL DEFAULT false,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(enrollment_id, session_date)
);

-- ── 7. search history (Supabase-backed) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS user_search_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id        TEXT,
  query             TEXT NOT NULL,
  result_count      INT DEFAULT 0,
  filters           JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_search_history_user_idx ON user_search_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_search_history_session_idx ON user_search_history (session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS search_analytics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query             TEXT NOT NULL,
  hit_count         INT NOT NULL DEFAULT 1,
  last_searched_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(query)
);

-- ── 8. content quality pipeline ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_content_quality (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_kind      TEXT NOT NULL,
  content_id        UUID NOT NULL,
  external_key      TEXT,
  stage             TEXT NOT NULL DEFAULT 'ocr'
    CHECK (stage IN ('ocr', 'vision', 'normalization', 'duplicate', 'verification', 'confidence', 'publishing', 'monitoring', 'published', 'rejected')),
  stage_status      TEXT NOT NULL DEFAULT 'pending'
    CHECK (stage_status IN ('pending', 'running', 'passed', 'failed', 'skipped')),
  confidence_score  NUMERIC(5,2),
  stages_log        JSONB NOT NULL DEFAULT '[]',
  blocked_reason    TEXT,
  source_url        TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  published_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS platform_content_quality_kind_idx ON platform_content_quality (content_kind, stage);
CREATE INDEX IF NOT EXISTS platform_content_quality_content_idx ON platform_content_quality (content_kind, content_id);

-- ── 9. search vectors ───────────────────────────────────────────────────
ALTER TABLE quran_circles ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE mutoon_texts ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION quran_circles_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(NEW.title)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.sheikh_name, ''))), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.mosque, ''))), 'C') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(NEW.keywords, ' '), ''))), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quran_circles_search_vector ON quran_circles;
CREATE TRIGGER trg_quran_circles_search_vector
  BEFORE INSERT OR UPDATE ON quran_circles
  FOR EACH ROW EXECUTE FUNCTION quran_circles_search_vector_update();

CREATE OR REPLACE FUNCTION mutoon_texts_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(NEW.title)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.author, ''))), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.body, ''))), 'C') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(NEW.keywords, ' '), ''))), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mutoon_texts_search_vector ON mutoon_texts;
CREATE TRIGGER trg_mutoon_texts_search_vector
  BEFORE INSERT OR UPDATE ON mutoon_texts
  FOR EACH ROW EXECUTE FUNCTION mutoon_texts_search_vector_update();

CREATE INDEX IF NOT EXISTS quran_circles_search_vector_idx ON quran_circles USING gin (search_vector);
CREATE INDEX IF NOT EXISTS mutoon_texts_search_vector_idx ON mutoon_texts USING gin (search_vector);

-- ── 10. RLS policies ──────────────────────────────────────────────────────
ALTER TABLE quran_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutoon_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutoon_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mutoon_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mutoon_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quran_circle_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quran_circle_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_content_quality ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quran_circles_public_read ON quran_circles;
CREATE POLICY quran_circles_public_read ON quran_circles
  FOR SELECT USING (status = 'approved' AND archived_at IS NULL);

DROP POLICY IF EXISTS mutoon_texts_public_read ON mutoon_texts;
CREATE POLICY mutoon_texts_public_read ON mutoon_texts
  FOR SELECT USING (status = 'approved' AND archived_at IS NULL);

DROP POLICY IF EXISTS mutoon_lessons_public_read ON mutoon_lessons;
CREATE POLICY mutoon_lessons_public_read ON mutoon_lessons
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS quran_circles_admin_all ON quran_circles;
CREATE POLICY quran_circles_admin_all ON quran_circles
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS mutoon_texts_admin_all ON mutoon_texts;
CREATE POLICY mutoon_texts_admin_all ON mutoon_texts
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS mutoon_lessons_admin_all ON mutoon_lessons;
CREATE POLICY mutoon_lessons_admin_all ON mutoon_lessons
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS contact_messages_insert ON contact_messages;
CREATE POLICY contact_messages_insert ON contact_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS contact_messages_admin_all ON contact_messages;
CREATE POLICY contact_messages_admin_all ON contact_messages
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS user_mutoon_progress_own ON user_mutoon_progress;
CREATE POLICY user_mutoon_progress_own ON user_mutoon_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_mutoon_bookmarks_own ON user_mutoon_bookmarks;
CREATE POLICY user_mutoon_bookmarks_own ON user_mutoon_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_quran_circle_enrollments_own ON user_quran_circle_enrollments;
CREATE POLICY user_quran_circle_enrollments_own ON user_quran_circle_enrollments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_quran_circle_attendance_own ON user_quran_circle_attendance;
CREATE POLICY user_quran_circle_attendance_own ON user_quran_circle_attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_quran_circle_enrollments e
      WHERE e.id = enrollment_id AND e.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_quran_circle_enrollments e
      WHERE e.id = enrollment_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS user_search_history_own ON user_search_history;
CREATE POLICY user_search_history_own ON user_search_history
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS search_analytics_public_read ON search_analytics;
CREATE POLICY search_analytics_public_read ON search_analytics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS search_analytics_admin_write ON search_analytics;
CREATE POLICY search_analytics_admin_write ON search_analytics
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS platform_content_quality_admin ON platform_content_quality;
CREATE POLICY platform_content_quality_admin ON platform_content_quality
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ── 11. Extend search_platform RPC ────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_platform(query text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  q_norm text := normalize_ar(trim(coalesce(query, '')));
  q_like text := '%' || q_norm || '%';
BEGIN
  IF length(q_norm) < 1 THEN
    RETURN json_build_object(
      'lessons', '[]'::json,
      'sheikhs', '[]'::json,
      'library', '[]'::json,
      'miracles', '[]'::json,
      'qa', '[]'::json,
      'fawaid', '[]'::json,
      'fiqh_decisions', '[]'::json,
      'fatwas', '[]'::json,
      'rulings', '[]'::json,
      'courses', '[]'::json,
      'updates', '[]'::json,
      'quran_circles', '[]'::json,
      'mutoon', '[]'::json
    );
  END IF;

  RETURN json_build_object(
    'lessons', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, category, speaker_name
        FROM lessons
        WHERE status = 'approved'
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(description, '')) LIKE q_like
            OR normalize_ar(coalesce(speaker_name, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY created_at DESC
        LIMIT 30
      ) t
    ), '[]'::json),
    'sheikhs', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, name FROM sheikhs
        WHERE normalize_ar(name) LIKE q_like OR search_vector @@ plainto_tsquery('simple', q_norm)
        ORDER BY name LIMIT 20
      ) t
    ), '[]'::json),
    'library', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, type FROM library_items
        WHERE status = 'approved'
          AND (normalize_ar(title) LIKE q_like OR search_vector @@ plainto_tsquery('simple', q_norm))
        ORDER BY created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'miracles', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, category FROM scientific_miracles
        WHERE status = 'approved'
          AND (normalize_ar(title) LIKE q_like OR normalize_ar(coalesce(body, '')) LIKE q_like)
        ORDER BY created_at DESC LIMIT 15
      ) t
    ), '[]'::json),
    'qa', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT q.id, q.question, json_build_object('name', c.name) AS qa_categories
        FROM qa_questions q
        LEFT JOIN qa_categories c ON c.id = q.category_id
        WHERE q.status = 'published'
          AND (normalize_ar(q.question) LIKE q_like OR search_vector @@ plainto_tsquery('simple', q_norm))
        ORDER BY q.created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'fawaid', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, text, author_name FROM fawaid
        WHERE status = 'approved' AND normalize_ar(text) LIKE q_like
        ORDER BY created_at DESC LIMIT 15
      ) t
    ), '[]'::json),
    'fiqh_decisions', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, category, decision_type, summary
        FROM fiqh_council_decisions
        WHERE status = 'approved' AND archived_at IS NULL
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(summary, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY decision_date DESC NULLS LAST, created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'fatwas', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, question, category, format, mufti_name
        FROM fatwas
        WHERE status = 'approved' AND archived_at IS NULL
          AND (
            normalize_ar(question) LIKE q_like
            OR normalize_ar(coalesce(answer, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'rulings', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, category, summary
        FROM sharia_rulings
        WHERE status = 'approved' AND archived_at IS NULL
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(body, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'courses', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, course_type, season, year, venue_city
        FROM annual_courses
        WHERE status = 'approved' AND archived_at IS NULL
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(summary, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY year DESC NULLS LAST, created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'updates', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, update_type, summary, published_at
        FROM platform_updates
        WHERE status = 'approved'
          AND normalize_ar(title) LIKE q_like
        ORDER BY published_at DESC LIMIT 15
      ) t
    ), '[]'::json),
    'quran_circles', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, circle_type, sheikh_name, city, mosque
        FROM quran_circles
        WHERE status = 'approved' AND archived_at IS NULL
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(summary, '')) LIKE q_like
            OR normalize_ar(coalesce(sheikh_name, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'mutoon', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, author, category, level
        FROM mutoon_texts
        WHERE status = 'approved' AND archived_at IS NULL
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(author, '')) LIKE q_like
            OR normalize_ar(coalesce(summary, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY created_at DESC LIMIT 20
      ) t
    ), '[]'::json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION search_platform(text) TO anon, authenticated;

-- ── 12. Seed sample data (idempotent via external_key) ────────────────────
INSERT INTO quran_circles (external_key, slug, title, summary, circle_type, sheikh_name, mosque, city, day_of_week, circle_time, registration_open, status)
VALUES
  ('seed:quran-circle-tajweed', 'tajweed-evening', 'حلقة تجويد مسائية', 'حلقة أسبوعية لتعليم أحكام التجويد وتحسين التلاوة.', 'تجويد', 'الشيخ أحمد العجمي', 'مسجد الصباح', 'العاصمة', 'الثلاثاء', '8:00 م', true, 'approved'),
  ('seed:quran-circle-hifz', 'hifz-morning', 'حلقة حفظ القرآن', 'برنامج حفظ يومي مع مراجعة وتثبيت.', 'حفظ', 'الشيخ محمد المنصور', 'مسجد فهد السالم', 'حولي', 'الأحد', '6:00 ص', true, 'approved')
ON CONFLICT (external_key) DO NOTHING;

INSERT INTO mutoon_texts (external_key, slug, title, author, summary, category, level, total_pages, total_lessons, status)
VALUES
  ('seed:mutoon-alfiyyah', 'alfiyyah-ibn-malik', 'ألفية ابن مالك', 'ابن مالك', 'منظومة في النحو — أشهر متون اللغة العربية.', 'منظومة', 'متوسط', 1000, 50, 'approved'),
  ('seed:mutoon-tuhfatul-atfal', 'tuhfatul-atfal', 'تحفة الأطفال', 'سليمان الجمل', 'متن مختصر في التجويد.', 'متن', 'مبتدئ', 40, 12, 'approved'),
  ('seed:mutoon-arbaeen-nawawi', 'arbaeen-nawawi', 'الأربعون النووية', 'النووي', 'أربعون حديثاً من أصول الدين.', 'متن', 'مبتدئ', 80, 40, 'approved')
ON CONFLICT (external_key) DO NOTHING;

-- =====================================================================
--  انتهى quran_circles_mutoon_v1.sql
-- =====================================================================
