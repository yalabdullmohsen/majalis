-- =====================================================================
--  Kuwait Instagram sources v2 — sync to trusted_content_sources + jobs
--  نفّذ بعد: kuwait_instagram_sources_v1.sql + smart_source_monitoring_v1.sql
--             + automation_phase5_v1.sql
-- =====================================================================

-- Re-upsert legacy table (idempotent)
INSERT INTO trusted_lesson_sources (
  name, platform, url, source_type, trust_level, auto_publish_allowed,
  country, city, category, active, feed_url, config
) VALUES
  (
    'دروس شرعية الكويت', 'instagram', 'https://instagram.com/drooss_kw', 'instagram',
    'trusted', true, 'الكويت', 'العاصمة', 'دروس', true, null,
    '{"handle":"drooss_kw","source_subtype":"lesson_aggregator","description":"حساب متخصص في نشر إعلانات الدروس العلمية الشرعية في دولة الكويت","connector":"og_tags"}'::jsonb
  ),
  (
    'دورة الخليفة الراشد علي بن أبي طالب العلمية', 'instagram', 'https://instagram.com/ibnabitallib', 'instagram',
    'trusted', true, 'الكويت', 'العاصمة', 'دورات', true, null,
    '{"handle":"ibnabitallib","source_subtype":"course_account","description":"الحساب الرسمي لدورة الخليفة الراشد علي بن أبي طالب العلمية","connector":"og_tags"}'::jsonb
  ),
  (
    'د. عثمان الخميس', 'instagram', 'https://instagram.com/othmanalkamees', 'instagram',
    'official', true, 'الكويت', 'العاصمة', 'دروس', true, null,
    '{"handle":"othmanalkamees","source_subtype":"scholar_official","description":"الحساب الرسمي للدكتور عثمان بن محمد الخميس","website_url":"https://www.othmanalkamees.com","connector":"og_tags"}'::jsonb
  ),
  (
    'جامع سعد الشلاحي', 'instagram', 'https://instagram.com/alshalahi_masjid', 'instagram',
    'official', true, 'الكويت', 'العاصمة', 'دروس', true, null,
    '{"handle":"alshalahi_masjid","source_subtype":"mosque_official","description":"الحساب الرسمي لجامع سعد الشلاحي","connector":"og_tags"}'::jsonb
  ),
  (
    'اللجنة النسائية بجامع سعد الشلاحي', 'instagram', 'https://instagram.com/masjid_alshalahi_women', 'instagram',
    'official', true, 'الكويت', 'العاصمة', 'دروس', true, null,
    '{"handle":"masjid_alshalahi_women","source_subtype":"mosque_women_committee","description":"الأنشطة الدعوية والعلمية للجنة النسائية بجامع سعد الشلاحي","connector":"og_tags"}'::jsonb
  ),
  (
    'مسجد حمد حمدان العتيبي', 'instagram', 'https://instagram.com/mhamadh.kw', 'instagram',
    'official', true, 'الكويت', 'العاصمة', 'دروس', true, null,
    '{"handle":"mhamadh.kw","source_subtype":"mosque_official","description":"حساب مسجد حمد حمدان العتيبي في الكويت","connector":"og_tags"}'::jsonb
  ),
  (
    'مسجد جابر عتيك الأنصاري', 'instagram', 'https://instagram.com/masjedalansary', 'instagram',
    'trusted', true, 'الكويت', 'العاصمة', 'دروس', true, null,
    '{"handle":"masjedalansary","source_subtype":"mosque_official","description":"حساب مسجد جابر عتيك الأنصاري","connector":"og_tags"}'::jsonb
  ),
  (
    'مسجد بتلة الخرينج', 'instagram', 'https://instagram.com/mpe.kh11', 'instagram',
    'official', true, 'الكويت', 'الفروانية', 'دروس', true, null,
    '{"handle":"mpe.kh11","source_subtype":"mosque_official","description":"الحساب الرسمي لمسجد بتلة الخرينج — العارضية 11 — الكويت","connector":"og_tags"}'::jsonb
  ),
  (
    'مسجد موضي السور', 'instagram', 'https://instagram.com/moudhi_mosque', 'instagram',
    'official', true, 'الكويت', 'العاصمة', 'دروس', true, null,
    '{"handle":"moudhi_mosque","source_subtype":"mosque_official","description":"حساب مسجد موضي السور في الكويت","connector":"og_tags"}'::jsonb
  ),
  (
    'مسجد عائشة المحري', 'instagram', 'https://instagram.com/masjedalmehry', 'instagram',
    'official', true, 'الكويت', 'المسايل', 'دروس', true, null,
    '{"handle":"masjedalmehry","source_subtype":"mosque_official","description":"حساب مسجد عائشة المحري — منطقة المسايل — الكويت","connector":"og_tags"}'::jsonb
  ),
  (
    'دورات ورثة الأنبياء', 'instagram', 'https://instagram.com/warathakw2', 'instagram',
    'trusted', true, 'الكويت', 'العاصمة', 'دورات', true, null,
    '{"handle":"warathakw2","source_subtype":"course_account","description":"حساب دورات ورثة الأنبياء","website_url":"https://www.waratha.com","connector":"og_tags"}'::jsonb
  )
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  trust_level = EXCLUDED.trust_level,
  auto_publish_allowed = EXCLUDED.auto_publish_allowed,
  active = EXCLUDED.active,
  config = EXCLUDED.config,
  updated_at = now();

-- Sync to Phase 3 primary table (trusted_content_sources)
INSERT INTO trusted_content_sources (
  id, name, source_type, platform, url, rss_url,
  instagram_username, website, priority, trust_score,
  category, country, language, active, auto_publish_allowed, config,
  created_at, updated_at
)
SELECT
  tls.id,
  tls.name,
  CASE
    WHEN tls.config->>'source_subtype' LIKE '%mosque%' THEN 'mosque'
    WHEN tls.config->>'source_subtype' LIKE '%scholar%' THEN 'scholarly'
    WHEN tls.config->>'source_subtype' LIKE '%course%' OR tls.config->>'source_subtype' = 'lesson_aggregator' THEN 'association'
    ELSE 'instagram'
  END,
  tls.platform,
  tls.url,
  tls.feed_url,
  tls.config->>'handle',
  tls.config->>'website_url',
  CASE tls.config->>'source_subtype'
    WHEN 'scholar_official' THEN 9
    WHEN 'mosque_official' THEN 8
    WHEN 'lesson_aggregator' THEN 7
    ELSE 6
  END,
  CASE tls.trust_level
    WHEN 'official' THEN 100
    WHEN 'trusted' THEN 80
    ELSE 50
  END,
  tls.category,
  tls.country,
  'ar',
  tls.active,
  tls.auto_publish_allowed,
  tls.config || jsonb_build_object('city', tls.city, 'source_subtype', tls.config->>'source_subtype'),
  tls.created_at,
  now()
FROM trusted_lesson_sources tls
WHERE tls.url IN (
  'https://instagram.com/drooss_kw',
  'https://instagram.com/ibnabitallib',
  'https://instagram.com/othmanalkamees',
  'https://instagram.com/alshalahi_masjid',
  'https://instagram.com/masjid_alshalahi_women',
  'https://instagram.com/mhamadh.kw',
  'https://instagram.com/masjedalansary',
  'https://instagram.com/mpe.kh11',
  'https://instagram.com/moudhi_mosque',
  'https://instagram.com/masjedalmehry',
  'https://instagram.com/warathakw2'
)
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  source_type = EXCLUDED.source_type,
  trust_score = EXCLUDED.trust_score,
  auto_publish_allowed = EXCLUDED.auto_publish_allowed,
  active = EXCLUDED.active,
  instagram_username = EXCLUDED.instagram_username,
  website = EXCLUDED.website,
  config = EXCLUDED.config,
  updated_at = now();

-- Register Phase 5 monitor jobs (15-min interval)
INSERT INTO source_monitor_jobs (source_id, interval_minutes, active, next_run_at)
SELECT
  tcs.id,
  15,
  tcs.active,
  now() + interval '15 minutes'
FROM trusted_content_sources tcs
WHERE tcs.url IN (
  'https://instagram.com/drooss_kw',
  'https://instagram.com/ibnabitallib',
  'https://instagram.com/othmanalkamees',
  'https://instagram.com/alshalahi_masjid',
  'https://instagram.com/masjid_alshalahi_women',
  'https://instagram.com/mhamadh.kw',
  'https://instagram.com/masjedalansary',
  'https://instagram.com/mpe.kh11',
  'https://instagram.com/moudhi_mosque',
  'https://instagram.com/masjedalmehry',
  'https://instagram.com/warathakw2'
)
ON CONFLICT (source_id) DO UPDATE SET
  active = EXCLUDED.active,
  interval_minutes = 15,
  updated_at = now();

COMMENT ON TABLE trusted_lesson_sources IS '11 حساب Instagram كويتي — دروس شرعية (v2 synced)';
