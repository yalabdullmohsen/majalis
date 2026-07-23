-- تدقيق (ج-١١٣): جدول verified_hadith_items، مجموعة bukhari، الدفعة الأولى (30 صفًا من 60)
-- idempotent: كل UPDATE بشرط id محدد، آمن لإعادة التشغيل.

-- === تصحيحات أحادية المصدر بلا وسم (رقم واحد فقط في source_name، تصحيح مثبَت) ===
UPDATE verified_hadith_items SET hadith_number = '6474' WHERE id = 'bk6-02';
UPDATE verified_hadith_items SET hadith_number = '6306' WHERE id = 'bk6-04';
UPDATE verified_hadith_items SET hadith_number = '5988' WHERE id = 'buk-b01';
UPDATE verified_hadith_items SET hadith_number = '2072' WHERE id = 'buk-b02';
UPDATE verified_hadith_items SET hadith_number = '2162' WHERE id = 'buk-b04';
-- buk-b05: رقم الطبراني في المعجم الأوسط خاطئ داخل source_name نفسه (6026 خطأ، الصحيح 5787)
UPDATE verified_hadith_items SET hadith_number = '5787', source_name = 'المعجم الأوسط للطبراني (5787)' WHERE id = 'buk-b05';
UPDATE verified_hadith_items SET hadith_number = '39' WHERE id = 'buk-b07';
UPDATE verified_hadith_items SET hadith_number = '7846' WHERE id = 'buk-b08';
UPDATE verified_hadith_items SET hadith_number = '2559' WHERE id = 'buk-b10';
UPDATE verified_hadith_items SET hadith_number = '2893' WHERE id = 'buk-c04';
UPDATE verified_hadith_items SET hadith_number = '2702' WHERE id = 'buk-c05';
UPDATE verified_hadith_items SET hadith_number = '6493' WHERE id = 'bukhari-05';
UPDATE verified_hadith_items SET hadith_number = '3110' WHERE id = 'bukhari-06';
UPDATE verified_hadith_items SET hadith_number = '54' WHERE id = 'bukhari-10';

-- === تصحيحات اجتهادية (اختيار رقم البخاري عند ازدواج بخاري/مسلم في source_name) — تُوسم في needs-post-review.jsonl ===
UPDATE verified_hadith_items SET hadith_number = '10' WHERE id = 'bk6-01';
UPDATE verified_hadith_items SET hadith_number = '5973' WHERE id = 'bk6-03';
-- bk6-05: رقم بخاري خاطئ داخل source_name (2850 خطأ، الصحيح 2852) + اختيار بخاري على مسلم لـhadith_number
UPDATE verified_hadith_items SET hadith_number = '2852', source_name = 'صحيح البخاري (2852) وصحيح مسلم (1873)' WHERE id = 'bk6-05';
UPDATE verified_hadith_items SET hadith_number = '1479' WHERE id = 'buk-b06';
-- buk-b09: رقم بخاري خاطئ داخل source_name (6000 خطأ، الصحيح 6469) + اختيار بخاري على مسلم لـhadith_number
UPDATE verified_hadith_items SET hadith_number = '6469', source_name = 'صحيح البخاري (6469) وصحيح مسلم (2752)' WHERE id = 'buk-b09';
UPDATE verified_hadith_items SET hadith_number = '2652' WHERE id = 'buk-c01';
-- buk-c02: عزو بخاري خاطئ جسيمًا (3675 حديث أحد لأنس، لا علاقة له بحديث حراء لأبي هريرة) — يُحذف عزو البخاري كليًا، يبقى مسلم (2417) فقط
UPDATE verified_hadith_items SET hadith_number = '2417', source_name = 'صحيح مسلم (2417)' WHERE id = 'buk-c02';
UPDATE verified_hadith_items SET hadith_number = '5971' WHERE id = 'bukhari-02';
UPDATE verified_hadith_items SET hadith_number = '6011' WHERE id = 'bukhari-07';
UPDATE verified_hadith_items SET hadith_number = '2079' WHERE id = 'bukhari-08';
UPDATE verified_hadith_items SET hadith_number = '1325' WHERE id = 'bukhari-09';

-- === حذف: bukhari-01 — رقم بخاري (79) حديث مختلف تمامًا (مثل الغيث، أبو موسى الأشعري)،
-- والنص المخزَّن "العلم قبل القول والعمل" هو عنوان باب (ترجمة) مستنبط من آية سورة محمد:١٩،
-- وليس حديثًا مرفوعًا ولا أثرًا مسندًا برقم حديث حقيقي لمعاذ بن جبل بهذه الصياغة.
DELETE FROM verified_hadith_items WHERE id = 'bukhari-01';
