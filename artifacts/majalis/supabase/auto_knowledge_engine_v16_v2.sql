-- =====================================================================
--  Auto Knowledge Engine v16 — Multi-Source v2.0
--  Plugin connectors · unified dedup · entity graph · lifecycle
--  Run after: auto_knowledge_engine_v15_realtime.sql
-- =====================================================================

-- Extend connector types (drop/recreate check for idempotency)
ALTER TABLE ake_connectors DROP CONSTRAINT IF EXISTS ake_connectors_connector_type_check;
ALTER TABLE ake_connectors ADD CONSTRAINT ake_connectors_connector_type_check
  CHECK (connector_type IN (
    'rss', 'manifest', 'api', 'seed', 'html', 'inactive',
    'sitemap', 'website', 'instagram', 'youtube', 'telegram',
    'whatsapp', 'x', 'facebook'
  ));

-- v2 connector metadata
ALTER TABLE ake_connectors
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS handle TEXT,
  ADD COLUMN IF NOT EXISTS source_priority SMALLINT NOT NULL DEFAULT 5 CHECK (source_priority BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS plugin_id TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'KW',
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS ake_connectors_platform_idx ON ake_connectors(platform, is_active);
CREATE INDEX IF NOT EXISTS ake_connectors_handle_idx ON ake_connectors(handle) WHERE handle IS NOT NULL;

-- Global settings (cron interval configurable from dashboard)
CREATE TABLE IF NOT EXISTS ake_v2_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  cron_interval_minutes INT NOT NULL DEFAULT 15,
  max_parallel_workers INT NOT NULL DEFAULT 4,
  default_poll_minutes INT NOT NULL DEFAULT 15,
  enable_unified_dedup BOOLEAN NOT NULL DEFAULT true,
  enable_entity_linking BOOLEAN NOT NULL DEFAULT true,
  enable_lifecycle_updates BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO ake_v2_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- Plugin registry (DB-driven — add connector without code change when plugin exists)
CREATE TABLE IF NOT EXISTS ake_connector_plugins (
  id TEXT PRIMARY KEY,
  label_ar TEXT NOT NULL,
  connector_type TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  enabled BOOLEAN NOT NULL DEFAULT true,
  config_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO ake_connector_plugins (id, label_ar, connector_type) VALUES
  ('rss', 'RSS Feed', 'rss'),
  ('manifest', 'JSON Manifest', 'manifest'),
  ('seed', 'Seed Crawler', 'seed'),
  ('html', 'HTML Parser', 'html'),
  ('sitemap', 'Sitemap Discovery', 'sitemap'),
  ('website', 'Website Hybrid', 'website'),
  ('instagram', 'Instagram', 'instagram'),
  ('youtube', 'YouTube', 'youtube'),
  ('telegram', 'Telegram', 'telegram'),
  ('whatsapp', 'WhatsApp Channel', 'whatsapp'),
  ('x', 'X (Twitter)', 'x'),
  ('facebook', 'Facebook', 'facebook')
ON CONFLICT (id) DO NOTHING;

-- Unified cross-source fingerprints (dedup across connectors)
CREATE TABLE IF NOT EXISTS ake_unified_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL UNIQUE,
  canonical_url TEXT,
  title_normalized TEXT,
  content_hash TEXT,
  knowledge_item_id UUID,
  lesson_id UUID,
  primary_source_slug TEXT,
  source_priority SMALLINT NOT NULL DEFAULT 5,
  source_count INT NOT NULL DEFAULT 1,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_unified_fp_url_idx ON ake_unified_fingerprints(canonical_url);
CREATE INDEX IF NOT EXISTS ake_unified_fp_hash_idx ON ake_unified_fingerprints(content_hash);

-- Multi-source attribution on knowledge items
CREATE TABLE IF NOT EXISTS ake_content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID NOT NULL,
  connector_slug TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_priority SMALLINT NOT NULL DEFAULT 5,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (knowledge_item_id, connector_slug, source_url)
);

CREATE INDEX IF NOT EXISTS ake_content_sources_item_idx ON ake_content_sources(knowledge_item_id);

-- Entity graph links (sheikh, mosque, course, lesson)
CREATE TABLE IF NOT EXISTS ake_entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID,
  lesson_id UUID,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'sheikh', 'mosque', 'course', 'lesson', 'book', 'series', 'fatwa', 'event'
  )),
  entity_id UUID,
  entity_name TEXT,
  confidence NUMERIC(5,3),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_entity_links_item_idx ON ake_entity_links(knowledge_item_id);
CREATE INDEX IF NOT EXISTS ake_entity_links_entity_idx ON ake_entity_links(entity_type, entity_id);

-- Content lifecycle (update / cancel / archive)
CREATE TABLE IF NOT EXISTS ake_content_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID,
  lesson_id UUID,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'created', 'updated', 'cancelled', 'expired', 'archived', 'restored'
  )),
  field_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_slug TEXT,
  source_url TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS ake_content_changes_item_idx ON ake_content_changes(knowledge_item_id, detected_at DESC);

-- Extend knowledge_items for v2 lifecycle
ALTER TABLE knowledge_items
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'active'
    CHECK (lifecycle_status IN ('active', 'cancelled', 'expired', 'archived')),
  ADD COLUMN IF NOT EXISTS unified_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS source_attributions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS knowledge_items_fingerprint_idx
  ON knowledge_items(unified_fingerprint) WHERE unified_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS knowledge_items_lifecycle_idx
  ON knowledge_items(lifecycle_status, publish_status);

-- ── Seed Kuwait Instagram connectors (independent, plugin-based) ─────────
-- source_priority: 1=official website, 2=scholar, 3=mosque, 4=course, 5= ministry, 6=association, 7=aggregator

INSERT INTO ake_connectors (
  slug, name, country, entity_type, connector_type, platform, handle,
  official_url, trust_level, allowed_kinds, source_priority, poll_interval_minutes,
  auto_publish, is_active, api_config, plugin_id
) VALUES
  ('ig-drooss-kw', 'دروس شرعية الكويت', 'KW', 'lesson_aggregator', 'instagram', 'instagram', 'drooss_kw',
   'https://instagram.com/drooss_kw', 4, ARRAY['lesson','announcement'], 7, 15, false, true,
   '{"handle":"drooss_kw","source_subtype":"lesson_aggregator"}'::jsonb, 'instagram'),
  ('ig-othmanalkamees', 'د. عثمان الخميس', 'KW', 'scholar', 'instagram', 'instagram', 'othmanalkamees',
   'https://instagram.com/othmanalkamees', 5, ARRAY['lesson','announcement'], 2, 15, false, true,
   '{"handle":"othmanalkamees","website_url":"https://www.othmanalkamees.com","source_subtype":"scholar_official"}'::jsonb, 'instagram'),
  ('ig-ibnabitallib', 'دورة الخليفة الراشد', 'KW', 'course', 'instagram', 'instagram', 'ibnabitallib',
   'https://instagram.com/ibnabitallib', 4, ARRAY['lesson','course','announcement'], 4, 15, false, true,
   '{"handle":"ibnabitallib","source_subtype":"course_account"}'::jsonb, 'instagram'),
  ('ig-masjedalmehry', 'مسجد عائشة المحري', 'KW', 'mosque', 'instagram', 'instagram', 'masjedalmehry',
   'https://instagram.com/masjedalmehry', 4, ARRAY['lesson','announcement'], 3, 15, false, true,
   '{"handle":"masjedalmehry","source_subtype":"mosque_official"}'::jsonb, 'instagram'),
  ('ig-warathakw2', 'دورات ورثة الأنبياء', 'KW', 'course', 'instagram', 'instagram', 'warathakw2',
   'https://instagram.com/warathakw2', 4, ARRAY['lesson','course'], 4, 15, false, true,
   '{"handle":"warathakw2","website_url":"https://www.waratha.com","source_subtype":"course_account"}'::jsonb, 'instagram'),
  ('ig-mpe-kh11', 'مسجد بتلة الخرينج', 'KW', 'mosque', 'instagram', 'instagram', 'mpe.kh11',
   'https://instagram.com/mpe.kh11', 4, ARRAY['lesson','announcement'], 3, 15, false, true,
   '{"handle":"mpe.kh11","source_subtype":"mosque_official"}'::jsonb, 'instagram'),
  ('ig-masjedalansary', 'مسجد جابر عتيك الأنصاري', 'KW', 'mosque', 'instagram', 'instagram', 'masjedalansary',
   'https://instagram.com/masjedalansary', 4, ARRAY['lesson','announcement'], 3, 15, false, true,
   '{"handle":"masjedalansary","source_subtype":"mosque_official"}'::jsonb, 'instagram'),
  ('ig-moudhi-mosque', 'مسجد موضي السور', 'KW', 'mosque', 'instagram', 'instagram', 'moudhi_mosque',
   'https://instagram.com/moudhi_mosque', 4, ARRAY['lesson','announcement'], 3, 15, false, true,
   '{"handle":"moudhi_mosque","source_subtype":"mosque_official"}'::jsonb, 'instagram'),
  ('ig-alshalahi-masjid', 'جامع سعد الشلاحي', 'KW', 'mosque', 'instagram', 'instagram', 'alshalahi_masjid',
   'https://instagram.com/alshalahi_masjid', 5, ARRAY['lesson','announcement'], 3, 15, false, true,
   '{"handle":"alshalahi_masjid","source_subtype":"mosque_official"}'::jsonb, 'instagram'),
  ('ig-alshalahi-women', 'اللجنة النسائية — جامع الشلاحي', 'KW', 'mosque', 'instagram', 'instagram', 'masjid_alshalahi_women',
   'https://instagram.com/masjid_alshalahi_women', 4, ARRAY['lesson','announcement'], 3, 15, false, true,
   '{"handle":"masjid_alshalahi_women","source_subtype":"mosque_women_committee"}'::jsonb, 'instagram'),
  ('ig-mhamadh-kw', 'مسجد حمد حمدان العتيبي', 'KW', 'mosque', 'instagram', 'instagram', 'mhamadh.kw',
   'https://instagram.com/mhamadh.kw', 4, ARRAY['lesson','announcement'], 3, 15, false, true,
   '{"handle":"mhamadh.kw","source_subtype":"mosque_official"}'::jsonb, 'instagram'),
  ('ig-dr-hayaalsabah', 'د. هيا الصباح', 'KW', 'scholar', 'instagram', 'instagram', 'dr_hayaalsabah',
   'https://instagram.com/dr_hayaalsabah', 5, ARRAY['lesson','announcement'], 2, 15, false, true,
   '{"handle":"dr_hayaalsabah","website_url":"https://drhayaalsabah.com","source_subtype":"scholar_official"}'::jsonb, 'instagram'),
  ('ig-shariakuniv', 'الجامعة الشرعية', 'KW', 'university', 'instagram', 'instagram', 'shariakuniv',
   'https://instagram.com/shariakuniv', 4, ARRAY['lesson','course','announcement'], 6, 15, false, true,
   '{"handle":"shariakuniv","source_subtype":"university"}'::jsonb, 'instagram'),
  ('ig-nadwat2025', 'ندوة 2025', 'KW', 'association', 'instagram', 'instagram', 'nadwat2025',
   'https://instagram.com/nadwat2025', 4, ARRAY['lesson','event','announcement'], 6, 15, false, true,
   '{"handle":"nadwat2025","source_subtype":"event"}'::jsonb, 'instagram'),
  ('ig-kwt-awqaf', 'أوقاف الكويت', 'KW', 'government', 'instagram', 'instagram', 'kwt_awqaf',
   'https://instagram.com/kwt_awqaf', 5, ARRAY['announcement','news','lesson'], 5, 15, false, true,
   '{"handle":"kwt_awqaf","website_url":"https://awqaf.gov.kw","source_subtype":"ministry"}'::jsonb, 'instagram')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  connector_type = EXCLUDED.connector_type,
  platform = EXCLUDED.platform,
  handle = EXCLUDED.handle,
  official_url = EXCLUDED.official_url,
  api_config = EXCLUDED.api_config,
  source_priority = EXCLUDED.source_priority,
  plugin_id = EXCLUDED.plugin_id,
  poll_interval_minutes = EXCLUDED.poll_interval_minutes,
  updated_at = now();

-- Official websites
INSERT INTO ake_connectors (
  slug, name, country, entity_type, connector_type, platform,
  official_url, feed_url, trust_level, allowed_kinds, source_priority,
  poll_interval_minutes, auto_publish, is_active, plugin_id
) VALUES
  ('web-drhayaalsabah', 'موقع د. هيا الصباح', 'KW', 'scholar', 'website', 'website',
   'https://drhayaalsabah.com', NULL, 5, ARRAY['lesson','article','announcement'], 1, 30, false, true, 'website'),
  ('web-awqaf-kw', 'موقع أوقاف الكويت', 'KW', 'government', 'website', 'website',
   'https://awqaf.gov.kw', NULL, 5, ARRAY['announcement','news','lesson'], 5, 30, false, true, 'website'),
  ('web-othmanalkamees', 'موقع د. عثمان الخميس', 'KW', 'scholar', 'website', 'website',
   'https://www.othmanalkamees.com', NULL, 5, ARRAY['lesson','article'], 1, 30, false, true, 'website')
ON CONFLICT (slug) DO UPDATE SET
  official_url = EXCLUDED.official_url,
  connector_type = EXCLUDED.connector_type,
  source_priority = EXCLUDED.source_priority,
  updated_at = now();

-- v2 stats RPC extension
CREATE OR REPLACE FUNCTION ake_v2_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'connectors_total', (SELECT count(*)::int FROM ake_connectors),
    'connectors_active', (SELECT count(*)::int FROM ake_connectors WHERE is_active),
    'connectors_by_type', (
      SELECT COALESCE(jsonb_object_agg(connector_type, cnt), '{}'::jsonb)
      FROM (SELECT connector_type, count(*)::int AS cnt FROM ake_connectors WHERE is_active GROUP BY connector_type) t
    ),
    'instagram_accounts', (SELECT count(*)::int FROM ake_connectors WHERE platform = 'instagram' AND is_active),
    'unified_fingerprints', (SELECT count(*)::int FROM ake_unified_fingerprints),
    'entity_links', (SELECT count(*)::int FROM ake_entity_links),
    'pending_changes', (SELECT count(*)::int FROM ake_content_changes WHERE applied_at IS NULL),
    'settings', (SELECT row_to_json(s)::jsonb FROM ake_v2_settings s WHERE id = 'global')
  ) INTO result;
  RETURN result;
END;
$$;
