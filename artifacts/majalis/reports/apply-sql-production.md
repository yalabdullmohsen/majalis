# تشغيل SQL على إنتاج Supabase — قائمة يدوية

> لا يمكن لجلسة الوكيل تطبيق هذه الملفات بلا مفتاح `service_role`.  
> شغّلها من: Supabase Dashboard → SQL Editor → New query → الصق الملف → Run.

**تاريخ الفحص الآلي (anon):** 2026-07-26

## حالة الإنتاج المرصودة

| البند | الحالة |
|---|---|
| `scientific_miracles` | الجدول موجود و**فارغ** (العامة تعتمد seed محليًا) |
| عمود `verification_status` | **غير موجود** بعد — يلزم الترحيل أدناه قبل أي إدراج من لوحة الإدارة |
| تصنيفات العقيدة الأربعة | موجودة: `iman-billah` / `aqsam-tawheed` / `nawaqid-islam` / `aqeedat-ahl-sunnah` |
| دروس `aqsam-tawheed` / `nawaqid-islam` / `aqeedat-ahl-sunnah` / `iman-billah` | **مغطاة ببذرة واجهة** (`learn-library-aqeedah-batch3-seed.ts`) — يُفضَّل تطبيق `learn_library_v2_aqeedah_batch3.sql` الموسّع في SQL Editor للمزامنة الدائمة |
| دروس دفعة ١ (`aqeedah-intro`…`wala-bara`) | **مغطاة ببذرة واجهة** (`learn-library-aqeedah-batch1-seed.ts`) — يُفضَّل تطبيق `learn_library_v2_aqeedah_batch1.sql` للمزامنة الدائمة |
| `iman-billah` | فيه درس آخر (دورة القواعد المثلى)؛ batch3 يضيف درس «الإيمان بالله» إن لم يوجد بنفس العنوان |
| `qa_questions` | ≈ ٣٧١ صفًا — دفعات verify batch3–5 جاهزة في المستودع |

## ترتيب التشغيل المقترح

1. `artifacts/majalis/supabase/scientific_miracles_verification_status_v1.sql`  
   إضافة عمود التحرير قبل أي محتوى في الجدول.
2. `artifacts/majalis/supabase/learn_library_v2_aqeedah_batch1.sql`  
   مدخل العقيدة وأركان الإيمان والولاء والبراء (١٠ تصنيفات).
3. `artifacts/majalis/supabase/learn_library_v2_aqeedah_batch3.sql`  
   دروس العقيدة الأربعة (idempotent عبر العنوان + category).
4. بالترتيب وبعد مراجعة كل دفعة:  
   - `qa_questions_hadith_citations_verify_batch3.sql`  
   - `qa_questions_hadith_citations_verify_batch4.sql`  
   - `qa_questions_hadith_citations_verify_batch5.sql`  
   - وأي `qa_questions_phase2_test_row_cleanup.sql` إن لزم.

## تحقق بعد التشغيل

```sql
-- عمود التحرير
SELECT column_name FROM information_schema.columns
WHERE table_name = 'scientific_miracles' AND column_name = 'verification_status';

-- دروس العقيدة (دفعتا ١ و٣)
SELECT c.slug, count(l.id)
FROM categories c
LEFT JOIN lessons l ON l.category_id = c.id
WHERE c.slug IN (
  'iman-billah','aqsam-tawheed','nawaqid-islam','aqeedat-ahl-sunnah',
  'aqeedah-intro','iman-malaika','iman-kutub','iman-rusul','iman-yawm-akhir',
  'iman-qadar','mana-ibadah','shirk-anwauh','kufr-nifaq','wala-bara'
)
GROUP BY c.slug;
```
