-- ════════════════════════════════════════════════════════════════════════════
-- دليل الجامعات الشرعية — universities_v1.sql
-- جميع البيانات تُدخَل يدوياً عبر لوحة الإدارة — لا سكرابينج آلي
-- ════════════════════════════════════════════════════════════════════════════

-- ── جدول الجامعات الرئيسي ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS universities (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  name_ar             text NOT NULL,
  name_en             text NOT NULL DEFAULT '',
  country             text NOT NULL,
  city                text NOT NULL DEFAULT '',
  logo_url            text NOT NULL DEFAULT '',
  about               text NOT NULL DEFAULT '',
  website_url         text NOT NULL DEFAULT '',
  social_links        jsonb NOT NULL DEFAULT '{}',
  accreditation_status text NOT NULL DEFAULT 'unknown'
                      CHECK (accreditation_status IN ('accredited','provisional','unverified','unknown')),
  is_verified         boolean NOT NULL DEFAULT false,
  is_published        boolean NOT NULL DEFAULT true,
  last_updated_at     timestamptz NOT NULL DEFAULT now(),
  last_reviewed_by    text NOT NULL DEFAULT '',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── فهرسة ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS univ_country_idx      ON universities(country);
CREATE INDEX IF NOT EXISTS univ_verified_idx     ON universities(is_verified);
CREATE INDEX IF NOT EXISTS univ_published_idx    ON universities(is_published);
CREATE INDEX IF NOT EXISTS univ_slug_idx         ON universities(slug);

-- FTS عربي + إنجليزي
ALTER TABLE universities ADD COLUMN IF NOT EXISTS ts_search tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(name_ar,'') || ' ' || coalesce(name_en,'') || ' ' || coalesce(country,'') || ' ' || coalesce(about,''))
  ) STORED;
CREATE INDEX IF NOT EXISTS univ_fts_idx ON universities USING GIN(ts_search);

-- ── جدول البرامج الدراسية ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS university_programs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id       uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  program_name        text NOT NULL,
  faculty_department  text NOT NULL DEFAULT '',
  specialization      text NOT NULL DEFAULT '',
  degree_level        text NOT NULL
                      CHECK (degree_level IN ('دبلوم','بكالوريوس','ماجستير','دكتوراه','دبلوم_عالي')),
  study_language      text NOT NULL DEFAULT 'العربية',
  study_mode          text NOT NULL DEFAULT 'حضوري'
                      CHECK (study_mode IN ('حضوري','عن_بعد','هجين')),
  duration            text NOT NULL DEFAULT '',
  tuition_fees        numeric(12,2),
  currency            text NOT NULL DEFAULT 'SAR',
  has_scholarship     boolean NOT NULL DEFAULT false,
  scholarship_details text NOT NULL DEFAULT '',
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uprog_univ_idx    ON university_programs(university_id);
CREATE INDEX IF NOT EXISTS uprog_degree_idx  ON university_programs(degree_level);
CREATE INDEX IF NOT EXISTS uprog_mode_idx    ON university_programs(study_mode);
CREATE INDEX IF NOT EXISTS uprog_scholar_idx ON university_programs(has_scholarship);

ALTER TABLE university_programs ADD COLUMN IF NOT EXISTS ts_prog tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(program_name,'') || ' ' || coalesce(specialization,'') || ' ' || coalesce(faculty_department,''))
  ) STORED;
CREATE INDEX IF NOT EXISTS uprog_fts_idx ON university_programs USING GIN(ts_prog);

-- ── جدول شروط القبول ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admission_requirements (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id            uuid NOT NULL REFERENCES university_programs(id) ON DELETE CASCADE,
  requirements          jsonb NOT NULL DEFAULT '[]',
  required_documents    jsonb NOT NULL DEFAULT '[]',
  application_steps     jsonb NOT NULL DEFAULT '[]',
  application_deadline  text NOT NULL DEFAULT '',
  application_url       text NOT NULL DEFAULT '',
  notes                 text NOT NULL DEFAULT '',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admreq_prog_idx ON admission_requirements(program_id);

-- ── جدول الأسئلة الشائعة ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS university_faqs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  question      text NOT NULL,
  answer        text NOT NULL,
  order_index   int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ufaq_univ_idx ON university_faqs(university_id);

-- ── جدول تذكيرات المراجعة (Phase 3) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS review_reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id   uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  program_id      uuid REFERENCES university_programs(id) ON DELETE CASCADE,
  reminder_type   text NOT NULL
                  CHECK (reminder_type IN ('annual_check','deadline_approaching','data_incomplete')),
  due_date        date NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','reviewed','dismissed')),
  notes           text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_at     timestamptz,
  reviewed_by     text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS rrem_univ_idx    ON review_reminders(university_id);
CREATE INDEX IF NOT EXISTS rrem_status_idx  ON review_reminders(status);
CREATE INDEX IF NOT EXISTS rrem_due_idx     ON review_reminders(due_date);

-- ── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE universities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_programs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_faqs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reminders       ENABLE ROW LEVEL SECURITY;

-- قراءة عامة: أي مستخدم يمكنه القراءة (للمنشورة فقط)
CREATE POLICY "univ_public_read"  ON universities           FOR SELECT USING (is_published = true);
CREATE POLICY "uprog_public_read" ON university_programs    FOR SELECT USING (is_active = true);
CREATE POLICY "admreq_public_read"ON admission_requirements FOR SELECT USING (true);
CREATE POLICY "ufaq_public_read"  ON university_faqs        FOR SELECT USING (true);

-- تذكيرات المراجعة: للمشرفين فقط
CREATE POLICY "rrem_admin_all" ON review_reminders
  FOR ALL USING (auth.role() = 'service_role');

-- كتابة عبر service_role فقط (من API server)
CREATE POLICY "univ_service_write"  ON universities
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "uprog_service_write" ON university_programs
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admreq_service_write" ON admission_requirements
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ufaq_service_write"  ON university_faqs
  FOR ALL USING (auth.role() = 'service_role');

-- GRANT للـ anon (قراءة)
GRANT SELECT ON universities            TO anon;
GRANT SELECT ON university_programs     TO anon;
GRANT SELECT ON admission_requirements  TO anon;
GRANT SELECT ON university_faqs         TO anon;

-- ════════════════════════════════════════════════════════════════════════════
-- بيانات تجريبية — ⚠️ تحتاج تحقق بشري قبل النشر الرسمي
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO universities (slug, name_ar, name_en, country, city, about, website_url, accreditation_status, is_verified, last_reviewed_by, last_updated_at)
VALUES
(
  'islamic-university-madinah',
  'الجامعة الإسلامية بالمدينة المنورة',
  'Islamic University of Madinah',
  'المملكة العربية السعودية',
  'المدينة المنورة',
  'جامعة حكومية سعودية تأسست عام 1961م، تُعدّ من أعرق الجامعات الإسلامية في العالم، وتمنح منحاً دراسية للطلاب المسلمين من مختلف دول العالم. تضم كليات الشريعة والدعوة والقرآن الكريم والحديث.',
  'https://iu.edu.sa',
  'accredited',
  true,
  'بيانات تجريبية — يحتاج تحقق',
  now()
),
(
  'al-azhar-university',
  'جامعة الأزهر',
  'Al-Azhar University',
  'مصر',
  'القاهرة',
  'أقدم جامعة إسلامية في العالم، تأسست عام 970م. تضم كليات متعددة للعلوم الإسلامية واللغة العربية والتخصصات العصرية. تستقبل طلاباً من أكثر من 100 دولة.',
  'https://www.azhar.edu.eg',
  'accredited',
  true,
  'بيانات تجريبية — يحتاج تحقق',
  now()
),
(
  'umm-al-qura-university',
  'جامعة أم القرى',
  'Umm Al-Qura University',
  'المملكة العربية السعودية',
  'مكة المكرمة',
  'جامعة سعودية حكومية في مكة المكرمة، تضم كليات الشريعة والدراسات الإسلامية والعلوم الاجتماعية والهندسة. أسست عام 1949م.',
  'https://uqu.edu.sa',
  'accredited',
  true,
  'بيانات تجريبية — يحتاج تحقق',
  now()
),
(
  'imam-university',
  'جامعة الإمام محمد بن سعود الإسلامية',
  'Imam Mohammad ibn Saud Islamic University',
  'المملكة العربية السعودية',
  'الرياض',
  'جامعة إسلامية حكومية في الرياض، تأسست عام 1953م. لديها كليات الشريعة والأصول والدعوة والإعلام والعلوم الاجتماعية، وفروع دولية في عدة دول.',
  'https://www.imamu.edu.sa',
  'accredited',
  true,
  'بيانات تجريبية — يحتاج تحقق',
  now()
),
(
  'iium-malaysia',
  'الجامعة الإسلامية العالمية بماليزيا',
  'International Islamic University Malaysia (IIUM)',
  'ماليزيا',
  'كوالالمبور',
  'جامعة دولية تأسست عام 1983م، تدمج بين العلوم الإسلامية والتخصصات العصرية. تستخدم اللغتين العربية والإنجليزية، وتستقبل طلاباً من أكثر من 100 دولة.',
  'https://www.iium.edu.my',
  'accredited',
  true,
  'بيانات تجريبية — يحتاج تحقق',
  now()
),
(
  'jordan-islamic-sciences',
  'جامعة العلوم الإسلامية الأردنية',
  'Al al-Bayt University (Faculty of Islamic Studies)',
  'الأردن',
  'المفرق',
  'جامعة آل البيت تضم كلية الشريعة الإسلامية التي تُقدّم برامج بكالوريوس وماجستير ودكتوراه في التفسير والفقه والأصول والعقيدة والقانون الإسلامي.',
  'https://www.aabu.edu.jo',
  'accredited',
  false,
  'بيانات تجريبية — يحتاج تحقق',
  now()
),
(
  'sudan-university-islamic',
  'جامعة أم درمان الإسلامية',
  'Omdurman Islamic University',
  'السودان',
  'أم درمان',
  'جامعة إسلامية سودانية تأسست عام 1912م، تُعدّ من أقدم مؤسسات التعليم الإسلامي في أفريقيا جنوب الصحراء، وتضم كليات الشريعة والقرآن والدراسات الإسلامية.',
  'https://oiu.edu.sd',
  'unverified',
  false,
  'بيانات تجريبية — يحتاج تحقق',
  now()
),
(
  'qatar-faculty-shariah',
  'كلية الشريعة والدراسات الإسلامية — جامعة قطر',
  'Faculty of Sharia and Islamic Studies — Qatar University',
  'قطر',
  'الدوحة',
  'كلية تابعة لجامعة قطر، تُقدّم برامج في الشريعة والدراسات الإسلامية باللغة العربية، مع إمكانية الدراسة المدمجة.',
  'https://www.qu.edu.qa/sharia',
  'accredited',
  true,
  'بيانات تجريبية — يحتاج تحقق',
  now()
)
ON CONFLICT (slug) DO NOTHING;

-- برامج تجريبية للجامعة الإسلامية بالمدينة
WITH univ AS (SELECT id FROM universities WHERE slug = 'islamic-university-madinah' LIMIT 1)
INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details)
SELECT
  univ.id,
  v.program_name, v.faculty_department, v.specialization, v.degree_level, v.study_language, v.study_mode, v.duration, v.has_scholarship, v.scholarship_details
FROM univ,
(VALUES
  ('بكالوريوس الشريعة', 'كلية الشريعة', 'الفقه وأصوله', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', true, 'منحة حكومية شاملة (مسكن + مرتب شهري) لغير السعوديين'),
  ('بكالوريوس القرآن الكريم', 'كلية القرآن الكريم', 'القراءات والتجويد', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', true, 'منحة حكومية شاملة'),
  ('ماجستير الحديث الشريف', 'كلية الحديث الشريف', 'دراية ورواية', 'ماجستير', 'العربية', 'حضوري', '2 سنتان', true, 'منحة للمتفوقين')
) AS v(program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details)
ON CONFLICT DO NOTHING;

-- برامج تجريبية للأزهر
WITH univ AS (SELECT id FROM universities WHERE slug = 'al-azhar-university' LIMIT 1)
INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship)
SELECT
  univ.id,
  v.program_name, v.faculty_department, v.specialization, v.degree_level, v.study_language, v.study_mode, v.duration, v.has_scholarship
FROM univ,
(VALUES
  ('بكالوريوس أصول الدين', 'كلية أصول الدين', 'العقيدة والفلسفة', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false),
  ('بكالوريوس الشريعة والقانون', 'كلية الشريعة والقانون', 'الفقه المقارن', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false),
  ('ماجستير التفسير وعلوم القرآن', 'كلية أصول الدين', 'التفسير وعلوم القرآن', 'ماجستير', 'العربية', 'حضوري', '2 سنتان', true)
) AS v(program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship)
ON CONFLICT DO NOTHING;

-- شروط قبول للجامعة الإسلامية بالمدينة (أول برنامج)
WITH prog AS (
  SELECT up.id FROM university_programs up
  JOIN universities u ON u.id = up.university_id
  WHERE u.slug = 'islamic-university-madinah' AND up.degree_level = 'بكالوريوس' LIMIT 1
)
INSERT INTO admission_requirements (program_id, requirements, required_documents, application_steps, application_deadline, application_url)
SELECT
  prog.id,
  '["الحصول على شهادة الثانوية العامة أو ما يعادلها","أن يكون المتقدم مسلماً","ألا يتجاوز العمر 25 سنة عند التقديم","اجتياز اختبار اللغة العربية للطلاب غير الناطقين بها"]'::jsonb,
  '["صورة من شهادة الثانوية العامة مصدقة","شهادة إسلام (للمسلمين الجدد)","صورة من جواز السفر","صورتان شخصيتان","شهادة حسن السيرة والسلوك","شهادة اللياقة الطبية"]'::jsonb,
  '[{"step":1,"text":"تسجيل حساب على البوابة الإلكترونية للجامعة"},{"step":2,"text":"ملء استمارة التقديم الإلكترونية"},{"step":3,"text":"رفع المستندات المطلوبة"},{"step":4,"text":"سداد رسوم التقديم (إن وجدت)"},{"step":5,"text":"انتظار نتيجة الفحص والقبول"},{"step":6,"text":"استكمال إجراءات الابتعاث عبر الملحقية الثقافية"}]'::jsonb,
  'تفتح عادةً في شهر ربيع الأول — راجع الموقع الرسمي للتواريخ المحددة',
  'https://apply.iu.edu.sa'
FROM prog
ON CONFLICT DO NOTHING;

-- أسئلة شائعة للجامعة الإسلامية بالمدينة
WITH univ AS (SELECT id FROM universities WHERE slug = 'islamic-university-madinah' LIMIT 1)
INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT univ.id, v.question, v.answer, v.order_index
FROM univ,
(VALUES
  ('هل تقبل الجامعة طلاباً من غير السعودية؟', 'نعم، الجامعة تستقبل الطلاب المسلمين من جميع دول العالم وتمنح منحاً حكومية شاملة.', 1),
  ('هل الدراسة مجانية؟', 'نعم، تُقدّم الجامعة منحاً شاملة تتضمن المسكن والمرتب الشهري وتذاكر السفر للطلاب المقبولين من خارج المملكة.', 2),
  ('ما هي لغة الدراسة؟', 'لغة الدراسة الرئيسية هي العربية، وتُقدّم الجامعة برامج تأهيلية للطلاب غير الناطقين بالعربية.', 3)
) AS v(question, answer, order_index)
ON CONFLICT DO NOTHING;
