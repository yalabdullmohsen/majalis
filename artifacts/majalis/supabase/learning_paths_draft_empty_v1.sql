-- ═══════════════════════════════════════════════════════════════════════════
-- learning_paths_draft_empty_v1.sql
--
-- قرار هندسي: learning_paths.status عمود نصي بقيد CHECK يقبل فقط
-- ('draft','published','archived') — لا حاجة لعمود content_status جديد
-- (كان يتطلب ALTER TABLE + تعديل كل استعلامات src/lib/learning-paths-
-- service.ts التي تفلتر .eq("status","published") في 6+ مواضع، مخاطرة
-- أعلى بلا فائدة إضافية).
--
-- القرار: تصحيح البيانات نفسها بدل إضافة عمود. المسارات الثمانية التالية
-- كانت status='published' رغم total_sessions=0 فعلياً (لا محتوى منشور) —
-- تناقض بين الحقل وواقع المحتوى. usool-fiqh (كان التاسع) أُصلح بمحتوى
-- حقيقي في learning_path_usool_fiqh_pilot_v1.sql فاستُثني من هذه القائمة.
--
-- التأثير: fetchPathList() في learning-paths-service.ts يفلتر
-- .eq("status","published") — فتختفي هذه المسارات السبعة تلقائياً من
-- فهرس /learning/paths العام (لا صفحة منشورة فارغة مضلِّلة)، دون أي تعديل
-- كود إضافي. تبقى صفوفها كاملة في القاعدة لاستئناف العمل عليها لاحقاً —
-- فقط غيّر status إلى 'published' بعد إضافة محتوى حقيقي (بنفس نمط
-- usool-fiqh: path_stages → courses → course_units → learning_items →
-- course_books مربوطة بكتب حقيقية من src/lib/library-catalog.ts).
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_paths
SET status = 'draft', updated_at = now()
WHERE slug IN ('uloom-quran', 'adab', 'akhlaq', 'arabic', 'nahw', 'dawah', 'tarbiyah')
  AND total_sessions = 0
  AND status = 'published';

DO $$
DECLARE r RECORD;
BEGIN
  RAISE NOTICE 'حالة learning_paths بعد التصحيح:';
  FOR r IN SELECT slug, status, total_sessions FROM learning_paths ORDER BY sort_order
  LOOP
    RAISE NOTICE '  % : status=% sessions=%', r.slug, r.status, r.total_sessions;
  END LOOP;
END $$;
