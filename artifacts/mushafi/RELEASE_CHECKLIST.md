# Release Checklist — مصحفي / Tasmee3

## Final Freeze

- [ ] FEATURE_FREEZE.md تمت مراجعته.
- [ ] لا توجد ميزات جديدة قبل الإطلاق.
- [ ] CHANGELOG.md محدث.
- [ ] BUILD_COMMANDS.md موجود.
- [ ] PERFORMANCE_CHECKLIST.md تمت مراجعته.
- [ ] ACCESSIBILITY_CHECKLIST.md تمت مراجعته.

## Crash-free Startup

- [ ] التطبيق يفتح بدون إنترنت.
- [ ] التطبيق يفتح بدون إعداد ASR.
- [ ] التطبيق يعرض خطأ واضح إذا ملف القرآن ناقص.
- [ ] رفض إذن الميكروفون لا يسبب crash.
- [ ] رفض إذن الإشعارات لا يسبب crash.
- [ ] endpoint خاطئ لا يسبب crash.

## Offline Behavior

- [ ] Dashboard يعمل بدون إنترنت.
- [ ] سجل التسميع يعمل بدون إنترنت.
- [ ] SRS ومراجعة اليوم تعملان بدون إنترنت.
- [ ] PDF يعمل بدون إنترنت.
- [ ] التذكيرات تعمل بدون إنترنت.
- [ ] فحص القرآن يعمل بدون إنترنت.
- [ ] فقط محرك الخادم يحتاج اتصالا؛ وإلا يعمل تعرف الجهاز / رسالة واضحة.

## Quran Integrity

- [ ] تشغيل شاشة فحص ملف القرآن.
- [ ] عدد السور = 114.
- [ ] عدد الآيات = 6236.
- [ ] لا توجد آيات فارغة.
- [ ] لا توجد آيات مكررة.
- [ ] ترتيب السور والآيات صحيح.
- [ ] ملف القرآن من مصدر موثق ومرخص.
- [ ] صفحة مصادر القرآن موجودة.
- [ ] صفحة حدود التسميع موجودة.

## Pre-release commands

```bash
dart run scripts/check_quran_asset.dart
./scripts/quick_check.sh
./scripts/release_check.sh
```

## Product reminders

- [ ] التسميع معروض كأداة مساعدة تقنية بدقة تقريبية.
- [ ] لا يتم توليد نص القرآن بالذكاء الاصطناعي.
- [ ] fallback `speech_to_text` ما زال متاحا.
- [ ] سياسة الخصوصية توضح أن الصوت لا يُرسل إلا بإذن.
- [ ] version في pubspec يطابق CHANGELOG.

## Store Submission

- [ ] Google Play description reviewed.
- [ ] App Store description reviewed.
- [ ] Data safety draft reviewed.
- [ ] App privacy answers draft reviewed.
- [ ] Permission explanations reviewed.
- [ ] Screenshots checklist completed.
- [ ] Store submission checklist completed.
- [ ] Privacy policy hosted publicly.
- [ ] Review notes ready.
