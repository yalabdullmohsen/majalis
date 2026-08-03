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

## Release Candidate

- [x] RELEASE_CANDIDATE.md created.
- [x] RC_TEST_PLAN.md created.
- [x] RC_SIGNOFF.md created.
- [x] SMOKE_TEST_CHECKLIST.md created.
- [x] Experimental ASR features disabled by default.
- [x] Audio upload disabled by default.
- [x] Runtime config defaults are safe.
- [x] App works offline for local features.
- [x] App does not crash without ASR server.

## Post-Release Readiness

- [x] صفحة الدعم تعمل.
- [x] صفحة الإبلاغ عن مشكلة تعمل.
- [x] نسخ التشخيص يعمل.
- [x] نسخ تقرير المشكلة يعمل.
- [x] Hotfix plan جاهز.
- [x] Known issues جاهزة.
- [x] v1.0.1 checklist جاهز.
- [x] Versioning policy جاهزة.

## Final Launch Lock

- [x] LAUNCH_LOCK.md موجود.
- [x] FINAL_AUDIT_REPORT.md موجود.
- [x] LAST_10_STEPS_BEFORE_SUBMISSION.md موجود.
- [x] FINAL_PRIVACY_REVIEW.md موجود.
- [x] FINAL_STORE_REVIEW.md موجود.
- [x] FINAL_TECHNICAL_REVIEW.md موجود.
- [x] لا توجد ميزات جديدة بعد Launch Lock.
- [x] قرار GO / NO-GO موثق. *(حالياً NO-GO للمتاجر حتى اكتمال builds + smoke + Privacy URL)*

## Mushaf Page Metadata

- [ ] `assets/quran/quran_page_metadata.json` موجود.
- [ ] يحتوي 604 صفحة.
- [ ] كل صفحة تحتوي from/to surah/ayah.
- [ ] الفهرس يقفز للصفحة الصحيحة.
- [ ] لا يتم الادعاء بمطابقة مصحف المدينة إلا إذا metadata موثوق ومرخص.
- [ ] شاشة فحص بيانات الصفحات تعمل.

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
