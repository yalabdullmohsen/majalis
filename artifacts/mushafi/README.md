# مصحفي (Mushafi)

تطبيق مصحف Flutter احترافي هادئ للقراءة والتلاوة ومراجعة الحفظ.

> **تحذير شرعي وتقني:** قبل أي إصدار إنتاجي، تأكد أن ملف القرآن من **مصدر موثّق ومرخّص** ثم شغّل سكربت السلامة (`dart run scripts/check_quran_asset.dart`). لا يتم توليد نص القرآن بالذكاء الاصطناعي.

## التشغيل

```bash
export PATH="$HOME/development/flutter/bin:$PATH"
cd artifacts/mushafi
flutter pub get
dart run scripts/check_quran_asset.dart
flutter analyze
flutter test
flutter run
```

## Release Docs

- FEATURE_FREEZE.md
- RELEASE_CHECKLIST.md
- BUILD_COMMANDS.md
- PERFORMANCE_CHECKLIST.md
- ACCESSIBILITY_CHECKLIST.md
- PRIVACY.md
- SECURITY.md
- CHANGELOG.md
- STORE_SUBMISSION_CHECKLIST.md

## Release Candidate

Release candidate documents:

- `RELEASE_CANDIDATE.md`
- `RC_TEST_PLAN.md`
- `RC_SIGNOFF.md`
- `SMOKE_TEST_CHECKLIST.md`

Before store submission, complete all RC checklists and confirm that experimental server features are disabled by default.

## Post-Release

Post-release documents:

- `POST_RELEASE_MONITORING.md`
- `KNOWN_ISSUES.md`
- `HOTFIX_PLAN.md`
- `VERSIONING_POLICY.md`
- `V1_0_1_CHECKLIST.md`

The app includes local-only diagnostics and a copyable bug report form. No audio, API key, or Quran text should be included in diagnostics.

## Final Launch Lock

Final audit and launch lock documents:

- `LAUNCH_LOCK.md`
- `FINAL_AUDIT_REPORT.md`
- `LAST_10_STEPS_BEFORE_SUBMISSION.md`
- `FINAL_PRIVACY_REVIEW.md`
- `FINAL_STORE_REVIEW.md`
- `FINAL_TECHNICAL_REVIEW.md`

No new features should be added after launch lock except critical fixes.

## GO Release Execution

Practical release execution log:

- `GO_RELEASE_EXECUTION.md`
- `store_assets/app_store/review_notes_final.md`

Current store decision remains **NO-GO** until Android AAB/APK builds, device smoke, and a hosted Privacy Policy URL are completed. See `GO_RELEASE_EXECUTION.md`.

## Mushaf Reader

تمت إضافة تجربة مصحف داخل التطبيق من لوحة التسميع:

- صفحات قراءة بهوية مصحفي.
- تفاعل مع الآية.
- تفسير (عند توفر ملف مرخص).
- قراء (بدون روابط صوت غير مرخصة).
- فهرس.
- وضع ليلي.

ملاحظة:
لا يتم نسخ تصميم أو أصول تطبيقات أخرى. النص القرآني يأتي من ملف موثق داخل التطبيق. صفحات المصحف تُبنى من `quran_page_metadata.json` (placeholder حالياً حتى يتوفر ملف 604 صفحة موثوق ومرخص).

## Mushaf Interactions

يدعم المصحف:

- الضغط على الآية.
- الضغط المطول للتحديد.
- نسخ آية أو نطاق.
- مشاركة نصية.
- المفضلة.
- الملاحظات.
- العلامات.
- متابعة الختمة.
- آخر موضع قراءة.

## Advanced Khatmah Plans

يدعم المصحف خطط ختمة متقدمة:

- خطة ختمة بعدد أيام.
- ورد يومي محسوب تلقائيا.
- متابعة التقدم.
- إحصائيات قراءة.
- أرشيف ختمات.
- تسجيل صفحات مقروءة.

## Tasmee3 Results in Mushaf

يدعم التطبيق ربط نتائج التسميع بالمصحف:

- حفظ مواضع تحتاج مراجعة.
- تمييز الآيات في المصحف.
- تسجيل نطاق التسميع في الختمة بموافقة المستخدم.
- فتح مواضع المراجعة من المصحف.

## Mushaf to Tasmee3

يدعم التطبيق الربط بين المصحف والتسميع:

- اختيار آية من المصحف ثم بدء التسميع.
- تحديد نطاق آيات ثم بدء التسميع.
- حفظ آخر نطاق تسميع.
- فتح شاشة التسميع بنطاق جاهز.

## Khatmah Reminders

يدعم المصحف تذكيرا محليا بخطة الختمة:

- تذكير يومي بالورد.
- تنبيه إذا تأخر المستخدم عن الخطة.
- إعداد وقت التذكير.
- لا يتم إرسال أي بيانات خارج الجهاز.

## Mushaf Reading Settings

يدعم المصحف إعدادات قراءة:

- حجم الخط.
- تباعد الأسطر.
- تباعد الكلمات.
- ثيم القراءة.
- اختيار الخط عند توفر خطوط مرخصة.
- وضع ليلي وأسود.

لا يستخدم التطبيق خطوطا أو أصولا غير مرخصة.

## Mushaf Audio Player

يدعم المصحف مشغّل قراء داخل القارئ:

- اختيار قارئ.
- تشغيل آية / صفحة / نطاق.
- تكرار الآية والنطاق.
- مؤقت نوم.
- تظليل الآية الحالية.
- Mini Player.
- إعدادات صوت محفوظة محلياً.

لا تُضاف روابط صوت إلا إن كانت مرخصة وموثوقة (`audioBaseUrl` فارغ افتراضياً).

## Quran Search

يدعم المصحف البحث في القرآن:

- بحث عربي بدون تشكيل.
- نتائج بالسورة والآية.
- فتح النتيجة داخل صفحة المصحف.
- سجل بحث محلي.
- اقتراحات سريعة.

## Advanced Quran Search

يدعم البحث المتقدم:

- تمييز كلمات البحث.
- فلترة بالسورة والجزء.
- اقتراحات بحث من النص القرآني.
- فهرس بحث داخلي سريع.
- البحث في التفسير عند توفر ملف مرخص.
- فحص سلامة ملف التفسير.

## Offline Recitation Audio

يدعم المصحف تنزيل صوت الآيات للاستماع دون إنترنت إذا تم ضبط مصدر صوت مرخص.

- تنزيل آية.
- تنزيل صفحة.
- تنزيل نطاق.
- إدارة التنزيلات.
- حذف الملفات.
- تشغيل الملف المحلي إن وُجد، وإلا البث من الإنترنت.

لا يحتوي التطبيق افتراضيا على روابط صوت غير مرخصة.
التنزيل يتم بطلب المستخدم فقط.

## Ayah Image Sharing

يدعم المصحف مشاركة الآيات كصورة باستخدام تصميم خاص بمصحفي:

- خلفيات متعددة.
- معاينة قبل المشاركة.
- نسخ كنص.
- حفظ مؤقت للصورة قبل المشاركة.

لا يستخدم التطبيق قوالب أو أصول تطبيقات أخرى.

## Post-Submission Tracking

Post-submission materials:

- `post_submission/SUBMISSION_STATUS.md`
- `post_submission/google_play/GOOGLE_PLAY_REVIEW_TRACKER.md`
- `post_submission/app_store/APP_STORE_REVIEW_TRACKER.md`
- `post_submission/rejection_responses/`
- `post_submission/hotfix/`
- `post_submission/launch/`
- `post_submission/STORE_REJECTION_LOG.md`
- `post_submission/POST_SUBMISSION_CHECKLIST.md`

## Store Submission

Store submission materials are located in:

- `store_assets/google_play/`
- `store_assets/app_store/`
- `store_assets/screenshots/`
- `store_assets/legal/`

Checklist:

- `STORE_SUBMISSION_CHECKLIST.md`

Important:
Verify all privacy answers against the actual app behavior and third-party SDKs before submission.

## Store Release Materials

Release and store submission materials:

- `store_assets/app_metadata.md`
- `store_assets/google_play/`
- `store_assets/app_store/`
- `store_assets/legal/`
- `store_assets/screenshots/`
- `STORE_SUBMISSION_CHECKLIST.md`

Before submitting to stores, verify all privacy answers against the actual application behavior and third-party SDKs.

## البنية

Clean Architecture:

- `lib/core` — ثوابت، أخطاء، تطبيع عربي، ثيم
- `lib/design_system` — ألوان عاجية/ذهبية، زخارف CustomPainter أصلية
- `lib/features/quran` — المصحف، الفهارس، تخطيط الصفحة
- `lib/features/audio` — just_audio + MiniPlayer
- `lib/features/bookmarks` / `notes` / `search` / `khatmah` / `tarteel` / `settings`

State: **Riverpod** · Routing: **go_router** · Local store: **shared_preferences** (+ sqflite جاهز للتوسعة)

## بيانات القرآن

ضع الملف الموثّق هنا:

```
assets/data/quran_uthmani.json
```

الحقول المتوقعة: `surahs[]`, `ayahs[]` مع `textUthmani`, `pageNumber`, `juzNumber`, `hizbQuarter`, `bismillahPre`.

اضبط:

```json
{ "isMock": false, "isComplete": true }
```

ثم:

```bash
dart run scripts/quran_integrity_check.dart
```

يتحقق من: 114 سورة، 6236 آية، عدم فراغ الآيات، بسملة التوبة، توافق الصفحة/الجزء/الربع.

## Quran Data Integrity

قبل النشر (ملف التسميع في `assets/quran/quran_uthmani.json`):

```bash
dart run scripts/check_quran_asset.dart
```

يجب أن ينجح الفحص ويتأكد من:

* 114 سورة
* 6236 آية
* عدم وجود آيات فارغة
* وجود المفاتيح المطلوبة (`surah`, `ayah`, `textUthmani`)

لا يتم توليد نص القرآن بالذكاء الاصطناعي. راجع أيضاً `RELEASE_CHECKLIST.md` وشاشة «مصادر القرآن» داخل التسميع.

## الخطوط

- العائلة: `MushafiQuran` من `assets/fonts/`
- استبدل بخط عثماني مرخّص عند التوفر (مثل KFGQPC بإذن رسمي)
- `MushafiFontLoader` يتحقق من وجود الملف مع fallback آمن

## الصوت

- مشغّل المصحف (`features/mushaf`) يستخدم `just_audio` مع `RecitersCatalog` بدون روابط افتراضية غير مرخصة.
- التنزيل دون إنترنت عبر `MushafAudioDownloadService` وملفات تحت `path_provider`.
- لا تُفعَّل روابط الصوت إلا بعد التأكد من الترخيص.

## مراجعة الحفظ (بدل اسم تجاري)

- الواجهة: «مراجعة الحفظ»
- `QuranSpeechRecognizer` + `MockQuranSpeechRecognizer` (محلي، لا يرسل صوتًا)
- `ExternalApiQuranSpeechRecognizer` placeholder — يتطلب API Key + إذن ميكروفون صريح
- `MistakeDetectionEngine` للمقارنة بعد التطبيع

## الخصوصية المقترحة

- الملاحظات والمفضلة والختمة محلية افتراضيًا
- لا تحليلات خارجية دون موافقة
- لا إرسال تسجيلات في الـ Mock
- شاشة الخصوصية توضح معالجة الصوت قبل أي ASR سحابي

## الوضع البصري

- Light / Dark / Sepia
- خلفية عاجية `#FBF7EF`، زخرفة `#A77A48`، حبر `#11100E`
- صفحة بنسبة ≈ 9:16، أدوات تظهر عند اللمس فقط

## Final UX Polish

تم تحسين تجربة المصحف والتسميع:

- Mushaf Home.
- صفحة قراءة أنظف.
- قائمة آية منظمة.
- ربط أوضح بين المصحف والتسميع.
- نتيجة تسميع أوضح.
- Dashboard مرتب.
- Final UX checklist.
