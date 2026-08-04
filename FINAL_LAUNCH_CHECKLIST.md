# Final Launch Checklist

## React (`artifacts/majalis`)

- [x] lint (`pnpm lint`)
- [x] build (`pnpm build` / filter majalis)
- [x] routes الأساسية سليمة (`/`, `/mushaf`, hubs)
- [x] لا أقسام محذوفة في sidebar/bottom/more
- [x] لا «من نحن» في sidebar
- [x] هيرو + بطاقات أهم الأقسام
- [x] بحث: placeholder ونصوص فارغ/خطأ
- [x] overflow-x مضبوط على المستوى العام
- [ ] مراجعة يدوية على جوال حقيقي (هيدر/تيكر/قائمة)

## Flutter (`artifacts/mushafi`)

- [x] `flutter pub get`
- [x] `flutter analyze`
- [x] `flutter test`
- [x] `dart run scripts/check_quran_asset.dart` (إن وُجد)
- [x] مصحف جديد في التنقل (`/mushaf-home`, `/mushaf`)
- [x] تسميع جديد فقط (`/tasmee3`)
- [x] no old mushaf في UI
- [x] no old tasmee3/AI في UI
- [x] شارات «المصحف الجديد» / «التسميع الجديد»
- [x] upload/WS/PCM disabled by default
- [x] لا يبدأ الميكروفون تلقائياً
- [ ] تجربة تسميع يدوية بجهاز حقيقي

## Content & Safety

- [x] لا تعديل لنص القرآن
- [x] لا توليد قرآن بالذكاء الاصطناعي
- [x] لا ادعاء «دقة نهائية» في واجهة التسميع
- [x] لا نسخ تطبيق آية أو أصوله
- [x] لا deploy / لا auto-merge / لا TestFlight في هذه الجولة

## Verdict

**GO للاختبار الداخلي** بعد نجاح analyze/test/build في الجلسة — مع QA يدوي للجوال والتسميع قبل أي إطلاق تجريبي عام.
