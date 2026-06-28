-- AKE v16 production recovery patch (idempotent)
-- Source quality fields · auto_publish · verification connector · RPC grants

ALTER TABLE ake_connectors
  ADD COLUMN IF NOT EXISTS priority INT,
  ADD COLUMN IF NOT EXISTS official BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS authority_score INT NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS publisher_type TEXT,
  ADD COLUMN IF NOT EXISTS content_kind_default TEXT DEFAULT 'lesson',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'KW';

-- Map publisher types to authority scores (higher = more trusted)
UPDATE ake_connectors SET
  publisher_type = COALESCE(api_config->>'source_subtype', entity_type, 'unknown'),
  language = 'ar',
  country = COALESCE(country, 'KW'),
  official = CASE
    WHEN connector_type = 'website' THEN true
    WHEN api_config->>'source_subtype' IN ('scholar_official', 'mosque_official', 'ministry', 'university') THEN true
    ELSE false
  END,
  authority_score = CASE
    WHEN connector_type = 'website' THEN 100
    WHEN api_config->>'source_subtype' = 'scholar_official' OR entity_type = 'scholar' THEN 95
    WHEN api_config->>'source_subtype' = 'ministry' OR entity_type = 'government' THEN 90
    WHEN api_config->>'source_subtype' = 'university' OR entity_type = 'university' THEN 90
    WHEN api_config->>'source_subtype' IN ('mosque_official', 'mosque_women_committee') OR entity_type = 'mosque' THEN 85
    WHEN api_config->>'source_subtype' = 'course_account' OR entity_type = 'course' THEN 80
    WHEN api_config->>'source_subtype' = 'mosque_women_committee' THEN 75
    WHEN api_config->>'source_subtype' = 'lesson_aggregator' THEN 60
    WHEN entity_type = 'association' THEN 60
    ELSE 30
  END,
  priority = CASE
    WHEN connector_type = 'website' THEN 100
    WHEN api_config->>'source_subtype' = 'scholar_official' OR entity_type = 'scholar' THEN 95
    WHEN api_config->>'source_subtype' = 'ministry' OR entity_type = 'government' THEN 90
    WHEN api_config->>'source_subtype' = 'university' OR entity_type = 'university' THEN 90
    WHEN api_config->>'source_subtype' IN ('mosque_official', 'mosque_women_committee') OR entity_type = 'mosque' THEN 85
    WHEN api_config->>'source_subtype' = 'course_account' OR entity_type = 'course' THEN 80
    WHEN api_config->>'source_subtype' = 'mosque_women_committee' THEN 75
    WHEN api_config->>'source_subtype' = 'lesson_aggregator' THEN 60
    ELSE 30
  END,
  content_kind_default = 'lesson'
WHERE slug LIKE 'ig-%' OR slug LIKE 'web-%';

-- Enable auto_publish on trusted official sources
UPDATE ake_connectors SET
  auto_publish = true,
  trust_level = GREATEST(trust_level, 4),
  is_active = true
WHERE slug IN (
  'web-drhayaalsabah', 'web-othmanalkamees', 'web-awqaf-kw',
  'ig-othmanalkamees', 'ig-dr-hayaalsabah', 'ig-alshalahi-masjid',
  'ig-shariakuniv', 'ig-kwt-awqaf'
);

-- Verification connector (manifest) — routes through production pipeline
INSERT INTO ake_connectors (
  slug, name, country, entity_type, connector_type, platform,
  official_url, trust_level, allowed_kinds, source_priority,
  priority, authority_score, official, publisher_type, content_kind_default,
  poll_interval_minutes, auto_publish, is_active, plugin_id, api_config
) VALUES (
  'verify-production-lesson', 'AKE Production Verification', 'KW', 'mosque', 'manifest', 'manifest',
  'https://www.majlisilm.com', 5, ARRAY['lesson'], 3,
  85, 85, true, 'verification_fixture', 'lesson',
  1, true, true, 'manifest',
  '{"manifest_file":"ake-v2-verification-lesson.json","verification_only":true}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  auto_publish = true,
  is_active = true,
  trust_level = 5,
  poll_interval_minutes = 1,
  api_config = EXCLUDED.api_config,
  updated_at = now();

UPDATE ake_connectors SET
  poll_interval_minutes = 1,
  api_config = jsonb_set(COALESCE(api_config, '{}'::jsonb), '{manifest_file}', '"ake-v2-verification-lesson.json"')
WHERE slug = 'verify-production-lesson';

-- Ensure handle slugs match production requirements
UPDATE ake_connectors SET handle = 'ibnabitallib' WHERE slug = 'ig-ibnabitallib';
UPDATE ake_connectors SET handle = 'drooss_kw' WHERE slug = 'ig-drooss-kw';
UPDATE ake_connectors SET handle = 'othmanalkamees' WHERE slug = 'ig-othmanalkamees';

GRANT EXECUTE ON FUNCTION ake_v2_dashboard_stats() TO authenticated, anon, service_role;
NOTIFY pgrst, 'reload schema';
