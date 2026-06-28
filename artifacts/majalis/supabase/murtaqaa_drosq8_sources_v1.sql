-- =====================================================================
--  Murtaqaa Instagram + DrosQ8 Telegram — official AKE sources
--  instagram-murtaqaa (10 min) + telegram-drosq8 (5 min)
-- =====================================================================

-- ── AKE Connectors ─────────────────────────────────────────────────────
INSERT INTO ake_connectors (
  slug, name, country, entity_type, connector_type, platform, handle,
  official_url, trust_level, allowed_kinds, source_priority, poll_interval_minutes,
  auto_publish, is_active, api_config, plugin_id, city, metadata
) VALUES
  (
    'instagram-murtaqaa',
    'مرتقى — دروس الكويت (Instagram)',
    'KW',
    'lesson_aggregator',
    'instagram',
    'instagram',
    'murtaqaa_kw',
    'https://www.instagram.com/murtaqaa_kw',
    4,
    ARRAY['lesson','course','announcement'],
    7,
    10,
    true,
    true,
    '{
      "handle": "murtaqaa_kw",
      "source_subtype": "lesson_aggregator",
      "skip_month_filter": true,
      "fetch_limit": 25,
      "vision_on_image": true,
      "confidence_tiers": {"auto_publish": 90, "review": 70},
      "allowed_media": ["IMAGE", "VIDEO", "CAROUSEL_ALBUM", "REELS"]
    }'::jsonb,
    'instagram',
    'العاصمة',
    '{"monitoring_label": "Instagram — murtaqaa_kw", "priority_source": true}'::jsonb
  ),
  (
    'telegram-drosq8',
    'دروس الكويت — Telegram',
    'KW',
    'lesson_aggregator',
    'telegram',
    'telegram',
    'DrosQ8',
    'https://t.me/DrosQ8',
    4,
    ARRAY['lesson','course','announcement'],
    7,
    5,
    true,
    true,
    '{
      "channel": "DrosQ8",
      "public_web_preview": true,
      "skip_month_filter": true,
      "fetch_limit": 20,
      "vision_on_image": true,
      "confidence_tiers": {"auto_publish": 90, "review": 70}
    }'::jsonb,
    'telegram',
    'العاصمة',
    '{"monitoring_label": "Telegram — DrosQ8", "priority_source": true}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  connector_type = EXCLUDED.connector_type,
  platform = EXCLUDED.platform,
  handle = EXCLUDED.handle,
  official_url = EXCLUDED.official_url,
  poll_interval_minutes = EXCLUDED.poll_interval_minutes,
  auto_publish = EXCLUDED.auto_publish,
  is_active = EXCLUDED.is_active,
  api_config = EXCLUDED.api_config,
  plugin_id = EXCLUDED.plugin_id,
  city = EXCLUDED.city,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- ── Lesson automation (Phase 5) ──────────────────────────────────────
INSERT INTO trusted_lesson_sources (
  name, platform, url, source_type, trust_level, auto_publish_allowed,
  country, city, category, active, feed_url, config
) VALUES
  (
    'مرتقى — دروس الكويت (Instagram)',
    'instagram',
    'https://www.instagram.com/murtaqaa_kw',
    'instagram',
    'trusted',
    true,
    'الكويت',
    'العاصمة',
    'دروس',
    true,
    null,
    '{
      "handle": "murtaqaa_kw",
      "ake_slug": "instagram-murtaqaa",
      "source_subtype": "lesson_aggregator",
      "connector": "instagram_graph_api",
      "vision_on_image": true,
      "poll_interval_minutes": 10
    }'::jsonb
  ),
  (
    'دروس الكويت — Telegram',
    'telegram',
    'https://t.me/DrosQ8',
    'telegram',
    'trusted',
    true,
    'الكويت',
    'العاصمة',
    'دروس',
    true,
    null,
    '{
      "channel": "DrosQ8",
      "ake_slug": "telegram-drosq8",
      "source_subtype": "lesson_aggregator",
      "public_web_preview": true,
      "vision_on_image": true,
      "poll_interval_minutes": 5
    }'::jsonb
  )
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  trust_level = EXCLUDED.trust_level,
  auto_publish_allowed = EXCLUDED.auto_publish_allowed,
  active = EXCLUDED.active,
  config = EXCLUDED.config,
  updated_at = now();

-- ── trusted_content_sources (Phase 3) ────────────────────────────────
INSERT INTO trusted_content_sources (
  id, name, source_type, platform, url, rss_url,
  instagram_username, website, priority, trust_score,
  category, country, language, active, auto_publish_allowed, config,
  created_at, updated_at
)
SELECT
  tls.id,
  tls.name,
  'association',
  tls.platform,
  tls.url,
  tls.feed_url,
  CASE WHEN tls.platform = 'instagram' THEN tls.config->>'handle' ELSE NULL END,
  NULL,
  7,
  80,
  tls.category,
  tls.country,
  'ar',
  tls.active,
  tls.auto_publish_allowed,
  tls.config || jsonb_build_object('city', tls.city, 'ake_slug', tls.config->>'ake_slug'),
  tls.created_at,
  now()
FROM trusted_lesson_sources tls
WHERE tls.url IN (
  'https://www.instagram.com/murtaqaa_kw',
  'https://t.me/DrosQ8'
)
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  trust_score = EXCLUDED.trust_score,
  auto_publish_allowed = EXCLUDED.auto_publish_allowed,
  active = EXCLUDED.active,
  instagram_username = EXCLUDED.instagram_username,
  config = EXCLUDED.config,
  updated_at = now();

-- ── lesson_sources (Phase 6 Lesson Intelligence) ─────────────────────
INSERT INTO lesson_sources (
  source_name, source_type, source_url, platform, country, city,
  language, trust_score, active, auto_publish, scan_interval, config
)
SELECT
  tls.name,
  tls.source_type,
  tls.url,
  tls.platform,
  tls.country,
  tls.city,
  'ar',
  80,
  tls.active,
  tls.auto_publish_allowed,
  CASE
    WHEN tls.url LIKE '%instagram%' THEN 10
    ELSE 5
  END,
  tls.config || jsonb_build_object('legacy_source_id', tls.id::text)
FROM trusted_lesson_sources tls
WHERE tls.url IN (
  'https://www.instagram.com/murtaqaa_kw',
  'https://t.me/DrosQ8'
)
ON CONFLICT (source_url) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  active = EXCLUDED.active,
  auto_publish = EXCLUDED.auto_publish,
  scan_interval = EXCLUDED.scan_interval,
  config = EXCLUDED.config,
  updated_at = now();

-- ── Source monitor jobs ──────────────────────────────────────────────
INSERT INTO source_monitor_jobs (source_id, interval_minutes, active, next_run_at)
SELECT
  tcs.id,
  CASE WHEN tcs.url LIKE '%instagram%' THEN 10 ELSE 5 END,
  tcs.active,
  now() + interval '5 minutes'
FROM trusted_content_sources tcs
WHERE tcs.url IN (
  'https://www.instagram.com/murtaqaa_kw',
  'https://t.me/DrosQ8'
)
ON CONFLICT (source_id) DO UPDATE SET
  active = EXCLUDED.active,
  interval_minutes = EXCLUDED.interval_minutes,
  updated_at = now();
