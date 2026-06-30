-- =====================================================================
--  MAJALISILM.COM — إعداد قاعدة البيانات (ملف موحد)
--  آمن للتشغيل مرات متعددة — كل الأوامر تستخدم IF NOT EXISTS
--  شغّل هذا الملف مرة واحدة في Supabase SQL Editor
-- =====================================================================

-- ════════════════════════════════════════════════════════════════════
--  1. الإضافات (Extensions)
-- ════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;

-- ════════════════════════════════════════════════════════════════════
--  2. تحديث enum الأدوار (إضافة super_admin)
-- ════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════════════════
--  3. جداول الحوكمة (مطلوبة قبل is_admin)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS governance_user_roles (
  user_id    UUID PRIMARY KEY,
  role_id    TEXT NOT NULL DEFAULT 'read_only',
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_governance_roles_role ON governance_user_roles (role_id);

CREATE TABLE IF NOT EXISTS governance_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action        TEXT NOT NULL,
  actor_id      TEXT NOT NULL DEFAULT 'system',
  actor_role    TEXT,
  resource_type TEXT,
  resource_id   TEXT,
  ref_id        TEXT,
  ip_address    TEXT,
  user_agent    TEXT,
  reason        TEXT,
  outcome       TEXT DEFAULT 'success',
  metadata      JSONB DEFAULT '{}',
  source        TEXT DEFAULT 'governance',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gov_audit_created ON governance_audit_log (created_at DESC);

-- ════════════════════════════════════════════════════════════════════
--  4. أعمدة profiles الإضافية
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_owner        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status          TEXT    NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_is_owner
  ON profiles (is_owner) WHERE is_owner = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin
  ON profiles (is_super_admin) WHERE is_super_admin = true;

-- ════════════════════════════════════════════════════════════════════
--  5. دالة is_admin() — تستخدمها سياسات RLS في كل الجداول
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'super_admin')
        OR p.is_admin = true
        OR p.is_super_admin = true
        OR p.is_owner = true
      )
  )
  OR EXISTS (
    SELECT 1 FROM governance_user_roles g
    WHERE g.user_id = auth.uid()
      AND g.role_id IN ('super_admin', 'system_admin', 'content_manager')
  );
$$;

-- ════════════════════════════════════════════════════════════════════
--  6. حماية مالك المنصة (Bootstrap Owner Protection)
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION protect_bootstrap_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_email    TEXT;
  protected_emails TEXT[] := ARRAY['yalabdullmohsen1@gmail.com'];
BEGIN
  SELECT lower(trim(u.email)) INTO owner_email
  FROM auth.users u
  WHERE u.id = COALESCE(NEW.id, OLD.id);

  IF owner_email IS NOT NULL AND owner_email = ANY(protected_emails) THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete protected platform owner: %', owner_email;
    END IF;
    NEW.role           := 'super_admin';
    NEW.is_admin       := true;
    NEW.is_super_admin := true;
    NEW.is_owner       := true;
    NEW.status         := 'active';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_owner = true AND NEW.is_owner = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE p.id = auth.uid()
        AND (p.is_owner = true OR lower(trim(u.email)) = ANY(protected_emails))
    ) THEN
      RAISE EXCEPTION 'Cannot demote a platform owner';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_bootstrap_owners ON profiles;
CREATE TRIGGER trg_protect_bootstrap_owners
  BEFORE UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_bootstrap_owners();

CREATE OR REPLACE FUNCTION prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_owner = true OR NEW.is_super_admin = true OR NEW.role = 'super_admin' THEN
    RETURN NEW;
  END IF;
  IF NOT is_admin() AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  IF NOT is_admin() AND (
    NEW.is_admin IS DISTINCT FROM OLD.is_admin
    OR NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin
    OR NEW.is_owner IS DISTINCT FROM OLD.is_owner
  ) THEN
    NEW.is_admin       := OLD.is_admin;
    NEW.is_super_admin := OLD.is_super_admin;
    NEW.is_owner       := OLD.is_owner;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION promote_bootstrap_owner(target_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid              UUID;
  protected_emails TEXT[] := ARRAY['yalabdullmohsen1@gmail.com'];
  normalized       TEXT   := lower(trim(target_email));
BEGIN
  IF normalized IS NULL OR normalized = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;
  IF NOT (normalized = ANY(protected_emails)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'email_not_in_bootstrap_list');
  END IF;

  SELECT id INTO uid FROM auth.users WHERE lower(trim(email)) = normalized LIMIT 1;
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found', 'email', normalized);
  END IF;

  INSERT INTO profiles (id, full_name, role, is_admin, is_super_admin, is_owner, status)
  VALUES (
    uid,
    COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = uid),
             split_part(normalized, '@', 1)),
    'super_admin', true, true, true, 'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    role           = 'super_admin',
    is_admin       = true,
    is_super_admin = true,
    is_owner       = true,
    status         = 'active';

  INSERT INTO governance_user_roles (user_id, role_id, assigned_by, assigned_at)
  VALUES (uid, 'super_admin', 'owner_bootstrap_sql', now())
  ON CONFLICT (user_id) DO UPDATE SET
    role_id     = 'super_admin',
    assigned_by = 'owner_bootstrap_sql',
    assigned_at = now();

  RETURN jsonb_build_object('ok', true, 'user_id', uid, 'email', normalized);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
--  7. جداول منصة المحتوى المستقل (AKP)
--     هذه الجداول تشغّل محركات الأحاديث والقصص والفوائد
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS akp_content_sources (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT    NOT NULL UNIQUE,
  name                 TEXT    NOT NULL,
  source_type          TEXT    NOT NULL DEFAULT 'rss',
  source_url           TEXT    NOT NULL,
  priority             INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  trust_score          INTEGER NOT NULL DEFAULT 70 CHECK (trust_score BETWEEN 0 AND 100),
  language             TEXT    NOT NULL DEFAULT 'ar',
  category             TEXT    NOT NULL DEFAULT 'general',
  content_types        TEXT[]  NOT NULL DEFAULT '{}',
  fetch_interval_hours INTEGER NOT NULL DEFAULT 1 CHECK (fetch_interval_hours >= 1),
  dedup_rules          JSONB   NOT NULL DEFAULT '{"hash":true,"title_match":true,"source_match":true,"semantic_threshold":0.85}',
  parser               TEXT    NOT NULL DEFAULT 'rss',
  validator            TEXT    NOT NULL DEFAULT 'scholarly_v1',
  publication_policy   JSONB   NOT NULL DEFAULT '{"auto_publish":false,"min_trust":80,"review_on_fail":true}',
  active               BOOLEAN NOT NULL DEFAULT true,
  last_fetch_at        TIMESTAMPTZ,
  last_success_at      TIMESTAMPTZ,
  last_error           TEXT,
  metadata             JSONB   NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_content_sources_active_idx
  ON akp_content_sources (active, priority DESC, last_fetch_at ASC NULLS FIRST);

CREATE TABLE IF NOT EXISTS akp_content_fingerprints (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type     TEXT NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  normalized_text  TEXT,
  title_normalized TEXT,
  source_slug      TEXT,
  target_table     TEXT,
  target_id        TEXT,
  embedding        vector(1536),
  similarity_group TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_type, fingerprint_hash)
);

CREATE INDEX IF NOT EXISTS akp_fingerprints_type_hash_idx
  ON akp_content_fingerprints (content_type, fingerprint_hash);
CREATE INDEX IF NOT EXISTS akp_fingerprints_source_idx
  ON akp_content_fingerprints (source_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS akp_review_queue (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type   TEXT NOT NULL,
  source_id      UUID REFERENCES akp_content_sources(id) ON DELETE SET NULL,
  source_slug    TEXT,
  payload        JSONB NOT NULL DEFAULT '{}',
  blockers       JSONB NOT NULL DEFAULT '[]',
  warnings       JSONB NOT NULL DEFAULT '[]',
  status         TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  pipeline_run_id UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS akp_review_queue_status_idx
  ON akp_review_queue (status, created_at DESC);

CREATE TABLE IF NOT EXISTS akp_dead_letter_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name      TEXT NOT NULL DEFAULT 'akp',
  job_type        TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  error           TEXT NOT NULL,
  retry_count     INTEGER NOT NULL DEFAULT 0,
  original_job_id UUID,
  failure_reason  TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_dlq_created_idx ON akp_dead_letter_jobs (created_at DESC);

CREATE TABLE IF NOT EXISTS akp_pipeline_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline      TEXT NOT NULL,
  trigger_type  TEXT NOT NULL DEFAULT 'cron',
  mode          TEXT NOT NULL DEFAULT 'produce',
  status        TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  quota_daily   INTEGER NOT NULL DEFAULT 0,
  produced      INTEGER NOT NULL DEFAULT 0,
  published     INTEGER NOT NULL DEFAULT 0,
  duplicates    INTEGER NOT NULL DEFAULT 0,
  rejected      INTEGER NOT NULL DEFAULT 0,
  review_queued INTEGER NOT NULL DEFAULT 0,
  errors        INTEGER NOT NULL DEFAULT 0,
  retry_count   INTEGER NOT NULL DEFAULT 0,
  duration_ms   INTEGER,
  metadata      JSONB NOT NULL DEFAULT '{}',
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS akp_pipeline_runs_pipeline_idx
  ON akp_pipeline_runs (pipeline, started_at DESC);

ALTER TABLE akp_pipeline_runs ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS akp_structured_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level       TEXT NOT NULL DEFAULT 'info'
    CHECK (level IN ('debug', 'info', 'warn', 'error')),
  component   TEXT NOT NULL,
  event       TEXT NOT NULL,
  message     TEXT,
  pipeline    TEXT,
  run_id      UUID,
  duration_ms INTEGER,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_logs_component_idx
  ON akp_structured_logs (component, created_at DESC);

CREATE TABLE IF NOT EXISTS akp_metrics_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type TEXT NOT NULL DEFAULT 'hourly',
  metrics       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_metrics_type_idx
  ON akp_metrics_snapshots (snapshot_type, created_at DESC);

CREATE TABLE IF NOT EXISTS akp_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity    TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  component   TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT,
  resolved    BOOLEAN NOT NULL DEFAULT false,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS akp_alerts_unresolved_idx
  ON akp_alerts (resolved, severity, created_at DESC);

-- جدول القصص الإسلامية — يشغّل صفحة /stories
CREATE TABLE IF NOT EXISTS akp_stories (
  id                  TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  body                TEXT NOT NULL,
  source_name         TEXT,
  source_url          TEXT,
  category            TEXT DEFAULT 'قصص',
  topic               TEXT,
  summary             TEXT,
  verification_status TEXT NOT NULL DEFAULT 'verified'
    CHECK (verification_status IN ('verified', 'needs_review', 'rejected', 'duplicate')),
  trust_level         SMALLINT NOT NULL DEFAULT 90,
  metadata            JSONB NOT NULL DEFAULT '{}',
  published_at        TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_stories_status_idx
  ON akp_stories (verification_status, created_at DESC);

-- قائمة إعادة المحاولة
CREATE TABLE IF NOT EXISTS akp_retry_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name      TEXT NOT NULL DEFAULT 'akp-pipeline',
  job_type        TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  error           TEXT,
  retry_count     INTEGER NOT NULL DEFAULT 0,
  max_retries     INTEGER NOT NULL DEFAULT 3,
  next_retry_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  pipeline_run_id UUID,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_retry_queue_next_idx
  ON akp_retry_queue (next_retry_at ASC)
  WHERE retry_count < max_retries;

-- صحة المصادر
CREATE TABLE IF NOT EXISTS akp_source_health (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug   TEXT NOT NULL,
  endpoint_url  TEXT NOT NULL,
  status        TEXT NOT NULL
    CHECK (status IN ('available','slow','redirect','unauthorized','blocked','dead','unknown')),
  http_status   INTEGER,
  latency_ms    INTEGER,
  error_message TEXT,
  items_found   INTEGER NOT NULL DEFAULT 0,
  metadata      JSONB NOT NULL DEFAULT '{}',
  checked_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_source_health_slug_idx
  ON akp_source_health (source_slug, checked_at DESC);
CREATE INDEX IF NOT EXISTS akp_source_health_status_idx
  ON akp_source_health (status, checked_at DESC);

-- سجل التكرار
CREATE TABLE IF NOT EXISTS akp_duplicate_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type     TEXT NOT NULL,
  fingerprint_hash TEXT,
  source_slug      TEXT,
  target_id        TEXT,
  duplicate_of     TEXT,
  detection_method TEXT NOT NULL DEFAULT 'hash'
    CHECK (detection_method IN ('hash','title_match','semantic','source_match')),
  similarity_score FLOAT,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_duplicate_history_type_idx
  ON akp_duplicate_history (content_type, created_at DESC);

-- إضافة أعمدة AKP إلى mke_source_plugins (إن وجد الجدول)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mke_source_plugins'
  ) THEN
    ALTER TABLE mke_source_plugins ADD COLUMN IF NOT EXISTS content_types TEXT[] DEFAULT '{}';
    ALTER TABLE mke_source_plugins ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar';
    ALTER TABLE mke_source_plugins ADD COLUMN IF NOT EXISTS fetch_interval_hours INTEGER DEFAULT 1;
    ALTER TABLE mke_source_plugins ADD COLUMN IF NOT EXISTS dedup_rules JSONB DEFAULT '{"hash":true,"title_match":true,"semantic_threshold":0.85}';
    ALTER TABLE mke_source_plugins ADD COLUMN IF NOT EXISTS parser TEXT DEFAULT 'auto';
    ALTER TABLE mke_source_plugins ADD COLUMN IF NOT EXISTS validator TEXT DEFAULT 'scholarly_v1';
    ALTER TABLE mke_source_plugins ADD COLUMN IF NOT EXISTS publication_policy JSONB DEFAULT '{"auto_publish":false,"min_trust":80}';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════
--  8. جداول المعرفة الموثقة
--     الأحاديث النبوية والأذكار — يشغّل صفحة /hadith
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS verified_adhkar_categories (
  id                  TEXT PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  sort_order          INT DEFAULT 0,
  source_slug         TEXT,
  verification_status TEXT NOT NULL DEFAULT 'needs_review'
    CHECK (verification_status IN ('verified','needs_review','rejected','archived')),
  trust_level         SMALLINT NOT NULL DEFAULT 90 CHECK (trust_level BETWEEN 0 AND 100),
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at          TIMESTAMPTZ,
  version_number      INT NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verified_adhkar_cat_slug
  ON verified_adhkar_categories (slug);
CREATE INDEX IF NOT EXISTS idx_verified_adhkar_cat_status
  ON verified_adhkar_categories (verification_status);

CREATE TABLE IF NOT EXISTS verified_adhkar_items (
  id                  TEXT PRIMARY KEY,
  category_id         TEXT NOT NULL REFERENCES verified_adhkar_categories(id) ON DELETE CASCADE,
  text                TEXT NOT NULL,
  repeat_count        INT NOT NULL DEFAULT 1,
  narrator            TEXT,
  source_name         TEXT,
  source_url          TEXT,
  grade               TEXT,
  reference           TEXT,
  explanation         TEXT,
  keywords            TEXT[] DEFAULT '{}',
  global_ref_id       TEXT,
  provenance_id       UUID,
  verification_status TEXT NOT NULL DEFAULT 'needs_review'
    CHECK (verification_status IN ('verified','needs_review','rejected','duplicate','archived')),
  quality_score       SMALLINT NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  trust_level         SMALLINT NOT NULL DEFAULT 90 CHECK (trust_level BETWEEN 0 AND 100),
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at          TIMESTAMPTZ,
  version_number      INT NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verified_adhkar_items_cat
  ON verified_adhkar_items (category_id);
CREATE INDEX IF NOT EXISTS idx_verified_adhkar_items_status
  ON verified_adhkar_items (verification_status);
CREATE INDEX IF NOT EXISTS idx_verified_adhkar_items_keywords
  ON verified_adhkar_items USING gin (keywords);

-- جدول الأحاديث النبوية الموثقة — يشغّل صفحة /hadith
CREATE TABLE IF NOT EXISTS verified_hadith_items (
  id                  TEXT PRIMARY KEY,
  collection          TEXT,
  hadith_number       TEXT,
  title               TEXT,
  text                TEXT NOT NULL,
  narrator            TEXT,
  scholar             TEXT,
  source_name         TEXT NOT NULL,
  source_url          TEXT,
  grade               TEXT,
  chapter             TEXT,
  keywords            TEXT[] DEFAULT '{}',
  explanation         TEXT,
  global_ref_id       TEXT,
  provenance_id       UUID,
  verification_status TEXT NOT NULL DEFAULT 'needs_review'
    CHECK (verification_status IN ('verified','needs_review','rejected','duplicate','archived')),
  quality_score       SMALLINT NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  trust_level         SMALLINT NOT NULL DEFAULT 90 CHECK (trust_level BETWEEN 0 AND 100),
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at          TIMESTAMPTZ,
  version_number      INT NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verified_hadith_status
  ON verified_hadith_items (verification_status);
CREATE INDEX IF NOT EXISTS idx_verified_hadith_collection
  ON verified_hadith_items (collection, hadith_number);
CREATE INDEX IF NOT EXISTS idx_verified_hadith_keywords
  ON verified_hadith_items USING gin (keywords);

-- سجل عمليات الاستيراد
CREATE TABLE IF NOT EXISTS import_operations_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation         TEXT NOT NULL,
  source_slug       TEXT,
  content_type      TEXT,
  content_id        TEXT,
  status            TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','completed','failed','skipped')),
  items_discovered  INT NOT NULL DEFAULT 0,
  items_imported    INT NOT NULL DEFAULT 0,
  items_updated     INT NOT NULL DEFAULT 0,
  items_rejected    INT NOT NULL DEFAULT 0,
  items_needs_review INT NOT NULL DEFAULT 0,
  confidence_score  SMALLINT,
  error_summary     TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id          TEXT DEFAULT 'system',
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_ops_started ON import_operations_log (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_ops_source  ON import_operations_log (source_slug);
CREATE INDEX IF NOT EXISTS idx_import_ops_status  ON import_operations_log (status);

-- تقارير جودة المحتوى
CREATE TABLE IF NOT EXISTS knowledge_quality_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_type TEXT NOT NULL DEFAULT 'daily'
    CHECK (report_type IN ('daily','weekly','manual')),
  sections    JSONB NOT NULL DEFAULT '{}'::jsonb,
  totals      JSONB NOT NULL DEFAULT '{}'::jsonb,
  gaps        JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_date, report_type)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_quality_date
  ON knowledge_quality_reports (report_date DESC);

-- إضافة أعمدة scholarly_sources (إن وجد الجدول)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'scholarly_sources'
  ) THEN
    ALTER TABLE scholarly_sources ADD COLUMN IF NOT EXISTS licensing TEXT;
    ALTER TABLE scholarly_sources ADD COLUMN IF NOT EXISTS import_method TEXT;
    ALTER TABLE scholarly_sources ADD COLUMN IF NOT EXISTS source_language TEXT DEFAULT 'ar';
    ALTER TABLE scholarly_sources ADD COLUMN IF NOT EXISTS last_import_at TIMESTAMPTZ;
    ALTER TABLE scholarly_sources ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════
--  9. جدول المقترحات (submissions) من المجتمع
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS submissions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT        NOT NULL CHECK (type IN ('lesson', 'question')),
  title      TEXT        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 500),
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 3 AND 8000),
  author     TEXT        NOT NULL DEFAULT '',
  status     TEXT        NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'approved', 'rejected')),
  meta       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS submissions_status_idx
  ON submissions (status, created_at DESC);

-- ════════════════════════════════════════════════════════════════════
--  10. سياسات Row Level Security (RLS)
-- ════════════════════════════════════════════════════════════════════

-- Governance
ALTER TABLE governance_user_roles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_audit_log   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "svc_governance_user_roles" ON governance_user_roles;
CREATE POLICY "svc_governance_user_roles" ON governance_user_roles FOR ALL USING (true);

DROP POLICY IF EXISTS "svc_governance_audit_log" ON governance_audit_log;
CREATE POLICY "svc_governance_audit_log" ON governance_audit_log FOR ALL USING (true);

-- AKP tables (admin only, engine writes via service_role)
ALTER TABLE akp_content_sources    ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_content_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_review_queue       ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_dead_letter_jobs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_pipeline_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_structured_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_metrics_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_stories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_retry_queue        ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_source_health      ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_duplicate_history  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS akp_admin_sources          ON akp_content_sources;
CREATE POLICY akp_admin_sources          ON akp_content_sources    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_fingerprints     ON akp_content_fingerprints;
CREATE POLICY akp_admin_fingerprints     ON akp_content_fingerprints FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_review           ON akp_review_queue;
CREATE POLICY akp_admin_review           ON akp_review_queue       FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_dlq              ON akp_dead_letter_jobs;
CREATE POLICY akp_admin_dlq              ON akp_dead_letter_jobs   FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_pipeline_runs    ON akp_pipeline_runs;
CREATE POLICY akp_admin_pipeline_runs    ON akp_pipeline_runs      FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_logs             ON akp_structured_logs;
CREATE POLICY akp_admin_logs             ON akp_structured_logs    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_metrics          ON akp_metrics_snapshots;
CREATE POLICY akp_admin_metrics          ON akp_metrics_snapshots  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_alerts           ON akp_alerts;
CREATE POLICY akp_admin_alerts           ON akp_alerts             FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- akp_stories: القصص عامة للقراءة، الإدارة للأدمن فقط
DROP POLICY IF EXISTS akp_stories_public_read    ON akp_stories;
CREATE POLICY akp_stories_public_read    ON akp_stories FOR SELECT USING (verification_status = 'verified');

DROP POLICY IF EXISTS akp_stories_admin          ON akp_stories;
CREATE POLICY akp_stories_admin          ON akp_stories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_retry_queue      ON akp_retry_queue;
CREATE POLICY akp_admin_retry_queue      ON akp_retry_queue        FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_source_health    ON akp_source_health;
CREATE POLICY akp_admin_source_health    ON akp_source_health      FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_duplicate_history ON akp_duplicate_history;
CREATE POLICY akp_admin_duplicate_history ON akp_duplicate_history FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Verified hadith: عام للقراءة، الإدارة للأدمن
ALTER TABLE verified_hadith_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_adhkar_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_adhkar_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_operations_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_quality_reports   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verified_hadith_public_read ON verified_hadith_items;
CREATE POLICY verified_hadith_public_read ON verified_hadith_items FOR SELECT
  USING (verification_status = 'verified');

DROP POLICY IF EXISTS verified_hadith_admin ON verified_hadith_items;
CREATE POLICY verified_hadith_admin ON verified_hadith_items FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS verified_adhkar_cat_public ON verified_adhkar_categories;
CREATE POLICY verified_adhkar_cat_public ON verified_adhkar_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS verified_adhkar_cat_admin ON verified_adhkar_categories;
CREATE POLICY verified_adhkar_cat_admin ON verified_adhkar_categories FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS verified_adhkar_items_public ON verified_adhkar_items;
CREATE POLICY verified_adhkar_items_public ON verified_adhkar_items FOR SELECT
  USING (verification_status = 'verified');

DROP POLICY IF EXISTS verified_adhkar_items_admin ON verified_adhkar_items;
CREATE POLICY verified_adhkar_items_admin ON verified_adhkar_items FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS import_log_admin ON import_operations_log;
CREATE POLICY import_log_admin ON import_operations_log FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS quality_reports_admin ON knowledge_quality_reports;
CREATE POLICY quality_reports_admin ON knowledge_quality_reports FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- Submissions: أي زائر يستطيع الإرسال، الأدمن يقرأ ويعدّل
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can submit"        ON submissions;
CREATE POLICY "anyone can submit" ON submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admins can read all"      ON submissions;
CREATE POLICY "admins can read all" ON submissions FOR SELECT
  USING (auth.role() = 'service_role' OR is_admin());

DROP POLICY IF EXISTS "admins can update status" ON submissions;
CREATE POLICY "admins can update status" ON submissions FOR UPDATE
  USING (auth.role() = 'service_role' OR is_admin());

-- ════════════════════════════════════════════════════════════════════
--  11. جداول الأسئلة والأجوبة (صفحة /qa)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS qa_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  description TEXT,
  sort_order  INT         DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_questions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question      TEXT        NOT NULL,
  answer        TEXT        NOT NULL,
  category_id   UUID        REFERENCES qa_categories(id) ON DELETE SET NULL,
  ruling_type   TEXT,
  evidence      TEXT,
  reference     TEXT,
  status        TEXT        NOT NULL DEFAULT 'published',
  review_status TEXT        NOT NULL DEFAULT 'approved',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS qa_questions_category_idx ON qa_questions (category_id);
CREATE INDEX IF NOT EXISTS qa_questions_status_idx   ON qa_questions (status);

-- RLS: QA is publicly readable
ALTER TABLE qa_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_questions  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS qa_categories_public ON qa_categories;
CREATE POLICY qa_categories_public ON qa_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS qa_categories_admin ON qa_categories;
CREATE POLICY qa_categories_admin ON qa_categories FOR ALL
  USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());

DROP POLICY IF EXISTS qa_questions_public ON qa_questions;
CREATE POLICY qa_questions_public ON qa_questions FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS qa_questions_admin ON qa_questions;
CREATE POLICY qa_questions_admin ON qa_questions FOR ALL
  USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ════════════════════════════════════════════════════════════════════
--  12. جداول الأحكام الشرعية (صفحة /rulings)
-- ════════════════════════════════════════════════════════════════════

-- Enum for content status (safe to re-run)
DO $$ BEGIN
  CREATE TYPE platform_content_status AS ENUM ('draft', 'pending', 'approved', 'archived', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS sharia_rulings (
  id           UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key TEXT                   UNIQUE,
  title        TEXT                   NOT NULL,
  summary      TEXT,
  body         TEXT                   NOT NULL,
  category     TEXT                   NOT NULL DEFAULT 'فقه عام',
  evidence     JSONB                  DEFAULT '[]',
  "references" JSONB                  DEFAULT '[]',
  keywords     TEXT[]                 DEFAULT '{}',
  status       platform_content_status NOT NULL DEFAULT 'approved',
  view_count   INT                    NOT NULL DEFAULT 0,
  search_vector TSVECTOR,
  published_at TIMESTAMPTZ,
  archived_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sharia_rulings_category_idx ON sharia_rulings (category);
CREATE INDEX IF NOT EXISTS sharia_rulings_status_idx   ON sharia_rulings (status);

-- normalize_ar helper (no-op if exists)
CREATE OR REPLACE FUNCTION normalize_ar(input TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(regexp_replace(coalesce(input, ''), '\s+', ' ', 'g'));
$$;

ALTER TABLE sharia_rulings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sharia_rulings_public ON sharia_rulings;
CREATE POLICY sharia_rulings_public ON sharia_rulings FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS sharia_rulings_admin ON sharia_rulings;
CREATE POLICY sharia_rulings_admin ON sharia_rulings FOR ALL
  USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ════════════════════════════════════════════════════════════════════
--  13. ترقية مالك المنصة إلى super_admin
--      (سيُرجع خطأ "user_not_found" إذا لم يسجّل المستخدم بعد — طبيعي)
-- ════════════════════════════════════════════════════════════════════

SELECT promote_bootstrap_owner('yalabdullmohsen1@gmail.com');

-- ════════════════════════════════════════════════════════════════════
--  اكتمل الإعداد ✓
--  الجداول المُنشأة:
--    • qa_categories        → صفحة /qa
--    • qa_questions         → صفحة /qa
--    • sharia_rulings       → صفحة /rulings
--    • akp_stories          → صفحة /stories
--    • verified_hadith_items → صفحة /hadith
--    • submissions          → صفحة /submit
--    • governance_user_roles → نظام الأدوار
--    • is_admin()           → سياسات RLS
-- ════════════════════════════════════════════════════════════════════
