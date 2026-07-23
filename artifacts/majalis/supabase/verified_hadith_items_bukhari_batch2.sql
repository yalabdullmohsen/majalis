-- تدقيق verified_hadith_items — مجموعة bukhari الدفعة الثانية من اثنتين (30 صفًا)
-- idempotent: كل UPDATE مشروط بالقيمة القديمة الخاطئة فلا يتكرر تأثيره

-- تصحيحات أحادية المصدر (مطابقة مباشرة لرقم مسلم/بخاري الوحيد المذكور في source_name، بلا وسم)
UPDATE verified_hadith_items SET hadith_number = '2137' WHERE id = 'dhikr-01' AND hadith_number = '6407';
UPDATE verified_hadith_items SET hadith_number = '597' WHERE id = 'dhikr-04' AND hadith_number = '2731';
UPDATE verified_hadith_items SET hadith_number = '5678' WHERE id = 'sunnah-fitra-02' AND hadith_number = '5778';

-- تصحيحات اجتهادية (اختيار رقم البخاري عند ازدواج بخاري+مسلم في source_name، موسومة في needs-post-review.jsonl)
UPDATE verified_hadith_items SET hadith_number = '6409' WHERE id = 'dhikr-03' AND hadith_number = '6405';
UPDATE verified_hadith_items SET hadith_number = '6346' WHERE id = 'dhikr-05' AND hadith_number = '6308';
UPDATE verified_hadith_items SET hadith_number = '645' WHERE id = 'salah-03' AND hadith_number = '524';
UPDATE verified_hadith_items SET hadith_number = '615' WHERE id = 'salah-08' AND hadith_number = 'salah-aw';
UPDATE verified_hadith_items SET hadith_number = '2766' WHERE id = 'sunnah-fitra-03' AND hadith_number = '5747';
