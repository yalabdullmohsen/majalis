-- ═══════════════════════════════════════════════════════════════
-- أتمتة محتوى Instagram متعددة الأنواع (دروس/دورات/فعاليات/فوائد/إعلانات)
-- يوسّع الجداول القائمة trusted_content_sources و auto_imported_content
-- بدل إنشاء جداول متناثرة جديدة — لا نشر تلقائي: كل مادة تبقى
-- pending_review إلى أن يعتمدها مراجِع بشري من لوحة الإدارة.
-- ═══════════════════════════════════════════════════════════════

-- 1) مصادر Instagram — أنواع المحتوى المسموحة والنسب الافتراضي لكل حساب
ALTER TABLE trusted_content_sources
  ADD COLUMN IF NOT EXISTS content_types_allowed TEXT[] NOT NULL DEFAULT ARRAY['lesson'],
  ADD COLUMN IF NOT EXISTS default_attribution_name TEXT,
  ADD COLUMN IF NOT EXISTS default_organization_name TEXT,
  ADD COLUMN IF NOT EXISTS attribute_to_person BOOLEAN NOT NULL DEFAULT true;

-- 2) المحتوى الموحّد — حقول الدورات/الفعاليات/الفوائد/الإعلانات المستخرَجة من Instagram
ALTER TABLE auto_imported_content
  ADD COLUMN IF NOT EXISTS source_account TEXT,
  ADD COLUMN IF NOT EXISTS source_post_id TEXT,
  ADD COLUMN IF NOT EXISTS source_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_name TEXT,
  ADD COLUMN IF NOT EXISTS organization_name TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS registration_url TEXT,
  ADD COLUMN IF NOT EXISTS event_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS event_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_displayed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS display_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;

-- منشور واحد لكل (حساب، معرّف منشور) — يمنع التكرار عند إعادة السحب
CREATE UNIQUE INDEX IF NOT EXISTS auto_imported_content_source_post_uidx
  ON auto_imported_content (source_account, source_post_id)
  WHERE source_post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS auto_imported_content_content_type_idx
  ON auto_imported_content (content_type, status);
CREATE INDEX IF NOT EXISTS auto_imported_content_event_start_idx
  ON auto_imported_content (event_start_at) WHERE content_type = 'event';
CREATE INDEX IF NOT EXISTS auto_imported_content_benefit_rotation_idx
  ON auto_imported_content (content_type, last_displayed_at NULLS FIRST)
  WHERE content_type = 'benefit';
CREATE INDEX IF NOT EXISTS auto_imported_content_content_hash_idx
  ON auto_imported_content (content_hash) WHERE content_hash IS NOT NULL;

-- 3) إعدادات تدوير «فوائد اليوم» — صف واحد قابل للتعديل من لوحة الإدارة
CREATE TABLE IF NOT EXISTS daily_benefit_schedule (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  display_times TEXT[] NOT NULL DEFAULT ARRAY['06:00','12:00','18:00','22:00'],
  timezone TEXT NOT NULL DEFAULT 'Asia/Kuwait',
  no_repeat_days INTEGER NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO daily_benefit_schedule (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE daily_benefit_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_benefit_schedule_service_only ON daily_benefit_schedule;
CREATE POLICY daily_benefit_schedule_service_only ON daily_benefit_schedule
  FOR ALL USING (false) WITH CHECK (false);

-- 4) سجل عرض بطاقات الفائدة — لمنع تكرار نفس البطاقة خلال 30 يومًا
CREATE TABLE IF NOT EXISTS daily_benefit_display_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES auto_imported_content(id) ON DELETE CASCADE,
  displayed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  slot_label TEXT
);
CREATE INDEX IF NOT EXISTS daily_benefit_display_log_content_idx
  ON daily_benefit_display_log (content_id, displayed_at DESC);

ALTER TABLE daily_benefit_display_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_benefit_display_log_service_only ON daily_benefit_display_log;
CREATE POLICY daily_benefit_display_log_service_only ON daily_benefit_display_log
  FOR ALL USING (false) WITH CHECK (false);

-- 5) تسجيل الحسابات الخمسة المعتمدة — attribute_to_person=false يعني: يُكتشف
-- اسم الشيخ/الشيخة من نص المنشور إن وُجد صراحة، وإلا يُستخدم اسم الجهة.
INSERT INTO trusted_content_sources
  (name, source_type, platform, url, category, trust_score, country, active,
   auto_publish_allowed, content_types_allowed, default_attribution_name,
   default_organization_name, attribute_to_person, config)
VALUES
  ('د. هيا بنت سلمان الصباح', 'instagram', 'instagram', 'https://instagram.com/dr_hayaalsabah',
   'دروس ودورات', 85, 'الكويت', true, false,
   ARRAY['lesson','course','event','benefit'], 'د. هيا بنت سلمان الصباح', NULL, true,
   jsonb_build_object('handle', 'dr_hayaalsabah', 'connector', 'og_tags', 'source_subtype', 'scholar_official')),

  ('حكم وفوائد د. هيا الصباح', 'instagram', 'instagram', 'https://instagram.com/drhaya_qoutes',
   'حكم وفوائد', 80, 'الكويت', true, false,
   ARRAY['benefit'], 'د. هيا بنت سلمان الصباح', NULL, true,
   jsonb_build_object('handle', 'drhaya_qoutes', 'connector', 'og_tags', 'source_subtype', 'quotes_account')),

  ('مركز نبراس للسنة النبوية', 'instagram', 'instagram', 'https://instagram.com/nebraas_kw',
   'السنة النبوية', 85, 'الكويت', true, false,
   ARRAY['course','event','lesson','benefit'], NULL, 'مركز نبراس للسنة النبوية', false,
   jsonb_build_object('handle', 'nebraas_kw', 'connector', 'og_tags', 'source_subtype', 'sunnah_center')),

  ('أكاديمية ورثة الأنبياء', 'instagram', 'instagram', 'https://instagram.com/w_alanbiya',
   'دورات علمية', 85, 'الكويت', true, false,
   ARRAY['course','event','lesson','benefit','announcement'], NULL, 'أكاديمية ورثة الأنبياء', false,
   jsonb_build_object('handle', 'w_alanbiya', 'connector', 'og_tags', 'source_subtype', 'academy')),

  ('جمعية إنسان الخيرية', 'instagram', 'instagram', 'https://instagram.com/insan_kwt',
   'فعاليات ومبادرات', 85, 'الكويت', true, false,
   ARRAY['event','course','announcement'], NULL, 'جمعية إنسان الخيرية', false,
   jsonb_build_object('handle', 'insan_kwt', 'connector', 'og_tags', 'source_subtype', 'charity_official'))
ON CONFLICT (url) DO UPDATE SET
  content_types_allowed = EXCLUDED.content_types_allowed,
  default_attribution_name = EXCLUDED.default_attribution_name,
  default_organization_name = EXCLUDED.default_organization_name,
  attribute_to_person = EXCLUDED.attribute_to_person,
  active = true,
  updated_at = now();
