-- =====================================================================
--  Kuwait Instagram lesson sources — حسابات الدروس الشرعية
--  نفّذ بعد: trusted_lesson_sources_v1.sql
-- =====================================================================

INSERT INTO trusted_lesson_sources (
  name, platform, url, source_type, trust_level, auto_publish_allowed,
  country, city, category, active, feed_url, config
) VALUES
  (
    'دروس شرعية الكويت',
    'instagram',
    'https://instagram.com/drooss_kw',
    'instagram',
    'trusted',
    true,
    'الكويت',
    'العاصمة',
    'دروس',
    true,
    null,
    '{"handle":"drooss_kw","source_subtype":"lesson_aggregator","description":"حساب متخصص في نشر إعلانات الدروس العلمية الشرعية في دولة الكويت","connector":"og_tags"}'::jsonb
  ),
  (
    'دورة الخليفة الراشد علي بن أبي طالب العلمية',
    'instagram',
    'https://instagram.com/ibnabitallib',
    'instagram',
    'trusted',
    true,
    'الكويت',
    'العاصمة',
    'دورات',
    true,
    null,
    '{"handle":"ibnabitallib","source_subtype":"course_account","description":"الحساب الرسمي لدورة الخليفة الراشد علي بن أبي طالب العلمية","connector":"og_tags"}'::jsonb
  ),
  (
    'د. عثمان الخميس',
    'instagram',
    'https://instagram.com/othmanalkamees',
    'instagram',
    'official',
    true,
    'الكويت',
    'العاصمة',
    'دروس',
    true,
    null,
    '{"handle":"othmanalkamees","source_subtype":"scholar_official","description":"الحساب الرسمي للدكتور عثمان بن محمد الخميس","website_url":"https://www.othmanalkamees.com","connector":"og_tags"}'::jsonb
  ),
  (
    'جامع سعد الشلاحي',
    'instagram',
    'https://instagram.com/alshalahi_masjid',
    'instagram',
    'official',
    true,
    'الكويت',
    'العاصمة',
    'دروس',
    true,
    null,
    '{"handle":"alshalahi_masjid","source_subtype":"mosque_official","description":"الحساب الرسمي لجامع سعد الشلاحي","connector":"og_tags"}'::jsonb
  ),
  (
    'اللجنة النسائية بجامع سعد الشلاحي',
    'instagram',
    'https://instagram.com/masjid_alshalahi_women',
    'instagram',
    'official',
    true,
    'الكويت',
    'العاصمة',
    'دروس',
    true,
    null,
    '{"handle":"masjid_alshalahi_women","source_subtype":"mosque_women_committee","description":"الأنشطة الدعوية والعلمية للجنة النسائية بجامع سعد الشلاحي","connector":"og_tags"}'::jsonb
  ),
  (
    'مسجد حمد حمدان العتيبي',
    'instagram',
    'https://instagram.com/mhamadh.kw',
    'instagram',
    'official',
    true,
    'الكويت',
    'العاصمة',
    'دروس',
    true,
    null,
    '{"handle":"mhamadh.kw","source_subtype":"mosque_official","description":"حساب مسجد حمد حمدان العتيبي في الكويت","connector":"og_tags"}'::jsonb
  ),
  (
    'مسجد جابر عتيك الأنصاري',
    'instagram',
    'https://instagram.com/masjedalansary',
    'instagram',
    'trusted',
    true,
    'الكويت',
    'العاصمة',
    'دروس',
    true,
    null,
    '{"handle":"masjedalansary","source_subtype":"mosque_official","description":"حساب مسجد جابر عتيك الأنصاري","connector":"og_tags"}'::jsonb
  ),
  (
    'مسجد بتلة الخرينج',
    'instagram',
    'https://instagram.com/mpe.kh11',
    'instagram',
    'official',
    true,
    'الكويت',
    'الفروانية',
    'دروس',
    true,
    null,
    '{"handle":"mpe.kh11","source_subtype":"mosque_official","description":"الحساب الرسمي لمسجد بتلة الخرينج — العارضية 11 — الكويت","connector":"og_tags"}'::jsonb
  ),
  (
    'مسجد موضي السور',
    'instagram',
    'https://instagram.com/moudhi_mosque',
    'instagram',
    'official',
    true,
    'الكويت',
    'العاصمة',
    'دروس',
    true,
    null,
    '{"handle":"moudhi_mosque","source_subtype":"mosque_official","description":"حساب مسجد موضي السور في الكويت","connector":"og_tags"}'::jsonb
  ),
  (
    'مسجد عائشة المحري',
    'instagram',
    'https://instagram.com/masjedalmehry',
    'instagram',
    'official',
    true,
    'الكويت',
    'المسايل',
    'دروس',
    true,
    null,
    '{"handle":"masjedalmehry","source_subtype":"mosque_official","description":"حساب مسجد عائشة المحري — منطقة المسايل — الكويت","connector":"og_tags"}'::jsonb
  ),
  (
    'دورات ورثة الأنبياء',
    'instagram',
    'https://instagram.com/warathakw2',
    'instagram',
    'trusted',
    true,
    'الكويت',
    'العاصمة',
    'دورات',
    true,
    null,
    '{"handle":"warathakw2","source_subtype":"course_account","description":"حساب دورات ورثة الأنبياء","website_url":"https://www.waratha.com","connector":"og_tags"}'::jsonb
  )
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  platform = EXCLUDED.platform,
  source_type = EXCLUDED.source_type,
  trust_level = EXCLUDED.trust_level,
  auto_publish_allowed = EXCLUDED.auto_publish_allowed,
  country = EXCLUDED.country,
  city = EXCLUDED.city,
  category = EXCLUDED.category,
  active = EXCLUDED.active,
  config = EXCLUDED.config,
  updated_at = now();

COMMENT ON TABLE trusted_lesson_sources IS 'مصادر دروس معتمدة — يشمل حسابات Instagram للمساجد والدورات في الكويت';
