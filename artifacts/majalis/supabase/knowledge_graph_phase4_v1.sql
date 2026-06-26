-- Knowledge Graph Phase 4 v1
-- Canonical graph nodes/edges, citation records, and audited reasoning pipeline steps.

CREATE TABLE IF NOT EXISTS kg_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_id text UNIQUE NOT NULL,
  node_kind text NOT NULL CHECK (node_kind IN (
    'quran','surah','ayah','tafsir','hadith','hadith_grade','narrator','scholar',
    'fiqh_issue','ijma','khilaf','fatwa','source','book','chapter','page',
    'edition','verification','topic','person','place','time','lesson','course'
  )),
  title text NOT NULL,
  stable_id text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  trust_level smallint NOT NULL DEFAULT 90 CHECK (trust_level BETWEEN 0 AND 100),
  verification_status text NOT NULL DEFAULT 'needs_review'
    CHECK (verification_status IN ('verified','needs_review','rejected','archived')),
  last_reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version_number int NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kg_nodes_kind ON kg_nodes(node_kind);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_status ON kg_nodes(verification_status);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_keywords ON kg_nodes USING gin(keywords);

CREATE TABLE IF NOT EXISTS kg_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_ref_id text NOT NULL REFERENCES kg_nodes(ref_id) ON DELETE CASCADE,
  to_ref_id text NOT NULL REFERENCES kg_nodes(ref_id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (relation_type IN (
    'contains','explains','cites','grades','narrated_by','authored_by','discusses',
    'evidence_for','has_ijma','has_khilaf','has_fatwa','from_source','in_book',
    'in_chapter','on_page','in_edition','verified_by','same_topic','related',
    'supports','conflicts_with','mentions','teaches','maps_to'
  )),
  confidence_score smallint NOT NULL DEFAULT 75 CHECK (confidence_score BETWEEN 0 AND 100),
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  citation_id uuid,
  auto_generated boolean NOT NULL DEFAULT true,
  audit_status text NOT NULL DEFAULT 'pending' CHECK (audit_status IN ('pending','approved','rejected')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_ref_id, to_ref_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_kg_edges_from ON kg_edges(from_ref_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_to ON kg_edges(to_ref_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_type ON kg_edges(relation_type);

CREATE TABLE IF NOT EXISTS kg_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citation_key text UNIQUE NOT NULL,
  title text NOT NULL,
  content_ref_id text,
  source_ref_id text,
  book_title text NOT NULL,
  author_name text,
  edition text,
  volume text,
  page text,
  chapter text,
  hadith_number text,
  ayah_ref text,
  hadith_grade text,
  verification text,
  internal_href text NOT NULL,
  source_url text,
  trust_level smallint NOT NULL DEFAULT 90 CHECK (trust_level BETWEEN 0 AND 100),
  completeness_score smallint NOT NULL DEFAULT 0 CHECK (completeness_score BETWEEN 0 AND 100),
  missing_fields text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kg_citations_content ON kg_citations(content_ref_id);
CREATE INDEX IF NOT EXISTS idx_kg_citations_source ON kg_citations(source_ref_id);

CREATE TABLE IF NOT EXISTS reasoning_pipeline_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_log_id uuid REFERENCES reasoning_query_logs(id) ON DELETE SET NULL,
  session_id text,
  query text,
  step_name text NOT NULL CHECK (step_name IN (
    'question','intent_detection','knowledge_retrieval','evidence_ranking',
    'conflict_resolution','citation_builder','final_answer'
  )),
  step_order int NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('started','completed','failed','skipped')),
  input_summary text,
  output_summary text,
  confidence_score smallint CHECK (confidence_score BETWEEN 0 AND 100),
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  audit_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  latency_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reasoning_pipeline_query ON reasoning_pipeline_steps(query_log_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_pipeline_session ON reasoning_pipeline_steps(session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS quran_surah_profiles (
  surah_number int PRIMARY KEY CHECK (surah_number BETWEEN 1 AND 114),
  ref_id text UNIQUE NOT NULL,
  names text[] NOT NULL DEFAULT '{}',
  naming_reason text,
  revelation_place text,
  ayah_count int NOT NULL,
  word_count int,
  letter_count int,
  revelation_order int,
  mushaf_order int NOT NULL,
  objectives text[] NOT NULL DEFAULT '{}',
  themes text[] NOT NULL DEFAULT '{}',
  topics text[] NOT NULL DEFAULT '{}',
  before_connection text,
  after_connection text,
  asbab_nuzul jsonb NOT NULL DEFAULT '[]'::jsonb,
  nasikh_mansukh jsonb NOT NULL DEFAULT '[]'::jsonb,
  waqf_ibtida jsonb NOT NULL DEFAULT '[]'::jsonb,
  qiraat jsonb NOT NULL DEFAULT '[]'::jsonb,
  rulings text[] NOT NULL DEFAULT '{}',
  aqeedah_points text[] NOT NULL DEFAULT '{}',
  benefits text[] NOT NULL DEFAULT '{}',
  lessons text[] NOT NULL DEFAULT '{}',
  lataif text[] NOT NULL DEFAULT '{}',
  stories jsonb NOT NULL DEFAULT '[]'::jsonb,
  mind_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  people jsonb NOT NULL DEFAULT '[]'::jsonb,
  places jsonb NOT NULL DEFAULT '[]'::jsonb,
  citation_ids uuid[] NOT NULL DEFAULT '{}',
  trust_level smallint NOT NULL DEFAULT 90,
  last_reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hadith_profiles (
  ref_id text PRIMARY KEY,
  matn text NOT NULL,
  isnad text,
  companion text,
  narrators jsonb NOT NULL DEFAULT '[]'::jsonb,
  isnad_tree jsonb NOT NULL DEFAULT '{}'::jsonb,
  takhrij jsonb NOT NULL DEFAULT '[]'::jsonb,
  grade text,
  routes jsonb NOT NULL DEFAULT '[]'::jsonb,
  shawahid jsonb NOT NULL DEFAULT '[]'::jsonb,
  mutabaat jsonb NOT NULL DEFAULT '[]'::jsonb,
  benefits text[] NOT NULL DEFAULT '{}',
  rulings text[] NOT NULL DEFAULT '{}',
  explanation text,
  language_notes text[] NOT NULL DEFAULT '{}',
  gharib text[] NOT NULL DEFAULT '{}',
  fiqh_points text[] NOT NULL DEFAULT '{}',
  aqeedah_points text[] NOT NULL DEFAULT '{}',
  abrogation_notes text,
  scholarly_disagreement text,
  chapter_refs text[] NOT NULL DEFAULT '{}',
  citation_ids uuid[] NOT NULL DEFAULT '{}',
  trust_level smallint NOT NULL DEFAULT 90,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fiqh_issue_profiles (
  ref_id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  quran_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  sunnah_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  ijma_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  qiyas_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  madhhab_positions jsonb NOT NULL DEFAULT '{}'::jsonb,
  disagreement_reason text,
  tarjih text,
  references jsonb NOT NULL DEFAULT '[]'::jsonb,
  citation_ids uuid[] NOT NULL DEFAULT '{}',
  trust_level smallint NOT NULL DEFAULT 90,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION kg_phase4_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'nodes', (SELECT count(*) FROM kg_nodes WHERE deleted_at IS NULL),
    'edges', (SELECT count(*) FROM kg_edges),
    'citations', (SELECT count(*) FROM kg_citations),
    'pipeline_steps_24h', (SELECT count(*) FROM reasoning_pipeline_steps WHERE created_at > now() - interval '24 hours'),
    'surah_profiles', (SELECT count(*) FROM quran_surah_profiles),
    'hadith_profiles', (SELECT count(*) FROM hadith_profiles),
    'fiqh_issue_profiles', (SELECT count(*) FROM fiqh_issue_profiles),
    'verified_nodes', (SELECT count(*) FROM kg_nodes WHERE verification_status = 'verified')
  );
END;
$$;
