-- تدقيق verified_hadith_items — مجموعة nawawi40 (الأربعون النووية) دفعة ج-١١٢ (40/40 صفًا)
-- تصحيح 1: nawawi-32 — راوي حديث "لا ضرر ولا ضرار" في متن النووي نفسه هو أبو سعيد الخدري لا عبادة بن الصامت
-- (مؤكَّد مباشرة من نص متن الأربعين النووية: "عن أبي سعيد سعد بن مالك بن سنان الخدري رضي الله عنه")
UPDATE verified_hadith_items
SET narrator = 'أبو سعيد الخدري رضي الله عنه'
WHERE id = 'nawawi-32' AND collection = 'nawawi40' AND narrator = 'عبادة بن الصامت رضي الله عنه';

-- تصحيح 2: nawawi-33 — العزو الصحيح في متن النووي نفسه "رواه البيهقي وغيره" فقط،
-- لا يُسمّى الترمذي في العزو الأصلي (مؤكَّد من مصدرين مستقلين لنص متن النووي)
UPDATE verified_hadith_items
SET source_name = 'سنن البيهقي'
WHERE id = 'nawawi-33' AND collection = 'nawawi40' AND source_name = 'سنن البيهقي والترمذي';
