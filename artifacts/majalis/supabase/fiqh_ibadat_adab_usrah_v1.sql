-- fiqh-ibadat (مسار fiqh): 2 عناصر → 3 (+ سيرة مؤلف الكتاب المرتبط
-- "إعانة الطالبين" [الإمام أحمد زين الدين المليباري صاحب "فتح المعين"،
-- ت987هـ] ومكانته الواسعة في المذهب الشافعي [دُرِّس في ملبار ومصر والشام
-- والحجاز وجنوب شرق آسيا]. محاولة أولى لصفحة "إعانة الطالبين" أرجعت 404،
-- فاستُخدم مصدر بديل ناجح: صفحة "فتح المعين" (المتن الأصلي) نفسها.
INSERT INTO learning_items (unit_id, item_type, title, description, session_estimate, weight, sort_order, status, is_approved)
VALUES
('338f057b-00bb-4a72-b829-ba1f11a3fd1d', 'lesson', 'فتح المعين والإمام المليباري',
 '"إعانة الطالبين" (الكتاب المرتبط بهذا الكورس) هو حاشية على متن "فتح المعين" للإمام أحمد زين الدين بن عبد العزيز المَعْبَري المليباري الفناني الشافعي (ت 987هـ)، وهو نفسه شرح لمتنه الآخر "قرة العين بمهمات الدين". يُعَدّ "فتح المعين" من أهم كتب المذهب الشافعي وأشهرها، ودُرِّس على نطاق واسع في منطقة ملبار الهندية ومصر والشام والحجاز وجنوب شرق آسيا. من أشهر من كتب عليه حواشي: علي بن أحمد بن سعيد باصبرين، ومحمد نووي الجاوي البنتني، وعلوي بن أحمد السقاف.',
 1.0, 33.00, 3, 'published', true);

UPDATE learning_items SET weight = 34.00, updated_at = now() WHERE id = '529f1ca9-98df-4a04-873a-26f2b45ed8ff';
UPDATE learning_items SET weight = 33.00, updated_at = now() WHERE id = '48f4344f-d58e-4001-9f5b-1035948e2a3e';
UPDATE learning_paths SET total_sessions = 124, updated_at = now() WHERE slug = 'fiqh';

-- adab-al-usrah (مسار adab): 2 عنصران → 3 (+ حديث "كلكم راع وكلكم مسؤول
-- عن رعيته" — رقم 853 صحيح البخاري، كتاب الجمعة، عن ابن عمر — يخص شطره
-- الثاني تحديداً مسؤولية الزوج والزوجة في الأسرة، تحقَّق حرفياً عبر
-- WebFetch من نص صحيح البخاري الكامل على ويكي مصدر).
INSERT INTO learning_items (unit_id, item_type, title, description, session_estimate, weight, sort_order, status, is_approved)
VALUES
('bf1992e2-7cd8-4516-84c3-daa65bd74aa6', 'book', 'المسؤولية في الأسرة: كلكم راع',
 'حديث ابن عمر رضي الله عنهما، قال رسول الله ﷺ: «كلكم راعٍ وكلكم مسؤول عن رعيته... والرجل راعٍ في أهله وهو مسؤول عن رعيته، والمرأة راعية في بيت زوجها ومسؤولة عن رعيتها» — رواه البخاري في كتاب الجمعة (حديث 853). يؤصِّل الحديث لمسؤولية الزوجين معاً عن الأسرة، كلٌّ فيما وُلِّي عليه، لا مسؤولية طرف واحد فقط.',
 1.0, 33.00, 3, 'published', true);

UPDATE learning_items SET weight = 34.00, updated_at = now() WHERE id = '4493fe71-f181-4d0a-8e67-48504764d87b';
UPDATE learning_items SET weight = 33.00, updated_at = now() WHERE id = 'fef43de3-1999-4e5f-8e61-58c804353de5';
UPDATE learning_paths SET total_sessions = 10, updated_at = now() WHERE slug = 'adab';
