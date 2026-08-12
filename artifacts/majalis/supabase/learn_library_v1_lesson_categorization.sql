-- ═══════════════════════════════════════════════════════════════════════════
-- ربط الدروس الـ28 الحقيقية المعتمدة في الإنتاج بالتصنيف الشجري الجديد —
-- ربط دقيق حسب عنوان كل درس فعليًا (لا تخمين)، بمعرّفات UUID صريحة.
-- ═══════════════════════════════════════════════════════════════════════════

-- تفسير (5)
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'tafseer')
WHERE id IN (
  '3a6d1b4c-7492-4fc2-b7e3-ec9f3f2e248b', -- تفسير القرآن الكريم
  '51bdbef6-52e3-4d72-885f-edb4cc22149f', -- تفسير سورة الكهف
  '0886d9b3-a781-47f5-9657-3068314920b8', -- تفسير سورة النحل
  'b5a70f72-155e-4724-a97d-f87d8d5072cc', -- تفسير سورة النحل - الآية 40 فما بعدها
  'f586e815-37b0-4a20-94db-095e0eb5cace'  -- قراءة كتب متنوعة والتفسير الواضح
);

-- حديث: عام / شروح كتب (شروح الأحاديث)
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'shuruh-ahadith')
WHERE id IN (
  'e00f40d1-6e06-4ac2-afde-fe782c1bda04', -- رياض الصالحين
  'a3c2336a-201f-43a6-999d-d00780f6b68b', -- صحيح البخاري
  '5c770d7e-be7c-4043-a9bd-9937eb5902c8', -- قراءة كتاب صحيح مسلم
  '8aa2cb01-2555-4708-9ba3-5a9db7f64645'  -- قراءة كتاب صحيح مسلم - الحديث 989
);
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'arbaeen-nawawiyya')
WHERE id = '6454dc34-d7e7-4c41-ae1c-88cc0c4713e7'; -- الأربعون النووية
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'difa-sunnah')
WHERE id = '14313e42-4025-4045-9599-f7d218a96c70'; -- دعوى تعارض السنة مع العلم التجريبي
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'mustalah-hadith')
WHERE id = 'aff6d9e5-1c4e-421c-a405-9dbf015bf174'; -- مصطلح الحديث

-- سيرة (الدروس الأصلية، بجانب سلسلة السيرة الكاملة الجديدة)
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'seerah-nabawiyya')
WHERE id IN (
  'd9795c35-5342-4b79-a27c-129771ef1cb0', -- السيرة النبوية
  'd8e8ae3f-64fa-4c5b-9129-731cd0fafa46'  -- السيرة النبوية المعمقة
);

-- عقيدة
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'iman-billah')
WHERE id = '4d00271c-3e55-430f-aacf-0e6e1a8b00a8'; -- القواعد المثلى في صفات الله وأسمائه الحسنى
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'aqeedat-ahl-sunnah')
WHERE id IN (
  '577b60a2-deaf-4bc0-9d94-45cd2b9a8c19', -- العقيدة الطحاوية
  '7bf2a0ed-9b14-4791-a335-a47e90b248bd'  -- العقيدة الواسطية
);
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'aqsam-tawheed')
WHERE id = 'ecefeb94-e257-42a3-a3ba-815c119eadf8'; -- شرح كتاب التوحيد
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'nawaqid-islam')
WHERE id = 'ffe04e69-f347-4947-8806-db7778249f6d'; -- نواقض الإسلام

-- فقه
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'ahadith-ahkam')
WHERE id = '3812a87c-34a9-4c82-8d50-8ede059d6691'; -- بلوغ المرام من أدلة الأحكام
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'madhahib-fiqh-muqaran')
WHERE id IN (
  '2a6b1214-a243-441d-bbfe-56a18023d7e7', -- الفقه الحنفي المقارن
  'd9e11595-f269-428f-924e-1178aed58a1f'  -- الفقه الشافعي
);
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'ibadat')
WHERE id IN (
  '208ac0ba-431d-405a-a8eb-f4f20f71431a', -- زاد المستقنع
  '37f34605-424f-485c-96ed-00cd51f50ad7', -- تلخيص مختصر المقنع
  'd986fb9b-03f9-4743-8fa7-5d80899812c9'  -- فقه العبادات
);
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'salah')
WHERE id = '5f684eff-44af-4c7e-a285-02dc1c0effd1'; -- شرح كتاب الصلاة من إعانة الطالب
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'ahkam-mara-khassa')
WHERE id = 'baf60e67-cd46-4538-a0f8-684edf0ddae7'; -- فقه المرأة المسلمة
UPDATE lessons SET category_id = (SELECT id FROM categories WHERE slug = 'fiqh-islami')
WHERE id = '0b8d71a0-656e-4d65-b2a3-cbbb50f3adeb'; -- منهاج المسلم (عام: عقيدة+فقه+أخلاق)
