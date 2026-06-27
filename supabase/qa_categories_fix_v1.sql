-- QA category taxonomy fix v1
-- Run in Supabase SQL Editor after backup

-- 1. Ensure canonical categories exist
INSERT INTO qa_categories (name, slug, description, sort_order)
VALUES
  ('العقيدة', 'aqeedah', 'التوحيد والإيمان', 1),
  ('الفقه', 'fiqh', 'أحكام فقهية عامة', 2),
  ('الطهارة', 'taharah', 'الوضوء والغسل', 3),
  ('الصلاة', 'salah', 'أحكام الصلاة', 4),
  ('الزكاة', 'zakat', 'أحكام الزكاة', 5),
  ('الصيام', 'sawm', 'رمضان والصيام', 6),
  ('الحج', 'hajj', 'الحج والعمرة', 7),
  ('السيرة', 'seerah', 'السيرة النبوية', 8),
  ('الأنبياء', 'anbiya', 'قصص الأنبياء والمرسلين', 9),
  ('الصحابة', 'sahabah', 'سيرة الصحابة', 10),
  ('التابعون', 'tabiin', 'التابعون وأتباعهم', 11),
  ('الحديث', 'hadith', 'مصطلح الحديث والسنة', 12),
  ('التفسير', 'tafsir', 'تفسير القرآن', 13),
  ('علوم القرآن', 'quran', 'التلاوة وعلوم القرآن', 14),
  ('الآداب', 'adab', 'آداب شرعية', 15),
  ('الأذكار', 'adhkar', 'الأذكار والأدعية', 16),
  ('الأسرة', 'family', 'الزواج والتربية', 17),
  ('المرأة', 'women', 'أحكام المرأة', 18),
  ('المعاملات', 'muamalat', 'بيع ومعاملات', 19),
  ('الأحكام', 'rulings', 'حلال وحرام', 20),
  ('التاريخ الإسلامي', 'history', 'تاريخ الأمة', 21),
  ('متفرقات', 'misc', 'أسئلة عامة', 99)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 2. Reclassify prophet-story questions from aqeedah → anbiya
UPDATE qa_questions q
SET category_id = (SELECT id FROM qa_categories WHERE slug = 'anbiya' LIMIT 1)
WHERE category_id IN (SELECT id FROM qa_categories WHERE slug IN ('aqeedah', 'tahara'))
  AND (
    question ~* '(من (أول|ال)?(رسل|نبي|أنبياء)|النبي الذي|إلى قوم (عاد|ثمود|لوط)|ابتلعه الحوت|كلمه الله|اتخذه.*خليل|نوح|إبراهيم|موسى|عيسى|يونس|هود|صالح|لوط|شعيب|ذو الكفل|قصص? (الأنبياء|المرسلين)|عليه(?:ه)?\s*السلام)'
  );

-- 3. Reclassify sahabah questions
UPDATE qa_questions q
SET category_id = (SELECT id FROM qa_categories WHERE slug = 'sahabah' LIMIT 1)
WHERE category_id IN (SELECT id FROM qa_categories WHERE slug = 'seerah')
  AND question ~* '(صحاب(?:ي|ة)|رضي الله عن|الخلفاء الراشد|أبو بكر|عمر|عثمان|علي بن|أمهات المؤمنين)';

-- 4. Audit log table for future corrections
CREATE TABLE IF NOT EXISTS qa_category_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES qa_questions(id) ON DELETE CASCADE,
  old_category_id uuid,
  new_category_id uuid,
  reason text,
  corrected_at timestamptz DEFAULT now()
);

-- 5. Log applied corrections
INSERT INTO qa_category_corrections (question_id, old_category_id, new_category_id, reason)
SELECT q.id, q.category_id, q.category_id, 'migration v1 — see qa_categories_fix_v1.sql'
FROM qa_questions q
WHERE false; -- placeholder; run audit script for live corrections
