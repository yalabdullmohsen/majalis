-- ═══════════════════════════════════════════════════════════════════════════
-- hadith_authenticity_class_v1.sql
-- تصنيف صريح للأحاديث يمنع الاختلاط بين القوائم الثلاث:
--   sahih  = الأحاديث الصحيحة (يشمل الصحيح والحسن)
--   daif   = الأحاديث الضعيفة
--   mawdu  = الأحاديث الموضوعة والمكذوبة
--
-- هذا الملف لا يُنشئ أي محتوى ديني — يصنّف فقط الصفوف الموجودة اعتماداً على
-- حقل grade المُدخل بشرياً. أي صف بدرجة غير معروفة يبقى NULL (يُستبعَد من
-- القوائم الثلاث) حتى يُصنَّف بشرياً — ضماناً لعدم الاختلاط.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE verified_hadith_items
  ADD COLUMN IF NOT EXISTS authenticity_class text
  CHECK (authenticity_class IN ('sahih', 'daif', 'mawdu'));

-- تصنيف الصفوف الموجودة من درجة الحديث (grade) — بترتيب أولوية صارم
UPDATE verified_hadith_items
SET authenticity_class = CASE
  WHEN grade ~ 'موضوع|مكذوب|مختلق|باطل|لا أصل'      THEN 'mawdu'
  WHEN grade ~ 'ضعيف|منكر|واه|متروك|شاذ'            THEN 'daif'
  WHEN grade ~ 'صحيح|حسن'                            THEN 'sahih'
  ELSE authenticity_class  -- درجة غير معروفة → يبقى NULL (لا يُنسب لأي قسم)
END
WHERE authenticity_class IS NULL;

CREATE INDEX IF NOT EXISTS idx_hadith_authenticity
  ON verified_hadith_items (authenticity_class, verification_status);

-- تقرير سريع بالتوزيع بعد التصنيف
DO $$
DECLARE r RECORD;
BEGIN
  RAISE NOTICE 'توزيع تصنيف الأحاديث:';
  FOR r IN
    SELECT coalesce(authenticity_class, '(غير مصنَّف)') AS cls, count(*) AS n
    FROM verified_hadith_items GROUP BY 1 ORDER BY 2 DESC
  LOOP
    RAISE NOTICE '  % : %', r.cls, r.n;
  END LOOP;
END $$;
