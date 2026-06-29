-- الأبحاث العلمية — National Arabic Research Repository v1

CREATE TABLE IF NOT EXISTS public.research_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text,
  icon text DEFAULT '📚',
  parent_slug text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.research_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text,
  bio text,
  avatar_url text,
  university text,
  specialization text,
  degree text,
  country text,
  social_links jsonb DEFAULT '{}'::jsonb,
  papers_count int NOT NULL DEFAULT 0,
  views_count int NOT NULL DEFAULT 0,
  downloads_count int NOT NULL DEFAULT 0,
  user_id uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_authors_slug ON public.research_authors(slug);
CREATE INDEX IF NOT EXISTS idx_research_authors_name ON public.research_authors(full_name);

CREATE TABLE IF NOT EXISTS public.research_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_en text,
  abstract_short text,
  abstract_full text,
  degree_type text NOT NULL CHECK (degree_type IN (
    'phd', 'masters', 'bachelors', 'graduation', 'peer_reviewed',
    'scientific_paper', 'working_paper', 'sharia_research', 'academic'
  )),
  category_slug text REFERENCES public.research_categories(slug) ON DELETE SET NULL,
  specialization text,
  author_id uuid REFERENCES public.research_authors(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_email text,
  supervisor_name text,
  university text,
  faculty text,
  department text,
  country text DEFAULT 'الكويت',
  defense_date date,
  publication_year int,
  page_count int,
  language text NOT NULL DEFAULT 'ar' CHECK (language IN ('ar', 'en', 'fr', 'other')),
  keywords text[] DEFAULT '{}',
  cover_url text,
  pdf_url text,
  file_type text DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'docx', 'zip', 'other')),
  file_size_bytes bigint,
  content_hash text,
  copyright_type text NOT NULL DEFAULT 'all_rights_reserved' CHECK (copyright_type IN (
    'all_rights_reserved', 'download_only', 'read_only', 'cite_with_attribution',
    'creative_commons', 'custom'
  )),
  copyright_terms text,
  license_url text,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN (
    'draft', 'pending_review', 'revision_requested', 'published', 'hidden', 'archived', 'rejected'
  )),
  review_notes text,
  ai_summary_short text,
  ai_summary_medium text,
  ai_keywords text[] DEFAULT '{}',
  ai_category text,
  ai_topics text[] DEFAULT '{}',
  views_count int NOT NULL DEFAULT 0,
  downloads_count int NOT NULL DEFAULT 0,
  shares_count int NOT NULL DEFAULT 0,
  saves_count int NOT NULL DEFAULT 0,
  rating_avg numeric(3,2) DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  qr_code_url text,
  canonical_url text,
  seo_title text,
  seo_description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  submitted_by uuid,
  reviewed_by uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_papers_slug ON public.research_papers(slug);
CREATE INDEX IF NOT EXISTS idx_research_papers_status ON public.research_papers(status);
CREATE INDEX IF NOT EXISTS idx_research_papers_degree ON public.research_papers(degree_type);
CREATE INDEX IF NOT EXISTS idx_research_papers_category ON public.research_papers(category_slug);
CREATE INDEX IF NOT EXISTS idx_research_papers_year ON public.research_papers(publication_year DESC);
CREATE INDEX IF NOT EXISTS idx_research_papers_views ON public.research_papers(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_research_papers_downloads ON public.research_papers(downloads_count DESC);
CREATE INDEX IF NOT EXISTS idx_research_papers_rating ON public.research_papers(rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_research_papers_saves ON public.research_papers(saves_count DESC);
CREATE INDEX IF NOT EXISTS idx_research_papers_published ON public.research_papers(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_research_papers_keywords_gin ON public.research_papers USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_research_papers_content_hash ON public.research_papers(content_hash) WHERE content_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_papers_content_hash_uidx ON public.research_papers(content_hash) WHERE content_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.research_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.research_papers(id) ON DELETE CASCADE,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'cover', 'attachment', 'docx', 'zip')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_files_paper ON public.research_files(paper_id);

CREATE TABLE IF NOT EXISTS public.research_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  paper_id uuid NOT NULL REFERENCES public.research_papers(id) ON DELETE CASCADE,
  UNIQUE (keyword, paper_id)
);

CREATE INDEX IF NOT EXISTS idx_research_keywords_kw ON public.research_keywords(keyword);

CREATE TABLE IF NOT EXISTS public.research_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.research_papers(id) ON DELETE CASCADE,
  user_id uuid,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_views_paper ON public.research_views(paper_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.research_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.research_papers(id) ON DELETE CASCADE,
  user_id uuid,
  ip_hash text,
  file_id uuid REFERENCES public.research_files(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_downloads_paper ON public.research_downloads(paper_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.research_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  paper_id uuid NOT NULL REFERENCES public.research_papers(id) ON DELETE CASCADE,
  list_name text DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, paper_id, list_name)
);

CREATE INDEX IF NOT EXISTS idx_research_favorites_user ON public.research_favorites(user_id);

CREATE TABLE IF NOT EXISTS public.research_author_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  author_id uuid NOT NULL REFERENCES public.research_authors(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, author_id)
);

CREATE TABLE IF NOT EXISTS public.research_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.research_papers(id) ON DELETE CASCADE,
  user_id uuid,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.research_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.research_papers(id) ON DELETE CASCADE,
  reviewer_id uuid,
  action text NOT NULL CHECK (action IN ('approve', 'reject', 'request_revision', 'hide', 'archive', 'edit')),
  notes text,
  previous_status text,
  new_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_reviews_paper ON public.research_reviews(paper_id, created_at DESC);

-- Seed categories
INSERT INTO public.research_categories (slug, name_ar, icon, sort_order) VALUES
  ('latest', 'أحدث الرسائل', '📘', 1),
  ('phd', 'رسائل الدكتوراه', '🎓', 2),
  ('masters', 'رسائل الماجستير', '📚', 3),
  ('bachelors', 'أبحاث البكالوريوس', '📝', 4),
  ('sharia', 'البحوث الشرعية', '⚖️', 5),
  ('quran-sciences', 'علوم القرآن', '📖', 6),
  ('hadith', 'الحديث', '📜', 7),
  ('fiqh', 'الفقه', '⚙️', 8),
  ('aqeedah', 'العقيدة', '🕌', 9),
  ('usul-fiqh', 'أصول الفقه', '🧠', 10),
  ('dawah', 'الدعوة', '🌍', 11),
  ('islamic-economics', 'الاقتصاد الإسلامي', '📈', 12),
  ('islamic-history', 'التاريخ الإسلامي', '🏛', 13),
  ('arabic-language', 'اللغة العربية', '🎙', 14),
  ('peer-reviewed', 'الأبحاث المحكمة', '🔬', 15),
  ('scientific-papers', 'الأوراق العلمية', '📄', 16)
ON CONFLICT (slug) DO UPDATE SET name_ar = EXCLUDED.name_ar, icon = EXCLUDED.icon;

-- RLS
ALTER TABLE public.research_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_author_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "research_categories_read" ON public.research_categories;
CREATE POLICY "research_categories_read" ON public.research_categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "research_authors_read" ON public.research_authors;
CREATE POLICY "research_authors_read" ON public.research_authors FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "research_papers_public_read" ON public.research_papers;
CREATE POLICY "research_papers_public_read" ON public.research_papers
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "research_papers_service" ON public.research_papers;
CREATE POLICY "research_papers_service" ON public.research_papers
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "research_files_read" ON public.research_files;
CREATE POLICY "research_files_read" ON public.research_files FOR SELECT USING (true);

DROP POLICY IF EXISTS "research_files_service" ON public.research_files;
CREATE POLICY "research_files_service" ON public.research_files FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "research_views_insert" ON public.research_views;
CREATE POLICY "research_views_insert" ON public.research_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "research_downloads_insert" ON public.research_downloads;
CREATE POLICY "research_downloads_insert" ON public.research_downloads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "research_favorites_owner" ON public.research_favorites;
CREATE POLICY "research_favorites_owner" ON public.research_favorites
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "research_reports_insert" ON public.research_reports;
CREATE POLICY "research_reports_insert" ON public.research_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "research_service_all" ON public.research_authors;
CREATE POLICY "research_service_all" ON public.research_authors FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "research_reviews_service" ON public.research_reviews;
CREATE POLICY "research_reviews_service" ON public.research_reviews FOR ALL USING (auth.role() = 'service_role');

GRANT SELECT ON public.research_categories, public.research_authors, public.research_papers, public.research_files TO anon, authenticated;
GRANT INSERT ON public.research_views, public.research_downloads, public.research_reports TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

NOTIFY pgrst, 'reload schema';
