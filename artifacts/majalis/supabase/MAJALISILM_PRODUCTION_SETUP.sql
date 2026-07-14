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
  -- ⚠️ إصلاح أمني 2026-07-14: الإعفاء يُبنى على OLD (حالة الصف الفعلية) لا NEW (ما يطلبه المستدعي).
  -- الصيغة القديمة كانت تفحص NEW فتُرجع الصف دون فحص لمن طلب لنفسه is_super_admin = true → تصعيد صلاحيات كامل.
  IF OLD.is_owner = true OR OLD.is_super_admin = true OR OLD.role = 'super_admin' THEN
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
CREATE POLICY "svc_governance_user_roles" ON governance_user_roles FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "svc_governance_audit_log" ON governance_audit_log;
CREATE POLICY "svc_governance_audit_log" ON governance_audit_log FOR ALL TO service_role USING (true);

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
--  13. جداول المحتوى الأساسية
--      sheikhs · lessons · library_items · fatwas · fawaid
--      scientific_miracles · annual_courses · platform_updates
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sheikhs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  name_en       TEXT,
  ijazah        TEXT,
  city          TEXT,
  country       TEXT DEFAULT 'الكويت',
  years_experience INTEGER,
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  specialties   TEXT[] DEFAULT '{}',
  bio           TEXT,
  photo_url     TEXT,
  status        TEXT NOT NULL DEFAULT 'approved',
  needs_verification BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sheikhs_name ON sheikhs (name);
CREATE INDEX IF NOT EXISTS idx_sheikhs_status ON sheikhs (status);

ALTER TABLE sheikhs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sheikhs_public_read ON sheikhs;
CREATE POLICY sheikhs_public_read ON sheikhs FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS sheikhs_admin ON sheikhs;
CREATE POLICY sheikhs_admin ON sheikhs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key    TEXT UNIQUE,
  title           TEXT NOT NULL,
  speaker_name    TEXT,
  sheikh_id       UUID REFERENCES sheikhs(id) ON DELETE SET NULL,
  category        TEXT,
  city            TEXT,
  region          TEXT,
  mosque          TEXT,
  day_of_week     TEXT,
  lesson_time     TEXT,
  schedule        TEXT,
  description     TEXT,
  audience        TEXT,
  delivery        TEXT NOT NULL DEFAULT 'in-person',
  status          TEXT NOT NULL DEFAULT 'approved',
  keywords        TEXT[] DEFAULT '{}',
  live_url        TEXT,
  book_url        TEXT,
  maps_url        TEXT,
  start_date      DATE,
  end_date        DATE,
  is_recurring    BOOLEAN NOT NULL DEFAULT true,
  activity_type   TEXT NOT NULL DEFAULT 'درس',
  is_course       BOOLEAN NOT NULL DEFAULT false,
  course_id       TEXT,
  session_count   INTEGER,
  linked_titles   TEXT[] DEFAULT '{}',
  poster_image_url TEXT,
  country         TEXT,
  organizer       TEXT,
  cooperative_org TEXT,
  contact_phone   TEXT,
  source_id       UUID,
  confidence_score NUMERIC(5,3),
  imported_by     TEXT,
  poster_image_hash TEXT,
  archive_reason  TEXT,
  mosque_id       UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons (status);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons (category);
CREATE INDEX IF NOT EXISTS idx_lessons_external_key ON lessons (external_key);
CREATE INDEX IF NOT EXISTS idx_lessons_sheikh_id ON lessons (sheikh_id);
CREATE INDEX IF NOT EXISTS idx_lessons_activity_type ON lessons (activity_type, status);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lessons_public_read ON lessons;
CREATE POLICY lessons_public_read ON lessons FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS lessons_admin ON lessons;
CREATE POLICY lessons_admin ON lessons FOR ALL USING (auth.role() = 'service_role' OR is_admin()) WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  author      TEXT,
  author_name TEXT,
  type        TEXT NOT NULL DEFAULT 'كتاب',
  category    TEXT,
  description TEXT,
  parts_label TEXT,
  external_url TEXT,
  file_url    TEXT,
  status      TEXT NOT NULL DEFAULT 'approved',
  keywords    TEXT[] DEFAULT '{}',
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_items_status ON library_items (status);
CREATE INDEX IF NOT EXISTS idx_library_items_category ON library_items (category);

ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS library_items_public_read ON library_items;
CREATE POLICY library_items_public_read ON library_items FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS library_items_admin ON library_items;
CREATE POLICY library_items_admin ON library_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fatwas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key TEXT UNIQUE,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  summary     TEXT,
  category    TEXT NOT NULL DEFAULT 'فقه عام',
  format      TEXT NOT NULL DEFAULT 'written',
  audio_url   TEXT,
  mufti_name  TEXT,
  source_urls TEXT[] DEFAULT '{}',
  references  JSONB DEFAULT '[]',
  keywords    TEXT[] DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'approved',
  view_count  INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fatwas_status ON fatwas (status);
CREATE INDEX IF NOT EXISTS idx_fatwas_category ON fatwas (category);

ALTER TABLE fatwas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fatwas_public_read ON fatwas;
CREATE POLICY fatwas_public_read ON fatwas FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS fatwas_admin ON fatwas;
CREATE POLICY fatwas_admin ON fatwas FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fawaid (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text        TEXT NOT NULL,
  author_name TEXT,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source      TEXT,
  category    TEXT,
  topic       TEXT,
  body        TEXT,
  summary     TEXT,
  source_name TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fawaid_status ON fawaid (status);

ALTER TABLE fawaid ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fawaid_public_read ON fawaid;
CREATE POLICY fawaid_public_read ON fawaid FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS fawaid_submit ON fawaid;
CREATE POLICY fawaid_submit ON fawaid FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS fawaid_admin ON fawaid;
CREATE POLICY fawaid_admin ON fawaid FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scientific_miracles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  category            TEXT NOT NULL,
  source_type         TEXT NOT NULL DEFAULT 'قرآن',
  reference           TEXT NOT NULL,
  verse               TEXT,
  body                TEXT NOT NULL,
  tafsir_summary      TEXT,
  scholarly_source    TEXT,
  verification_status TEXT NOT NULL DEFAULT 'needs_review',
  status              TEXT NOT NULL DEFAULT 'approved',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scientific_miracles_status ON scientific_miracles (status);
CREATE INDEX IF NOT EXISTS idx_scientific_miracles_category ON scientific_miracles (category);

ALTER TABLE scientific_miracles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS scientific_miracles_public_read ON scientific_miracles;
CREATE POLICY scientific_miracles_public_read ON scientific_miracles FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS scientific_miracles_admin ON scientific_miracles;
CREATE POLICY scientific_miracles_admin ON scientific_miracles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS annual_courses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key     TEXT UNIQUE,
  title            TEXT NOT NULL,
  summary          TEXT,
  body             TEXT,
  course_type      TEXT NOT NULL DEFAULT 'سنوية',
  season           TEXT,
  year             INTEGER,
  sheikh_names     TEXT[] DEFAULT '{}',
  mutoon           TEXT[] DEFAULT '{}',
  schedule         JSONB DEFAULT '[]',
  venue_name       TEXT,
  venue_address    TEXT,
  venue_city       TEXT,
  map_url          TEXT,
  registration_url TEXT,
  registration_open BOOLEAN DEFAULT false,
  start_date       DATE,
  end_date         DATE,
  keywords         TEXT[] DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'approved',
  view_count       INTEGER DEFAULT 0,
  archived_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annual_courses_status ON annual_courses (status, year DESC);

ALTER TABLE annual_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS annual_courses_public_read ON annual_courses;
CREATE POLICY annual_courses_public_read ON annual_courses FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS annual_courses_admin ON annual_courses;
CREATE POLICY annual_courses_admin ON annual_courses FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_updates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key TEXT UNIQUE,
  title       TEXT NOT NULL,
  summary     TEXT,
  body        TEXT,
  update_type TEXT NOT NULL DEFAULT 'إعلان',
  source_type TEXT,
  source_id   TEXT,
  source_url  TEXT,
  published_at TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'approved',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_updates_status ON platform_updates (status, published_at DESC);

ALTER TABLE platform_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_updates_public_read ON platform_updates;
CREATE POLICY platform_updates_public_read ON platform_updates FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS platform_updates_admin ON platform_updates;
CREATE POLICY platform_updates_admin ON platform_updates FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question       TEXT NOT NULL,
  options        JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation    TEXT,
  category       TEXT,
  difficulty     TEXT NOT NULL DEFAULT 'medium',
  source         TEXT,
  status         TEXT NOT NULL DEFAULT 'published',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_status ON quiz_questions (status);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quiz_questions_public_read ON quiz_questions;
CREATE POLICY quiz_questions_public_read ON quiz_questions FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS quiz_questions_admin ON quiz_questions;
CREATE POLICY quiz_questions_admin ON quiz_questions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ════════════════════════════════════════════════════════════════════
--  14. جداول بيانات المستخدم
--      bookmarks · achievements · lesson_registrations · content_views
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bookmarks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id   TEXT NOT NULL,
  title        TEXT,
  url          TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks (user_id, content_type);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bookmarks_own ON bookmarks;
CREATE POLICY bookmarks_own ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata        JSONB DEFAULT '{}',
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements (user_id, earned_at DESC);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS achievements_own ON achievements;
CREATE POLICY achievements_own ON achievements FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS achievements_service ON achievements;
CREATE POLICY achievements_service ON achievements FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_registrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'active',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_registrations_user ON lesson_registrations (user_id);

ALTER TABLE lesson_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_registrations_own ON lesson_registrations;
CREATE POLICY lesson_registrations_own ON lesson_registrations FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_views (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id   TEXT NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_views_content ON content_views (content_type, content_id, created_at DESC);

ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_views_insert ON content_views;
CREATE POLICY content_views_insert ON content_views FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS content_views_service ON content_views;
CREATE POLICY content_views_service ON content_views FOR SELECT USING (auth.role() = 'service_role' OR is_admin());

-- ════════════════════════════════════════════════════════════════════
--  15. جداول البنية التحتية
--      prayer_times · islamic_occasions_cache · search_queries
--      error_reports · platform_bootstrap_runs
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS prayer_times (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city       TEXT NOT NULL,
  country    TEXT NOT NULL DEFAULT 'الكويت',
  date       DATE NOT NULL,
  fajr       TIME,
  sunrise    TIME,
  dhuhr      TIME,
  asr        TIME,
  maghrib    TIME,
  isha       TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(city, country, date)
);

CREATE INDEX IF NOT EXISTS idx_prayer_times_date ON prayer_times (city, country, date DESC);

ALTER TABLE prayer_times ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prayer_times_public_read ON prayer_times;
CREATE POLICY prayer_times_public_read ON prayer_times FOR SELECT USING (true);
DROP POLICY IF EXISTS prayer_times_service ON prayer_times;
CREATE POLICY prayer_times_service ON prayer_times FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS islamic_occasions_cache (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_key   TEXT UNIQUE NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  hijri_date     TEXT,
  gregorian_date DATE,
  occasion_type  TEXT,
  cached_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE islamic_occasions_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS islamic_occasions_public_read ON islamic_occasions_cache;
CREATE POLICY islamic_occasions_public_read ON islamic_occasions_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS islamic_occasions_service ON islamic_occasions_cache;
CREATE POLICY islamic_occasions_service ON islamic_occasions_cache FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_queries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query         TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries (created_at DESC);

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS search_queries_insert ON search_queries;
CREATE POLICY search_queries_insert ON search_queries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS search_queries_admin ON search_queries;
CREATE POLICY search_queries_admin ON search_queries FOR SELECT USING (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS error_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type  TEXT NOT NULL,
  message     TEXT NOT NULL,
  stack       TEXT,
  url         TEXT,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_reports_created ON error_reports (created_at DESC);

ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS error_reports_insert ON error_reports;
CREATE POLICY error_reports_insert ON error_reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS error_reports_admin ON error_reports;
CREATE POLICY error_reports_admin ON error_reports FOR SELECT USING (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_bootstrap_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'running',
  steps_total     INTEGER DEFAULT 0,
  steps_completed INTEGER DEFAULT 0,
  errors          JSONB DEFAULT '[]',
  metadata        JSONB DEFAULT '{}',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bootstrap_runs_started ON platform_bootstrap_runs (started_at DESC);

ALTER TABLE platform_bootstrap_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bootstrap_runs_admin ON platform_bootstrap_runs;
CREATE POLICY bootstrap_runs_admin ON platform_bootstrap_runs FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ════════════════════════════════════════════════════════════════════
--  16. المجمع الفقهي
--      fiqh_council_items · fiqh_council_sessions · fiqh_council_sources
--      fiqh_council_issues · fiqh_council_relations · fiqh_council_duplicates
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fiqh_council_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  type                TEXT NOT NULL DEFAULT 'resolution',
  category            TEXT NOT NULL DEFAULT 'العبادات',
  subcategory         TEXT,
  summary             TEXT,
  content             TEXT,
  ruling_text         TEXT,
  evidence            JSONB DEFAULT '[]',
  key_points          TEXT[] DEFAULT '{}',
  source_name         TEXT,
  source_url          TEXT,
  council_name        TEXT,
  session_number      TEXT,
  session_date        DATE,
  decision_number     TEXT,
  tags                TEXT[] DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'published',
  views_count         INTEGER DEFAULT 0,
  published_at        TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ,
  nawazil_topic       TEXT,
  session_id          UUID,
  external_id         TEXT,
  source_id           UUID,
  content_hash        TEXT,
  validation_status   TEXT DEFAULT 'pending',
  documentation_level TEXT,
  completion_score    INTEGER DEFAULT 0,
  link_status         TEXT DEFAULT 'unchecked',
  link_checked_at     TIMESTAMPTZ,
  redirect_url        TEXT,
  confidence_level    TEXT DEFAULT 'medium',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiqh_council_items_status ON fiqh_council_items (status);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_items_type ON fiqh_council_items (type, status);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_items_category ON fiqh_council_items (category);
CREATE INDEX IF NOT EXISTS idx_fiqh_council_items_slug ON fiqh_council_items (slug);

ALTER TABLE fiqh_council_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_council_items_public_read ON fiqh_council_items;
CREATE POLICY fiqh_council_items_public_read ON fiqh_council_items FOR SELECT USING (status IN ('published', 'approved'));
DROP POLICY IF EXISTS fiqh_council_items_admin ON fiqh_council_items;
CREATE POLICY fiqh_council_items_admin ON fiqh_council_items FOR ALL USING (auth.role() = 'service_role' OR is_admin()) WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,
  session_title  TEXT NOT NULL,
  session_number TEXT,
  start_date     DATE,
  end_date       DATE,
  location       TEXT,
  status         TEXT NOT NULL DEFAULT 'completed',
  summary        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiqh_council_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_sessions_public_read ON fiqh_council_sessions;
CREATE POLICY fiqh_sessions_public_read ON fiqh_council_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS fiqh_sessions_admin ON fiqh_council_sessions;
CREATE POLICY fiqh_sessions_admin ON fiqh_council_sessions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_sources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  organization TEXT,
  official_url TEXT,
  logo_url     TEXT,
  country      TEXT,
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiqh_council_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_sources_public_read ON fiqh_council_sources;
CREATE POLICY fiqh_sources_public_read ON fiqh_council_sources FOR SELECT USING (active = true);
DROP POLICY IF EXISTS fiqh_sources_admin ON fiqh_council_sources;
CREATE POLICY fiqh_sources_admin ON fiqh_council_sources FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_issues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  category      TEXT,
  ruling_summary TEXT,
  summary       TEXT,
  status        TEXT NOT NULL DEFAULT 'published',
  priority_rank INTEGER DEFAULT 50,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiqh_issues_status ON fiqh_council_issues (status, priority_rank DESC);

ALTER TABLE fiqh_council_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_issues_public_read ON fiqh_council_issues;
CREATE POLICY fiqh_issues_public_read ON fiqh_council_issues FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS fiqh_issues_admin ON fiqh_council_issues;
CREATE POLICY fiqh_issues_admin ON fiqh_council_issues FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_relations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  related_id  UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'related',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id, related_id)
);

ALTER TABLE fiqh_council_relations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_relations_public ON fiqh_council_relations;
CREATE POLICY fiqh_relations_public ON fiqh_council_relations FOR SELECT USING (true);
DROP POLICY IF EXISTS fiqh_relations_service ON fiqh_council_relations;
CREATE POLICY fiqh_relations_service ON fiqh_council_relations FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_duplicates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       UUID REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  duplicate_of  UUID REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  similarity    NUMERIC(5,3),
  detection_method TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiqh_council_duplicates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_duplicates_admin ON fiqh_council_duplicates;
CREATE POLICY fiqh_duplicates_admin ON fiqh_council_duplicates FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_issue_items (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES fiqh_council_issues(id) ON DELETE CASCADE,
  item_id  UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  UNIQUE(issue_id, item_id)
);

ALTER TABLE fiqh_issue_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_issue_items_public ON fiqh_issue_items;
CREATE POLICY fiqh_issue_items_public ON fiqh_issue_items FOR SELECT USING (true);
DROP POLICY IF EXISTS fiqh_issue_items_service ON fiqh_issue_items;
CREATE POLICY fiqh_issue_items_service ON fiqh_issue_items FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_admin_alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity   TEXT NOT NULL DEFAULT 'info',
  title      TEXT NOT NULL,
  message    TEXT,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiqh_council_admin_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_admin_alerts_access ON fiqh_council_admin_alerts;
CREATE POLICY fiqh_admin_alerts_access ON fiqh_council_admin_alerts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_research_search_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query      TEXT NOT NULL,
  results    INTEGER DEFAULT 0,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiqh_research_search_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_search_logs_insert ON fiqh_research_search_logs;
CREATE POLICY fiqh_search_logs_insert ON fiqh_research_search_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS fiqh_search_logs_admin ON fiqh_research_search_logs;
CREATE POLICY fiqh_search_logs_admin ON fiqh_research_search_logs FOR SELECT USING (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_research_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiqh_research_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_research_settings_admin ON fiqh_research_settings;
CREATE POLICY fiqh_research_settings_admin ON fiqh_research_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_research_unanswered (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query      TEXT NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved   BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiqh_research_unanswered ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_unanswered_insert ON fiqh_research_unanswered;
CREATE POLICY fiqh_unanswered_insert ON fiqh_research_unanswered FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS fiqh_unanswered_admin ON fiqh_research_unanswered;
CREATE POLICY fiqh_unanswered_admin ON fiqh_research_unanswered FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_review_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID REFERENCES fiqh_council_items(id) ON DELETE SET NULL,
  reviewer   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiqh_review_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_review_logs_service ON fiqh_review_logs;
CREATE POLICY fiqh_review_logs_service ON fiqh_review_logs FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_sync_jobs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  payload    JSONB DEFAULT '{}',
  result     JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiqh_council_sync_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_sync_jobs_service ON fiqh_council_sync_jobs;
CREATE POLICY fiqh_sync_jobs_service ON fiqh_council_sync_jobs FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_sync_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID REFERENCES fiqh_council_sync_jobs(id) ON DELETE SET NULL,
  level      TEXT NOT NULL DEFAULT 'info',
  message    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiqh_council_sync_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_sync_logs_service ON fiqh_council_sync_logs;
CREATE POLICY fiqh_sync_logs_service ON fiqh_council_sync_logs FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ════════════════════════════════════════════════════════════════════
--  17. خط أنابيب المحتوى التلقائي
--      trusted_sources · auto_imported_content · auto_import_logs
--      auto_import_runs · auto_publish_queue · transcriptions
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trusted_sources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  source_type  TEXT NOT NULL DEFAULT 'rss',
  url          TEXT NOT NULL,
  category     TEXT,
  trust_level  INTEGER DEFAULT 80,
  is_active    BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(url)
);

ALTER TABLE trusted_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trusted_sources_public_read ON trusted_sources;
CREATE POLICY trusted_sources_public_read ON trusted_sources FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS trusted_sources_admin ON trusted_sources;
CREATE POLICY trusted_sources_admin ON trusted_sources FOR ALL USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO trusted_sources (name, source_type, url, category, trust_level)
VALUES
  ('الأكاديمية الإسلامية للفقه (OIC-IIFA)', 'rss', 'https://www.iifa-aifi.org/ar/feed', 'قرارات', 95),
  ('IslamWeb — الأخبار', 'rss', 'https://www.islamweb.net/ar/rss/news', 'أخبار', 90)
ON CONFLICT (url) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_imported_content (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key        TEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL,
  content_type        TEXT NOT NULL,
  category            TEXT,
  summary             TEXT,
  content             TEXT,
  source_name         TEXT NOT NULL,
  source_url          TEXT NOT NULL,
  original_url        TEXT,
  tags                TEXT[] DEFAULT '{}',
  verification_status TEXT DEFAULT 'needs_review',
  status              TEXT DEFAULT 'needs_review',
  quality_score       INTEGER DEFAULT 0,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_content_status ON auto_imported_content (status);
CREATE INDEX IF NOT EXISTS idx_auto_content_type ON auto_imported_content (content_type);
CREATE INDEX IF NOT EXISTS idx_auto_content_verification ON auto_imported_content (verification_status);

ALTER TABLE auto_imported_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auto_content_public_read ON auto_imported_content;
CREATE POLICY auto_content_public_read ON auto_imported_content FOR SELECT USING (status = 'published' AND verification_status = 'verified');
DROP POLICY IF EXISTS auto_content_service ON auto_imported_content;
CREATE POLICY auto_content_service ON auto_imported_content FOR ALL USING (auth.role() = 'service_role' OR is_admin()) WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_import_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      UUID REFERENCES trusted_sources(id) ON DELETE SET NULL,
  status         TEXT NOT NULL,
  message        TEXT,
  imported_count INTEGER DEFAULT 0,
  skipped_count  INTEGER DEFAULT 0,
  failed_count   INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE auto_import_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auto_import_logs_service ON auto_import_logs;
CREATE POLICY auto_import_logs_service ON auto_import_logs FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_import_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status         TEXT NOT NULL DEFAULT 'running',
  items_imported INTEGER DEFAULT 0,
  items_skipped  INTEGER DEFAULT 0,
  items_failed   INTEGER DEFAULT 0,
  duration_ms    INTEGER,
  metadata       JSONB DEFAULT '{}',
  started_at     TIMESTAMPTZ DEFAULT now(),
  finished_at    TIMESTAMPTZ
);

ALTER TABLE auto_import_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auto_import_runs_service ON auto_import_runs;
CREATE POLICY auto_import_runs_service ON auto_import_runs FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_publish_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id   UUID REFERENCES auto_imported_content(id) ON DELETE CASCADE,
  pipeline     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  attempts     INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE auto_publish_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auto_publish_queue_service ON auto_publish_queue;
CREATE POLICY auto_publish_queue_service ON auto_publish_queue FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transcriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id  UUID REFERENCES lessons(id) ON DELETE SET NULL,
  text       TEXT NOT NULL,
  language   TEXT DEFAULT 'ar',
  status     TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS transcriptions_service ON transcriptions;
CREATE POLICY transcriptions_service ON transcriptions FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ════════════════════════════════════════════════════════════════════
--  18. استيراد الدروس والأتمتة
--      trusted_lesson_sources · lesson_import_drafts
--      trusted_content_sources · automation_runs · automation_step_logs
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trusted_lesson_sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  platform              TEXT NOT NULL,
  url                   TEXT NOT NULL,
  source_type           TEXT NOT NULL DEFAULT 'website',
  trust_level           TEXT NOT NULL DEFAULT 'unknown',
  auto_publish_allowed  BOOLEAN NOT NULL DEFAULT false,
  country               TEXT DEFAULT 'الكويت',
  city                  TEXT,
  category              TEXT,
  active                BOOLEAN NOT NULL DEFAULT true,
  feed_url              TEXT,
  last_checked_at       TIMESTAMPTZ,
  last_success_at       TIMESTAMPTZ,
  failure_count         INTEGER NOT NULL DEFAULT 0,
  last_error            TEXT,
  config                JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(url)
);

CREATE INDEX IF NOT EXISTS trusted_lesson_sources_active_idx ON trusted_lesson_sources (active, trust_level);

ALTER TABLE trusted_lesson_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trusted_lesson_sources_admin_all ON trusted_lesson_sources;
CREATE POLICY trusted_lesson_sources_admin_all ON trusted_lesson_sources FOR ALL USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO trusted_lesson_sources (name, platform, url, source_type, trust_level, auto_publish_allowed, country, city, category, active)
VALUES
  ('وزارة الأوقاف — مساجد الكويت', 'website', 'https://www.awqaf.gov.kw', 'website', 'official', true, 'الكويت', 'العاصمة', 'دروس', false),
  ('جمعية إحياء التراث الإسلامي', 'website', 'https://www.iico.org', 'website', 'official', true, 'الكويت', 'العاصمة', 'دروس', false),
  ('دروس علمية — RSS تجريبي', 'rss', 'https://majlisilm.com/feed.xml', 'rss', 'trusted', true, 'الكويت', null, 'دروس', false)
ON CONFLICT (url) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_import_drafts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type         TEXT NOT NULL DEFAULT 'manual',
  source_url          TEXT,
  image_url           TEXT,
  extracted_text      TEXT,
  parsed_payload      JSONB NOT NULL DEFAULT '{}',
  confidence_score    NUMERIC(5, 3),
  status              TEXT NOT NULL DEFAULT 'draft',
  warnings            JSONB NOT NULL DEFAULT '[]',
  missing_fields      JSONB NOT NULL DEFAULT '[]',
  matched_sheikh_id   UUID REFERENCES sheikhs(id) ON DELETE SET NULL,
  suggested_sheikh    JSONB,
  notes               TEXT,
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_lesson_id  UUID REFERENCES lessons(id) ON DELETE SET NULL,
  source_id           UUID REFERENCES trusted_lesson_sources(id) ON DELETE SET NULL,
  automation_status   TEXT DEFAULT 'manual',
  decision_reason     TEXT,
  image_hash          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_import_drafts_status_idx ON lesson_import_drafts (status, created_at DESC);

ALTER TABLE lesson_import_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_import_drafts_admin_all ON lesson_import_drafts;
CREATE POLICY lesson_import_drafts_admin_all ON lesson_import_drafts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trusted_content_sources (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  source_type         TEXT NOT NULL DEFAULT 'website',
  platform            TEXT NOT NULL DEFAULT 'website',
  url                 TEXT NOT NULL,
  rss_url             TEXT,
  instagram_username  TEXT,
  youtube_channel_id  TEXT,
  telegram_channel    TEXT,
  website             TEXT,
  priority            INTEGER NOT NULL DEFAULT 5,
  trust_score         INTEGER NOT NULL DEFAULT 50,
  category            TEXT,
  country             TEXT DEFAULT 'الكويت',
  language            TEXT DEFAULT 'ar',
  active              BOOLEAN NOT NULL DEFAULT true,
  auto_publish_allowed BOOLEAN NOT NULL DEFAULT false,
  last_checked_at     TIMESTAMPTZ,
  last_success_at     TIMESTAMPTZ,
  failure_count       INTEGER NOT NULL DEFAULT 0,
  last_error          TEXT,
  config              JSONB NOT NULL DEFAULT '{}',
  last_seen_urls      JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(url)
);

CREATE INDEX IF NOT EXISTS trusted_content_sources_active_idx ON trusted_content_sources (active, priority DESC);

ALTER TABLE trusted_content_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trusted_content_sources_admin_all ON trusted_content_sources;
CREATE POLICY trusted_content_sources_admin_all ON trusted_content_sources FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type        TEXT NOT NULL DEFAULT 'source_monitor',
  source_id       UUID REFERENCES trusted_content_sources(id) ON DELETE SET NULL,
  items_scanned   INTEGER NOT NULL DEFAULT 0,
  items_new       INTEGER NOT NULL DEFAULT 0,
  items_duplicate INTEGER NOT NULL DEFAULT 0,
  items_skipped   INTEGER NOT NULL DEFAULT 0,
  items_errors    INTEGER NOT NULL DEFAULT 0,
  duration_ms     INTEGER,
  status          TEXT NOT NULL DEFAULT 'completed',
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS automation_runs_started_idx ON automation_runs (started_at DESC);

ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS automation_runs_admin_all ON automation_runs;
CREATE POLICY automation_runs_admin_all ON automation_runs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_step_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID REFERENCES automation_runs(id) ON DELETE SET NULL,
  source_id   UUID,
  draft_id    UUID,
  lesson_id   UUID,
  step        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'ok',
  detail      TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_step_logs_run_idx ON automation_step_logs (run_id, created_at DESC);

ALTER TABLE automation_step_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS automation_step_logs_admin ON automation_step_logs;
CREATE POLICY automation_step_logs_admin ON automation_step_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ════════════════════════════════════════════════════════════════════
--  19. منصة التعلم الرقمي
--      learning_paths · learning_modules · user enrollments · quizzes
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS learning_paths (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  title_en        text,
  description     text,
  level           text NOT NULL DEFAULT 'beginner',
  category        text,
  icon            text,
  sort_order      int DEFAULT 0,
  status          text NOT NULL DEFAULT 'published',
  estimated_hours int DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_modules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id      uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  sort_order   int NOT NULL DEFAULT 0,
  title        text NOT NULL,
  description  text,
  module_type  text NOT NULL DEFAULT 'lesson',
  content_kind text,
  content_id   text,
  content_url  text,
  duration_minutes int DEFAULT 0,
  is_required  boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_modules_path ON learning_modules (path_id, sort_order);

CREATE TABLE IF NOT EXISTS user_path_enrollments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id      uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  enrolled_at  timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress_pct numeric(5,2) DEFAULT 0,
  last_module_id uuid REFERENCES learning_modules(id),
  UNIQUE(user_id, path_id)
);

CREATE TABLE IF NOT EXISTS user_module_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id    uuid NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  path_id      uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'not_started',
  progress_pct numeric(5,2) DEFAULT 0,
  last_seen_at timestamptz,
  completed_at timestamptz,
  notes        text,
  UNIQUE(user_id, module_id)
);

CREATE TABLE IF NOT EXISTS learning_quizzes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id     uuid REFERENCES learning_paths(id) ON DELETE SET NULL,
  module_id   uuid REFERENCES learning_modules(id) ON DELETE SET NULL,
  title       text NOT NULL,
  description text,
  section     text,
  level       text DEFAULT 'beginner',
  passing_score int DEFAULT 70,
  time_limit_minutes int,
  status      text DEFAULT 'published',
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_quiz_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       uuid NOT NULL REFERENCES learning_quizzes(id) ON DELETE CASCADE,
  sort_order    int DEFAULT 0,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  question      text NOT NULL,
  options       jsonb,
  correct_answer jsonb NOT NULL,
  explanation   text,
  reference_source text,
  reference_url text,
  points        int DEFAULT 1,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_quiz_attempts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id       uuid NOT NULL REFERENCES learning_quizzes(id) ON DELETE CASCADE,
  score         numeric(5,2) NOT NULL,
  total_points  int NOT NULL,
  earned_points int NOT NULL,
  passed        boolean DEFAULT false,
  answers       jsonb,
  error_analysis jsonb,
  started_at    timestamptz DEFAULT now(),
  completed_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_certificates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id          uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  certificate_code text UNIQUE NOT NULL,
  title            text NOT NULL,
  score_pct        numeric(5,2),
  issued_at        timestamptz DEFAULT now(),
  qr_data          text,
  metadata         jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_certificates_code ON learning_certificates (certificate_code);

CREATE TABLE IF NOT EXISTS learning_calendar_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  event_type  text NOT NULL,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz,
  location    text,
  content_url text,
  is_public   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_path_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS learning_paths_public_read ON learning_paths;
CREATE POLICY learning_paths_public_read ON learning_paths FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS learning_modules_public_read ON learning_modules;
CREATE POLICY learning_modules_public_read ON learning_modules FOR SELECT USING (true);
DROP POLICY IF EXISTS learning_quizzes_public_read ON learning_quizzes;
CREATE POLICY learning_quizzes_public_read ON learning_quizzes FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS learning_quiz_questions_public_read ON learning_quiz_questions;
CREATE POLICY learning_quiz_questions_public_read ON learning_quiz_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS learning_calendar_public_read ON learning_calendar_events;
CREATE POLICY learning_calendar_public_read ON learning_calendar_events FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS learning_certificates_verify ON learning_certificates;
CREATE POLICY learning_certificates_verify ON learning_certificates FOR SELECT USING (true);
DROP POLICY IF EXISTS user_enrollments_own ON user_path_enrollments;
CREATE POLICY user_enrollments_own ON user_path_enrollments FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_progress_own ON user_module_progress;
CREATE POLICY user_progress_own ON user_module_progress FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_quiz_attempts_own ON learning_quiz_attempts;
CREATE POLICY user_quiz_attempts_own ON learning_quiz_attempts FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_certificates_own ON learning_certificates;
CREATE POLICY user_certificates_own ON learning_certificates FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON learning_paths TO authenticated, anon;
GRANT SELECT ON learning_modules TO authenticated, anon;
GRANT SELECT ON learning_quizzes TO authenticated, anon;
GRANT SELECT ON learning_quiz_questions TO authenticated, anon;
GRANT SELECT ON learning_calendar_events TO authenticated, anon;
GRANT SELECT ON learning_certificates TO authenticated, anon;

INSERT INTO learning_paths (slug, title, title_en, description, level, category, sort_order, estimated_hours) VALUES
  ('aqeedah', 'العقيدة', 'Aqeedah', 'مسار شامل في العقيدة الإسلامية الصحيحة', 'beginner', 'aqeedah', 1, 40),
  ('tawheed', 'التوحيد', 'Tawheed', 'دراسة التوحيد وإقامة الدليل عليه', 'beginner', 'aqeedah', 2, 30),
  ('hadith', 'الحديث', 'Hadith', 'علم الحديث النبوي ودراسة الأحاديث', 'intermediate', 'hadith', 3, 50),
  ('fiqh', 'الفقه', 'Fiqh', 'أصول الأحكام الشرعية العملية', 'beginner', 'fiqh', 4, 60),
  ('usool-fiqh', 'أصول الفقه', 'Principles of Fiqh', 'قواعد استنباط الأحكام', 'advanced', 'fiqh', 5, 45),
  ('tafseer', 'التفسير', 'Tafseer', 'تفسير كتاب الله تعالى', 'intermediate', 'quran', 6, 55),
  ('seerah', 'السيرة', 'Seerah', 'سيرة النبي ﷺ وتاريخ الدعوة', 'beginner', 'seerah', 7, 35),
  ('arabic', 'اللغة العربية', 'Arabic Language', 'أساسيات اللغة العربية للطالب العلمي', 'beginner', 'language', 8, 40),
  ('nahw', 'النحو', 'Arabic Grammar', 'قواعد النحو العربي', 'intermediate', 'language', 9, 45)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  updated_at = now();

-- ════════════════════════════════════════════════════════════════════
--  20. محرك المعرفة (MKE)
--      mke_source_plugins · mke_runs · mke_decisions · mke_queue_jobs
--      mke_quality_reports
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mke_source_plugins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'website',
  platform    TEXT NOT NULL DEFAULT 'website',
  source_url  TEXT NOT NULL,
  trust_score INTEGER NOT NULL DEFAULT 70,
  auto_publish BOOLEAN NOT NULL DEFAULT false,
  active      BOOLEAN NOT NULL DEFAULT true,
  country     TEXT DEFAULT 'الكويت',
  city        TEXT,
  priority    INTEGER NOT NULL DEFAULT 5,
  config      JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_url)
);

CREATE INDEX IF NOT EXISTS mke_source_plugins_active_idx ON mke_source_plugins (active, priority DESC);

ALTER TABLE mke_source_plugins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mke_source_plugins_admin ON mke_source_plugins;
CREATE POLICY mke_source_plugins_admin ON mke_source_plugins FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mke_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type     TEXT NOT NULL DEFAULT 'cron',
  mode             TEXT NOT NULL DEFAULT 'full',
  status           TEXT NOT NULL DEFAULT 'running',
  sources_scanned  INTEGER NOT NULL DEFAULT 0,
  items_discovered INTEGER NOT NULL DEFAULT 0,
  items_analyzed   INTEGER NOT NULL DEFAULT 0,
  items_published  INTEGER NOT NULL DEFAULT 0,
  items_pending    INTEGER NOT NULL DEFAULT 0,
  items_duplicate  INTEGER NOT NULL DEFAULT 0,
  items_rejected   INTEGER NOT NULL DEFAULT 0,
  items_updated    INTEGER NOT NULL DEFAULT 0,
  items_expired    INTEGER NOT NULL DEFAULT 0,
  errors           INTEGER NOT NULL DEFAULT 0,
  duration_ms      INTEGER,
  metadata         JSONB NOT NULL DEFAULT '{}',
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS mke_runs_started_idx ON mke_runs (started_at DESC);

ALTER TABLE mke_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mke_admin_all ON mke_runs;
CREATE POLICY mke_admin_all ON mke_runs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mke_decisions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        UUID,
  source_url       TEXT,
  draft_id         UUID,
  lesson_id        UUID,
  decision         TEXT NOT NULL,
  confidence_score NUMERIC(5, 3),
  reasons          JSONB NOT NULL DEFAULT '[]',
  checks           JSONB NOT NULL DEFAULT '{}',
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_decisions_decision_idx ON mke_decisions (decision, created_at DESC);

ALTER TABLE mke_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mke_decisions_admin ON mke_decisions;
CREATE POLICY mke_decisions_admin ON mke_decisions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mke_queue_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type    TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  priority    INTEGER NOT NULL DEFAULT 5,
  status      TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error  TEXT,
  result      JSONB,
  next_run_at TIMESTAMPTZ,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_queue_jobs_status_idx ON mke_queue_jobs (status, next_run_at);

ALTER TABLE mke_queue_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mke_queue_admin ON mke_queue_jobs;
CREATE POLICY mke_queue_admin ON mke_queue_jobs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mke_quality_reports (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID,
  source_url TEXT,
  draft_id  UUID,
  lesson_id UUID,
  verdict   TEXT NOT NULL,
  blockers  JSONB NOT NULL DEFAULT '[]',
  warnings  JSONB NOT NULL DEFAULT '[]',
  checks    JSONB NOT NULL DEFAULT '{}',
  report    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_quality_reports_verdict_idx ON mke_quality_reports (verdict, created_at DESC);

ALTER TABLE mke_quality_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mke_quality_admin ON mke_quality_reports;
CREATE POLICY mke_quality_admin ON mke_quality_reports FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ════════════════════════════════════════════════════════════════════
--  21. جداول إنتاج المحتوى
--      content_import_jobs · content_import_staging
--      content_pipeline_sources · content_scheduler_jobs · content_scheduler_runs
--      content_production_staging · content_production_review_queue
--      content_production_retry_queue · content_production_dead_letter
--      content_production_logs · content_production_health · content_production_alerts
--      sharia_ruling_categories
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_import_jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  phase            TEXT NOT NULL DEFAULT 'pending',
  filename         TEXT,
  total_rows       INT NOT NULL DEFAULT 0,
  processed_rows   INT NOT NULL DEFAULT 0,
  imported         INT NOT NULL DEFAULT 0,
  skipped          INT NOT NULL DEFAULT 0,
  failed           INT NOT NULL DEFAULT 0,
  progress_pct     REAL NOT NULL DEFAULT 0,
  validation_errors JSONB NOT NULL DEFAULT '[]',
  import_errors    JSONB NOT NULL DEFAULT '[]',
  report           JSONB,
  timings          JSONB,
  execution_mode   TEXT,
  created_by       UUID,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_import_jobs_status ON content_import_jobs (status);
CREATE INDEX IF NOT EXISTS idx_content_import_jobs_started ON content_import_jobs (started_at DESC);

ALTER TABLE content_import_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_import_jobs_admin ON content_import_jobs;
CREATE POLICY content_import_jobs_admin ON content_import_jobs FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_import_staging (
  job_id    UUID NOT NULL REFERENCES content_import_jobs(id) ON DELETE CASCADE,
  row_index INT NOT NULL,
  payload   JSONB NOT NULL,
  PRIMARY KEY (job_id, row_index)
);

CREATE INDEX IF NOT EXISTS idx_content_import_staging_job ON content_import_staging (job_id);

ALTER TABLE content_import_staging ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_import_staging_admin ON content_import_staging;
CREATE POLICY content_import_staging_admin ON content_import_staging FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_pipeline_sources (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text UNIQUE NOT NULL,
  name           text NOT NULL,
  source_type    text NOT NULL,
  url            text,
  pipeline       text NOT NULL,
  active         boolean NOT NULL DEFAULT true,
  trust_level    smallint NOT NULL DEFAULT 85,
  cursor         jsonb NOT NULL DEFAULT '{}',
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error     text,
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_pipeline_sources_pipeline ON content_pipeline_sources (pipeline, active);

ALTER TABLE content_pipeline_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_pipeline_sources_admin ON content_pipeline_sources;
CREATE POLICY content_pipeline_sources_admin ON content_pipeline_sources FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_scheduler_jobs (
  id            text PRIMARY KEY,
  name_ar       text NOT NULL,
  interval_label text NOT NULL,
  cron_expr     text NOT NULL,
  enabled       boolean NOT NULL DEFAULT true,
  last_run_at   timestamptz,
  last_success_at timestamptz,
  last_duration_ms int,
  last_status   text,
  config        jsonb NOT NULL DEFAULT '{}',
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content_scheduler_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_scheduler_jobs_admin ON content_scheduler_jobs;
CREATE POLICY content_scheduler_jobs_admin ON content_scheduler_jobs FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_scheduler_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         text NOT NULL REFERENCES content_scheduler_jobs(id),
  status         text NOT NULL DEFAULT 'running',
  started_at     timestamptz NOT NULL DEFAULT now(),
  finished_at    timestamptz,
  duration_ms    int,
  items_processed int NOT NULL DEFAULT 0,
  items_published int NOT NULL DEFAULT 0,
  items_rejected  int NOT NULL DEFAULT 0,
  items_duplicate int NOT NULL DEFAULT 0,
  error_message  text,
  report         jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_content_scheduler_runs_job ON content_scheduler_runs (job_id, started_at DESC);

ALTER TABLE content_scheduler_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_scheduler_runs_admin ON content_scheduler_runs;
CREATE POLICY content_scheduler_runs_admin ON content_scheduler_runs FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_staging (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline        text NOT NULL,
  source_slug     text,
  source_url      text NOT NULL,
  external_key    text,
  title           text,
  body            text NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}',
  content_hash    text NOT NULL,
  title_hash      text,
  status          text NOT NULL DEFAULT 'pending',
  validation_errors jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pipeline, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_content_staging_pipeline_status ON content_production_staging (pipeline, status, created_at);

ALTER TABLE content_production_staging ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_production_staging_admin ON content_production_staging;
CREATE POLICY content_production_staging_admin ON content_production_staging FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_review_queue (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staging_id     uuid REFERENCES content_production_staging(id) ON DELETE SET NULL,
  pipeline       text NOT NULL,
  failure_stage  text NOT NULL,
  failure_reasons jsonb NOT NULL DEFAULT '[]',
  payload        jsonb NOT NULL DEFAULT '{}',
  status         text NOT NULL DEFAULT 'pending',
  reviewed_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_review_status ON content_production_review_queue (status, created_at DESC);

ALTER TABLE content_production_review_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_production_review_admin ON content_production_review_queue;
CREATE POLICY content_production_review_admin ON content_production_review_queue FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_retry_queue (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline     text,
  job_id       text,
  payload      jsonb NOT NULL DEFAULT '{}',
  attempts     int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  last_error   text,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  status       text NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_retry_status ON content_production_retry_queue (status, next_retry_at);

ALTER TABLE content_production_retry_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_production_retry_admin ON content_production_retry_queue;
CREATE POLICY content_production_retry_admin ON content_production_retry_queue FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_dead_letter (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline   text,
  job_id     text,
  payload    jsonb NOT NULL DEFAULT '{}',
  error      text NOT NULL,
  attempts   int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_dlq_created ON content_production_dead_letter (created_at DESC);

ALTER TABLE content_production_dead_letter ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_production_dlq_admin ON content_production_dead_letter;
CREATE POLICY content_production_dlq_admin ON content_production_dead_letter FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id     uuid REFERENCES content_scheduler_runs(id) ON DELETE SET NULL,
  pipeline   text,
  stage      text NOT NULL,
  level      text NOT NULL DEFAULT 'info',
  message    text NOT NULL,
  metadata   jsonb NOT NULL DEFAULT '{}',
  duration_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_logs_run ON content_production_logs (run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_content_logs_level ON content_production_logs (level, created_at DESC);

ALTER TABLE content_production_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_production_logs_admin ON content_production_logs;
CREATE POLICY content_production_logs_admin ON content_production_logs FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_health (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL,
  status     text NOT NULL,
  details    jsonb NOT NULL DEFAULT '{}',
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_health_name ON content_production_health (check_name, checked_at DESC);

ALTER TABLE content_production_health ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_production_health_admin ON content_production_health;
CREATE POLICY content_production_health_admin ON content_production_health FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_alerts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity     text NOT NULL,
  title        text NOT NULL,
  message      text NOT NULL,
  pipeline     text,
  acknowledged boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_alerts_open ON content_production_alerts (acknowledged, created_at DESC);

ALTER TABLE content_production_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_production_alerts_admin ON content_production_alerts;
CREATE POLICY content_production_alerts_admin ON content_production_alerts FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sharia_ruling_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  parent_slug  TEXT,
  icon         TEXT,
  sort_order   INT NOT NULL DEFAULT 0,
  ruling_count INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sharia_ruling_categories_parent_idx ON sharia_ruling_categories (parent_slug);

ALTER TABLE sharia_ruling_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sharia_ruling_categories_public ON sharia_ruling_categories;
CREATE POLICY sharia_ruling_categories_public ON sharia_ruling_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS sharia_ruling_categories_admin ON sharia_ruling_categories;
CREATE POLICY sharia_ruling_categories_admin ON sharia_ruling_categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ════════════════════════════════════════════════════════════════════
--  21b. جداول المجمع الفقهي الإضافية
--       fiqh_council_decisions · fiqh_council_audit
--       fiqh_council_suggested_relations · fiqh_issue_timeline_events
--       fiqh_link_checks
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fiqh_council_decisions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  slug           TEXT UNIQUE,
  type           TEXT NOT NULL DEFAULT 'resolution',
  category       TEXT NOT NULL DEFAULT 'العبادات',
  subcategory    TEXT,
  summary        TEXT,
  content        TEXT,
  source_name    TEXT,
  source_url     TEXT,
  council_name   TEXT,
  session_number TEXT,
  session_date   DATE,
  decision_number TEXT,
  tags           TEXT[] DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'published',
  views_count    INTEGER DEFAULT 0,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiqh_decisions_status ON fiqh_council_decisions (status);

ALTER TABLE fiqh_council_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_decisions_public_read ON fiqh_council_decisions;
CREATE POLICY fiqh_decisions_public_read ON fiqh_council_decisions FOR SELECT USING (status IN ('published', 'approved'));
DROP POLICY IF EXISTS fiqh_decisions_admin ON fiqh_council_decisions;
CREATE POLICY fiqh_decisions_admin ON fiqh_council_decisions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_audit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID REFERENCES fiqh_council_items(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  field       TEXT,
  old_value   TEXT,
  new_value   TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiqh_audit_item ON fiqh_council_audit (item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiqh_audit_created ON fiqh_council_audit (created_at DESC);

ALTER TABLE fiqh_council_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_audit_admin ON fiqh_council_audit;
CREATE POLICY fiqh_audit_admin ON fiqh_council_audit FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_suggested_relations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  suggested_id    UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  relation_type   TEXT NOT NULL DEFAULT 'related',
  confidence      NUMERIC(5,3),
  status          TEXT NOT NULL DEFAULT 'pending',
  approved_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id, suggested_id)
);

ALTER TABLE fiqh_council_suggested_relations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_suggested_service ON fiqh_council_suggested_relations;
CREATE POLICY fiqh_suggested_service ON fiqh_council_suggested_relations FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_issue_timeline_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    UUID NOT NULL REFERENCES fiqh_council_issues(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiqh_timeline_issue ON fiqh_issue_timeline_events (issue_id, event_date DESC);

ALTER TABLE fiqh_issue_timeline_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_timeline_public ON fiqh_issue_timeline_events;
CREATE POLICY fiqh_timeline_public ON fiqh_issue_timeline_events FOR SELECT USING (true);
DROP POLICY IF EXISTS fiqh_timeline_service ON fiqh_issue_timeline_events;
CREATE POLICY fiqh_timeline_service ON fiqh_issue_timeline_events FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_link_checks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID REFERENCES fiqh_council_items(id) ON DELETE SET NULL,
  url          TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'unchecked',
  http_code    INTEGER,
  redirect_url TEXT,
  checked_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiqh_link_checks_item ON fiqh_link_checks (item_id, checked_at DESC);

ALTER TABLE fiqh_link_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiqh_link_checks_service ON fiqh_link_checks;
CREATE POLICY fiqh_link_checks_service ON fiqh_link_checks FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ════════════════════════════════════════════════════════════════════
--  21c. محرك المعرفة التلقائي (AKE) + مسودات المحتوى
--       ake_connectors · ake_job_queue · content_drafts
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ake_connectors (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  name_en          TEXT,
  country          TEXT DEFAULT 'SA',
  entity_type      TEXT NOT NULL DEFAULT 'islamic_org',
  connector_type   TEXT NOT NULL DEFAULT 'rss',
  official_url     TEXT NOT NULL,
  feed_url         TEXT,
  api_config       JSONB NOT NULL DEFAULT '{}',
  trust_level      SMALLINT NOT NULL DEFAULT 3,
  allowed_kinds    TEXT[] NOT NULL DEFAULT ARRAY['article','news'],
  rate_limit_per_min INT NOT NULL DEFAULT 10,
  timeout_ms       INT NOT NULL DEFAULT 15000,
  max_retries      INT NOT NULL DEFAULT 3,
  crawl_interval_h INT NOT NULL DEFAULT 6,
  auto_publish     BOOLEAN NOT NULL DEFAULT true,
  min_quality_score SMALLINT NOT NULL DEFAULT 65,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  health_status    TEXT NOT NULL DEFAULT 'unknown',
  last_health_check TIMESTAMPTZ,
  last_sync_at     TIMESTAMPTZ,
  last_success_at  TIMESTAMPTZ,
  last_error       TEXT,
  items_total      INT NOT NULL DEFAULT 0,
  items_published  INT NOT NULL DEFAULT 0,
  broken_links     INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_connectors_active_idx ON ake_connectors (is_active, health_status);

ALTER TABLE ake_connectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ake_connectors_admin ON ake_connectors;
CREATE POLICY ake_connectors_admin ON ake_connectors FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_job_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID REFERENCES ake_connectors(id) ON DELETE SET NULL,
  job_type     TEXT NOT NULL DEFAULT 'sync',
  payload      JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending',
  priority     INT NOT NULL DEFAULT 5,
  attempts     INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ,
  last_error   TEXT,
  result       JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_queue_status_idx ON ake_job_queue (status, scheduled_at);

ALTER TABLE ake_job_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ake_job_queue_admin ON ake_job_queue;
CREATE POLICY ake_job_queue_admin ON ake_job_queue FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_drafts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  body        TEXT,
  content_type TEXT NOT NULL DEFAULT 'article',
  pipeline    TEXT,
  source_url  TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'draft',
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_drafts_status ON content_drafts (status, created_at DESC);

ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_drafts_admin ON content_drafts;
CREATE POLICY content_drafts_admin ON content_drafts FOR ALL USING (auth.role() = 'service_role' OR is_admin());

-- ════════════════════════════════════════════════════════════════════
--  22b. جداول المحتوى الإضافية (activation probe + knowledge graph)
-- ════════════════════════════════════════════════════════════════════

-- content_dedup_registry — required by ACTIVATION_TABLES probe
CREATE TABLE IF NOT EXISTS content_dedup_registry (
  id              BIGSERIAL PRIMARY KEY,
  content_hash    TEXT NOT NULL UNIQUE,
  source_table    TEXT,
  source_id       TEXT,
  title           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE content_dedup_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_dedup_registry_service ON content_dedup_registry;
CREATE POLICY content_dedup_registry_service ON content_dedup_registry FOR ALL USING (auth.role() = 'service_role');

-- content_production_published — required by ACTIVATION_TABLES probe
CREATE TABLE IF NOT EXISTS content_production_published (
  id              BIGSERIAL PRIMARY KEY,
  staging_id      BIGINT,
  title           TEXT,
  content_type    TEXT,
  publish_target  TEXT,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata        JSONB DEFAULT '{}'
);
ALTER TABLE content_production_published ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cpp_anon ON content_production_published;
CREATE POLICY cpp_anon ON content_production_published FOR SELECT USING (true);

-- kg_nodes — knowledge graph nodes (OPTIONAL_DB_TABLES)
CREATE TABLE IF NOT EXISTS kg_nodes (
  id          BIGSERIAL PRIMARY KEY,
  node_type   TEXT NOT NULL,
  label       TEXT NOT NULL,
  slug        TEXT UNIQUE,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE kg_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kg_nodes_anon ON kg_nodes;
CREATE POLICY kg_nodes_anon ON kg_nodes FOR SELECT USING (true);

-- kg_edges — knowledge graph edges (OPTIONAL_DB_TABLES)
CREATE TABLE IF NOT EXISTS kg_edges (
  id            BIGSERIAL PRIMARY KEY,
  from_node_id  BIGINT NOT NULL REFERENCES kg_nodes (id) ON DELETE CASCADE,
  to_node_id    BIGINT NOT NULL REFERENCES kg_nodes (id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  weight        NUMERIC DEFAULT 1.0,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_node_id, to_node_id, relation_type)
);
ALTER TABLE kg_edges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kg_edges_anon ON kg_edges;
CREATE POLICY kg_edges_anon ON kg_edges FOR SELECT USING (true);

-- notifications — user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT,
  type        TEXT DEFAULT 'info',
  is_read     BOOLEAN NOT NULL DEFAULT false,
  action_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_own ON notifications;
CREATE POLICY notifications_own ON notifications USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════
--  22. ترقية مالك المنصة إلى super_admin
--      (سيُرجع خطأ "user_not_found" إذا لم يسجّل المستخدم بعد — طبيعي)
-- ════════════════════════════════════════════════════════════════════

SELECT promote_bootstrap_owner('yalabdullmohsen1@gmail.com');

-- ════════════════════════════════════════════════════════════════════
--  اكتمل الإعداد ✓
--  الجداول المُنشأة:
--    ── المحتوى الأساسي ──────────────────────────────────────────
--    • sheikhs              → العلماء والمشايخ
--    • lessons              → الدروس العلمية
--    • library_items        → المكتبة الإسلامية
--    • fatwas               → الفتاوى
--    • fawaid               → الفوائد العلمية
--    • scientific_miracles  → الإعجاز العلمي
--    • annual_courses       → الدورات السنوية
--    • platform_updates     → تحديثات المنصة
--    • quiz_questions       → أسئلة الاختبار
--    ── بيانات المستخدم ─────────────────────────────────────────
--    • bookmarks            → المفضلة
--    • achievements         → الإنجازات
--    • lesson_registrations → التسجيل في الدروس
--    • content_views        → مشاهدات المحتوى
--    ── البنية التحتية ──────────────────────────────────────────
--    • prayer_times         → أوقات الصلاة
--    • islamic_occasions_cache → المناسبات الإسلامية
--    • search_queries       → تحليلات البحث
--    • error_reports        → تقارير الأخطاء
--    • platform_bootstrap_runs → سجل التهيئة
--    ── المجمع الفقهي ───────────────────────────────────────────
--    • fiqh_council_items   → قرارات وفتاوى المجمع
--    • fiqh_council_sessions → جلسات المجمع
--    • fiqh_council_sources → المصادر الرسمية
--    • fiqh_council_issues  → المسائل الفقهية
--    • fiqh_council_relations → العلاقات بين العناصر
--    ── خط الأنابيب التلقائي ────────────────────────────────────
--    • trusted_sources      → المصادر الموثوقة
--    • auto_imported_content → المحتوى المستورد
--    • auto_import_logs     → سجلات الاستيراد
--    ── التعلم الرقمي ───────────────────────────────────────────
--    • learning_paths       → مسارات التعلم
--    • learning_modules     → وحدات التعلم
--    • learning_certificates → الشهادات
--    ── استيراد الدروس ─────────────────────────────────────────
--    • trusted_lesson_sources → مصادر الدروس
--    • lesson_import_drafts → مسودات الاستيراد
--    • automation_runs      → تشغيلات الأتمتة
--    ── محرك المعرفة ────────────────────────────────────────────
--    • mke_source_plugins   → مصادر محرك المعرفة
--    • mke_runs             → تشغيلات المحرك
--    • mke_decisions        → قرارات الذكاء الاصطناعي
--    • mke_queue_jobs       → قائمة انتظار المهام
--    • mke_quality_reports  → تقارير الجودة
--    ── إنتاج المحتوى ───────────────────────────────────────────
--    • content_import_jobs  → مهام الاستيراد
--    • content_scheduler_jobs → جدولة المهام
--    • content_production_staging → طابور التحضير
--    • sharia_ruling_categories → تصنيفات الأحكام
--    ── الأصل ───────────────────────────────────────────────────
--    • qa_categories        → صفحة /qa
--    • qa_questions         → صفحة /qa
--    • sharia_rulings       → صفحة /rulings
--    • akp_stories          → صفحة /stories
--    • verified_hadith_items → صفحة /hadith
--    • submissions          → صفحة /submit
--    • governance_user_roles → نظام الأدوار
--    • is_admin()           → سياسات RLS
-- ════════════════════════════════════════════════════════════════════
