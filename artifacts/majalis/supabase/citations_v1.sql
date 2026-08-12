-- =====================================================================
--  نظام الاقتباسات الذكي — مجالس (citations_v1.sql)
--  آمن للتشغيل مرات متعددة (IF NOT EXISTS)
-- =====================================================================

-- ════════════════════════════════════════════════════════════════════
--  1. جدول مصادر التوثيق
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS citation_sources (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type      TEXT        NOT NULL
    CHECK (content_type IN (
      'quran_ayah','hadith','scholar_quote','fatwa','book',
      'article','research','lesson','benefit','prophet_story','qa'
    )),
  reference_id      TEXT,
  knowledge_node_id UUID        REFERENCES kn_nodes(id) ON DELETE SET NULL,
  title_ar          TEXT        NOT NULL,
  author_name       TEXT,
  book_name         TEXT,
  volume            TEXT,
  page_number       TEXT,
  publisher         TEXT,
  publish_year      INT,
  source_url        TEXT,
  is_approved       BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citation_sources_type
  ON citation_sources (content_type);
CREATE INDEX IF NOT EXISTS idx_citation_sources_ref
  ON citation_sources (reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_citation_sources_kn
  ON citation_sources (knowledge_node_id) WHERE knowledge_node_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_citation_sources_approved
  ON citation_sources (is_approved, content_type);

-- trigger: updated_at تلقائي
CREATE OR REPLACE FUNCTION update_citation_sources_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_citation_sources_updated_at ON citation_sources;
CREATE TRIGGER trg_citation_sources_updated_at
  BEFORE UPDATE ON citation_sources
  FOR EACH ROW EXECUTE FUNCTION update_citation_sources_updated_at();

-- ════════════════════════════════════════════════════════════════════
--  2. جدول الاقتباسات
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS citations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id           UUID        NOT NULL REFERENCES citation_sources(id) ON DELETE CASCADE,
  quoted_text         TEXT        NOT NULL,
  text_start_offset   INT,
  text_end_offset     INT,
  deep_link_slug      TEXT        NOT NULL UNIQUE,
  citation_style      TEXT
    CHECK (citation_style IN ('default','apa','mla','chicago','turabian')),
  created_by_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quoted_text_length CHECK (char_length(quoted_text) BETWEEN 1 AND 500)
);

CREATE INDEX IF NOT EXISTS idx_citations_slug
  ON citations (deep_link_slug);
CREATE INDEX IF NOT EXISTS idx_citations_source
  ON citations (source_id);
CREATE INDEX IF NOT EXISTS idx_citations_user
  ON citations (created_by_user_id) WHERE created_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_citations_created
  ON citations (created_at DESC);

-- ════════════════════════════════════════════════════════════════════
--  3. مجلدات تصنيف الاقتباسات
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS citation_folders (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_name TEXT        NOT NULL,
  color       TEXT        NOT NULL DEFAULT '#065f46',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citation_folders_user
  ON citation_folders (user_id, created_at DESC);

-- ════════════════════════════════════════════════════════════════════
--  4. مكتبة الاقتباسات الشخصية
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_saved_citations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  citation_id   UUID        NOT NULL REFERENCES citations(id) ON DELETE CASCADE,
  folder_id     UUID        REFERENCES citation_folders(id) ON DELETE SET NULL,
  personal_note TEXT,
  is_favorite   BOOLEAN     NOT NULL DEFAULT false,
  usage_count   INT         NOT NULL DEFAULT 0,
  saved_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, citation_id)
);

CREATE INDEX IF NOT EXISTS idx_usc_user
  ON user_saved_citations (user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_usc_folder
  ON user_saved_citations (folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usc_favorite
  ON user_saved_citations (user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_usc_usage
  ON user_saved_citations (user_id, usage_count DESC);

-- ════════════════════════════════════════════════════════════════════
--  5. RLS — Row Level Security
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE citation_sources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_folders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_citations ENABLE ROW LEVEL SECURITY;

-- citation_sources: قراءة عامة للمعتمدة، كتابة للمشرفين
DROP POLICY IF EXISTS cs_public_read    ON citation_sources;
DROP POLICY IF EXISTS cs_admin_write    ON citation_sources;

CREATE POLICY cs_public_read ON citation_sources
  FOR SELECT USING (true);

CREATE POLICY cs_admin_write ON citation_sources
  FOR ALL USING (is_admin());

-- citations: قراءة عامة، إنشاء للمسجلين، حذف للمشرفين
DROP POLICY IF EXISTS cit_public_read   ON citations;
DROP POLICY IF EXISTS cit_user_insert   ON citations;
DROP POLICY IF EXISTS cit_admin_delete  ON citations;

CREATE POLICY cit_public_read ON citations
  FOR SELECT USING (true);

CREATE POLICY cit_user_insert ON citations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY cit_admin_delete ON citations
  FOR DELETE USING (is_admin());

-- citation_folders: المستخدم يدير مجلداته فقط
DROP POLICY IF EXISTS cf_user_all ON citation_folders;

CREATE POLICY cf_user_all ON citation_folders
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_saved_citations: المستخدم يدير مكتبته فقط
DROP POLICY IF EXISTS usc_user_all ON user_saved_citations;

CREATE POLICY usc_user_all ON user_saved_citations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════
--  6. دالة توليد slug فريد
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_citation_slug()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'abcdefghijkmnpqrstuvwxyz23456789';
  slug  TEXT := '';
  i     INT;
  tries INT := 0;
BEGIN
  LOOP
    slug := '';
    FOR i IN 1..8 LOOP
      slug := slug || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM citations WHERE deep_link_slug = slug);
    tries := tries + 1;
    IF tries > 100 THEN RAISE EXCEPTION 'Could not generate unique slug'; END IF;
  END LOOP;
  RETURN slug;
END;
$$;
