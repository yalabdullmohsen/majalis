-- ═══════════════════════════════════════════════════════════════════════════
-- lessons_quality_v1.sql — نظام جودة الدروس الشامل
-- يُضيف: درجة الجودة + التصنيف + إحصاءات التفاعل + workflow المراجعة + سجل التدقيق
-- ═══════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. حقول الجودة على جدول lessons
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS quality_score      NUMERIC(5,2) DEFAULT 0   CHECK (quality_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS quality_tier       TEXT         DEFAULT 'unrated'
                                              CHECK (quality_tier IN ('unrated','bronze','silver','gold','featured')),
  ADD COLUMN IF NOT EXISTS quality_status     TEXT         DEFAULT 'draft'
                                              CHECK (quality_status IN ('draft','pending_review','approved','rejected','featured')),
  ADD COLUMN IF NOT EXISTS quality_notes      TEXT,
  ADD COLUMN IF NOT EXISTS quality_reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS quality_reviewed_at TIMESTAMPTZ,

  -- إحصاءات التفاعل
  ADD COLUMN IF NOT EXISTS views_count        INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bookmarks_count    INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completions_count  INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_count       INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_rating         NUMERIC(3,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ratings_count      INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rate    NUMERIC(5,2) DEFAULT NULL
                                              CHECK (completion_rate IS NULL OR completion_rate BETWEEN 0 AND 100);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_lessons_quality_score  ON lessons (quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_quality_tier   ON lessons (quality_tier);
CREATE INDEX IF NOT EXISTS idx_lessons_quality_status ON lessons (quality_status);
CREATE INDEX IF NOT EXISTS idx_lessons_views          ON lessons (views_count DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. جدول إحصاءات التفاعل اليومية
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lesson_engagement_stats (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    UUID        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  stat_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  views        INTEGER     NOT NULL DEFAULT 0,
  bookmarks    INTEGER     NOT NULL DEFAULT 0,
  completions  INTEGER     NOT NULL DEFAULT 0,
  shares       INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_les_engagement_lesson ON lesson_engagement_stats (lesson_id, stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_les_engagement_date   ON lesson_engagement_stats (stat_date DESC);

ALTER TABLE lesson_engagement_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS les_engagement_admin ON lesson_engagement_stats;
CREATE POLICY les_engagement_admin ON lesson_engagement_stats
  FOR ALL USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 3. جدول تقييمات الدروس
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lesson_ratings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id  UUID        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_les_ratings_lesson ON lesson_ratings (lesson_id);
CREATE INDEX IF NOT EXISTS idx_les_ratings_user   ON lesson_ratings (user_id);

ALTER TABLE lesson_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS les_ratings_select ON lesson_ratings;
CREATE POLICY les_ratings_select ON lesson_ratings FOR SELECT USING (true);
DROP POLICY IF EXISTS les_ratings_insert ON lesson_ratings;
CREATE POLICY les_ratings_insert ON lesson_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS les_ratings_update ON lesson_ratings;
CREATE POLICY les_ratings_update ON lesson_ratings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS les_ratings_delete ON lesson_ratings;
CREATE POLICY les_ratings_delete ON lesson_ratings FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 4. جدول سجل تدقيق الجودة
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lesson_quality_audit (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     UUID        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  action        TEXT        NOT NULL,   -- score_updated / tier_changed / status_changed / reviewed
  old_value     JSONB,
  new_value     JSONB,
  performed_by  TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_les_audit_lesson ON lesson_quality_audit (lesson_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_les_audit_action ON lesson_quality_audit (action, created_at DESC);

ALTER TABLE lesson_quality_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS les_audit_admin ON lesson_quality_audit;
CREATE POLICY les_audit_admin ON lesson_quality_audit
  FOR ALL USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 5. دالة حساب درجة الجودة تلقائياً
-- ────────────────────────────────────────────────────────────────────────────
-- المعايير (مجموع 100):
--   وجود عنوان وصفي         → 15
--   وجود وصف (description)  → 20
--   وجود شيخ مرتبط          → 15
--   وجود تصنيف               → 10
--   وجود رابط بث/كتاب       → 10
--   وجود كلمات مفتاحية      → 10
--   متوسط التقييم (×4)      → حتى 20
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION calculate_lesson_quality_score(p_lesson_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_title       TEXT;
  v_description TEXT;
  v_sheikh_id   UUID;
  v_category    TEXT;
  v_live_url    TEXT;
  v_book_url    TEXT;
  v_score       NUMERIC := 0;
  v_avg         NUMERIC;
BEGIN
  SELECT
    title, description, sheikh_id, category, live_url, book_url
  INTO
    v_title, v_description, v_sheikh_id, v_category, v_live_url, v_book_url
  FROM lessons WHERE id = p_lesson_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  -- عنوان
  IF length(trim(coalesce(v_title, ''))) >= 10 THEN v_score := v_score + 15; END IF;

  -- وصف
  IF length(trim(coalesce(v_description, ''))) >= 30 THEN v_score := v_score + 20;
  ELSIF length(trim(coalesce(v_description, ''))) > 0  THEN v_score := v_score + 10;
  END IF;

  -- شيخ
  IF v_sheikh_id IS NOT NULL THEN v_score := v_score + 15; END IF;

  -- تصنيف
  IF coalesce(v_category, '') <> '' THEN v_score := v_score + 10; END IF;

  -- رابط
  IF coalesce(v_live_url, '') <> '' OR coalesce(v_book_url, '') <> '' THEN
    v_score := v_score + 10;
  END IF;

  -- نقاط ثابتة للاكتمال (بديل keywords)
  v_score := v_score + 10;

  -- متوسط التقييم
  SELECT avg(rating) INTO v_avg FROM lesson_ratings WHERE lesson_id = p_lesson_id;
  IF v_avg IS NOT NULL THEN
    v_score := v_score + LEAST(20, round(v_avg * 4));
  END IF;

  RETURN LEAST(100, round(v_score, 2));
END;
$$ LANGUAGE plpgsql STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. دالة تحديث الدرجة والتصنيف وإضافة سجل تدقيق
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION refresh_lesson_quality(p_lesson_id UUID, p_actor TEXT DEFAULT 'system')
RETURNS JSONB AS $$
DECLARE
  v_new_score  NUMERIC;
  v_new_tier   TEXT;
  v_old_score  NUMERIC;
  v_old_tier   TEXT;
BEGIN
  SELECT quality_score, quality_tier INTO v_old_score, v_old_tier
  FROM lessons WHERE id = p_lesson_id;

  v_new_score := calculate_lesson_quality_score(p_lesson_id);

  v_new_tier := CASE
    WHEN v_new_score >= 90 THEN 'featured'
    WHEN v_new_score >= 75 THEN 'gold'
    WHEN v_new_score >= 55 THEN 'silver'
    WHEN v_new_score >= 30 THEN 'bronze'
    ELSE 'unrated'
  END;

  UPDATE lessons
  SET quality_score = v_new_score,
      quality_tier  = v_new_tier,
      updated_at    = now()
  WHERE id = p_lesson_id;

  -- سجّل التغيير فقط إذا تغيّر شيء
  IF v_new_score <> coalesce(v_old_score, -1) OR v_new_tier <> coalesce(v_old_tier, '') THEN
    INSERT INTO lesson_quality_audit (lesson_id, action, old_value, new_value, performed_by)
    VALUES (
      p_lesson_id,
      'score_updated',
      jsonb_build_object('score', v_old_score, 'tier', v_old_tier),
      jsonb_build_object('score', v_new_score, 'tier', v_new_tier),
      p_actor
    );
  END IF;

  RETURN jsonb_build_object('score', v_new_score, 'tier', v_new_tier);
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────────────
-- 7. دالة تسجيل مشاهدة
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION record_lesson_view(p_lesson_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE lessons SET views_count = views_count + 1 WHERE id = p_lesson_id;

  INSERT INTO lesson_engagement_stats (lesson_id, stat_date, views)
  VALUES (p_lesson_id, CURRENT_DATE, 1)
  ON CONFLICT (lesson_id, stat_date)
  DO UPDATE SET views = lesson_engagement_stats.views + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────────────────
-- 8. تريجر تحديث متوسط التقييم بعد كل تقييم
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_lesson_avg_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg   NUMERIC;
  v_count INTEGER;
BEGIN
  SELECT avg(rating), count(*) INTO v_avg, v_count
  FROM lesson_ratings
  WHERE lesson_id = COALESCE(NEW.lesson_id, OLD.lesson_id);

  UPDATE lessons
  SET avg_rating    = round(v_avg, 2),
      ratings_count = v_count,
      updated_at    = now()
  WHERE id = COALESCE(NEW.lesson_id, OLD.lesson_id);

  -- أعد حساب درجة الجودة
  PERFORM refresh_lesson_quality(COALESCE(NEW.lesson_id, OLD.lesson_id));

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lesson_rating_sync ON lesson_ratings;
CREATE TRIGGER trg_lesson_rating_sync
  AFTER INSERT OR UPDATE OR DELETE ON lesson_ratings
  FOR EACH ROW EXECUTE FUNCTION sync_lesson_avg_rating();

-- updated_at على lesson_ratings
CREATE OR REPLACE FUNCTION update_lesson_rating_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lesson_rating_updated_at ON lesson_ratings;
CREATE TRIGGER trg_lesson_rating_updated_at
  BEFORE UPDATE ON lesson_ratings
  FOR EACH ROW EXECUTE FUNCTION update_lesson_rating_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- 9. دالة مراجعة الجودة (تغيير quality_status مع سجل تدقيق)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION review_lesson_quality(
  p_lesson_id  UUID,
  p_new_status TEXT,
  p_actor      TEXT DEFAULT 'admin',
  p_notes      TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_old_status TEXT;
BEGIN
  SELECT quality_status INTO v_old_status FROM lessons WHERE id = p_lesson_id;

  UPDATE lessons
  SET quality_status       = p_new_status,
      quality_notes        = p_notes,
      quality_reviewed_by  = p_actor,
      quality_reviewed_at  = now(),
      updated_at           = now()
  WHERE id = p_lesson_id;

  INSERT INTO lesson_quality_audit (lesson_id, action, old_value, new_value, performed_by, notes)
  VALUES (
    p_lesson_id,
    'status_changed',
    jsonb_build_object('quality_status', v_old_status),
    jsonb_build_object('quality_status', p_new_status),
    p_actor,
    p_notes
  );

  -- إذا أصبح الدرس مميزاً، حدّث التصنيف إلى featured
  IF p_new_status = 'featured' THEN
    UPDATE lessons SET quality_tier = 'featured', updated_at = now() WHERE id = p_lesson_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────────────
-- 10. view: ملخص جودة الدروس للأدمن
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW vw_lessons_quality_summary AS
SELECT
  l.id,
  l.title,
  l.speaker_name,
  l.category,
  l.status,
  l.quality_score,
  l.quality_tier,
  l.quality_status,
  l.views_count,
  l.bookmarks_count,
  l.completions_count,
  l.avg_rating,
  l.ratings_count,
  l.completion_rate,
  l.quality_reviewed_by,
  l.quality_reviewed_at,
  l.created_at,
  l.updated_at
FROM lessons l
ORDER BY l.quality_score DESC NULLS LAST;

-- ────────────────────────────────────────────────────────────────────────────
-- 11. حساب درجات الجودة الأولية لجميع الدروس الموجودة
-- ────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_id IN SELECT id FROM lessons LOOP
    PERFORM refresh_lesson_quality(v_id, 'migration_v1');
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'تم حساب درجات الجودة لـ % درس', v_count;
END $$;
