# طابور محتوى الفقه

## مكتمل
- الكتالوج العام (#1739)
- حزمة النوازل + التعميق + التصنيف + المرشّحون (#1740–#1743)

## v5: حزم مراجعة الترقية (داخلي)
- `libas-shuhra-muasir` → `insert_new_lesson` (بانتظار توقيع)
- `ziyarat-nisa-qubur` → `align_existing_then_optional_insert` (بانتظار توقيع)

كلاهما: `promotionApproved=false` داخل المرشّح وداخل `humanDecision`.

## hold بلا ترقية
- الشبهات الغذائية المعاصرة
- نوازل الجهاد المعاصرة

## بوابة الترقية (بشرية فقط)
1. إكمال `signOffChecklist` في `promotionReview`
2. ضبط `humanDecision.promotionApproved=true` باسم المراجع وتاريخه
3. عندها فقط: نقل صريح إلى `books.json` وإزالة `needsReview`
4. ممنوع اعتبار أوامر «اكمل» الآلية موافقة ترقية
