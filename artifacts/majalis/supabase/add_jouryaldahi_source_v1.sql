-- =====================================================================
--  إضافة حساب الداعية جوري الضاحي إلى مصادر الدروس التلقائية
--  نفّذ في Supabase SQL Editor
--  التاريخ: 2026-07-01
-- =====================================================================

-- 1. إضافة المصدر إلى trusted_lesson_sources
INSERT INTO trusted_lesson_sources (
  name, platform, url, source_type, trust_level, auto_publish_allowed,
  country, city, category, active, feed_url, config
) VALUES (
  'جوري الضاحي',
  'instagram',
  'https://www.instagram.com/jouryaldahi',
  'instagram',
  'trusted',
  false,                -- auto_publish_allowed = false (تتطلب مراجعة قبل النشر)
  'الكويت',
  'العاصمة',
  'دروس',
  true,
  null,
  jsonb_build_object(
    'handle',          'jouryaldahi',
    'source_subtype',  'scholar_dawah',
    'description',     'الداعية جوري الضاحي — دروس دعوية وعلمية',
    'connector',       'og_tags',
    'gender',          'female',
    'notes',           'تمت الإضافة يدوياً — يلزم ربط حساب Instagram Business للجلب التلقائي'
  )
)
ON CONFLICT DO NOTHING;

-- 2. التحقق من الإضافة
SELECT
  id,
  name,
  platform,
  url,
  trust_level,
  auto_publish_allowed,
  active,
  config->>'handle' AS instagram_handle,
  config->>'source_subtype' AS subtype,
  created_at
FROM trusted_lesson_sources
WHERE config->>'handle' = 'jouryaldahi';

-- =====================================================================
--  ملاحظات مهمة بعد تنفيذ هذا الـ SQL:
--
--  1. لتفعيل الجلب التلقائي الكامل:
--     a. ادخل /admin/integrations/instagram
--     b. اضغط "ربط مصدر" وحدد "جوري الضاحي"
--     c. أدخل Instagram Business Account ID إن وُجد
--
--  2. الدروس المجلوبة تذهب إلى lesson_import_drafts بحالة "pending"
--     وتتطلب موافقة الأدمن قبل النشر
--     (auto_publish_allowed = false كإجراء حذر)
--
--  3. بعد التحقق من جودة المحتوى يمكن تغيير auto_publish_allowed إلى true:
--     UPDATE trusted_lesson_sources
--     SET auto_publish_allowed = true
--     WHERE config->>'handle' = 'jouryaldahi';
-- =====================================================================
