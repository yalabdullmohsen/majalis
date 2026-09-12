# Quran Experience Next Generation — خط الأساس (2026-09-12)

## المسارات والمكوّنات (Release)

| عنصر | القيمة المثبتة |
|------|----------------|
| Route الإنتاج | `/mushaf` (+ `/mushaf/page/:page`, `/mushaf/:surah`)؛ `/quran/mushaf` يحوّل إليه |
| Reader | `NewMushafReader` عبر `MushafReaderPage` |
| Feature flag | `ssunnah-mushaf-reader-v2` (افتراضي ON؛ تعطيل داخلي بـ `localStorage=0`) |
| مصدر النص | `public/data/quran-v2/pages/page-NNN.json` (mushafId=1 / QCF V2) |
| الخط | `public/fonts/qpc-v2/p{n}.woff2` |
| توزيع الصفحات | تخطيط QPC أسطر ثابتة من JSON (لا auto-fit للنص أثناء التقليب) |
| أرقام الصفحات/الأجزاء | بيانات quran-v2 + فهارس ثابتة في `quran-api` |
| البحث | `QuranSearchEngine` + `MushafSearchSheet` |
| التلاوة | `quranRecitationService` / AudioEngine (طبقة `QuranAudioController` واجهة) |
| التخزين المحلي | localStorage للفواصل/آخر صفحة/المظهر؛ كاش صفحات في الذاكرة |

## طبقات mushaf-v2

QuranDataSource · MushafPageRepository · MushafReaderController · QuranSearchEngine · QuranAudioController · QuranBookmarksRepository · **QuranSettingsRepository** · **QuranKhatmaRepository** (P2 OFF)

## قياسات الأداء (جهاز حقيقي)

| مقياس | القيمة |
|------|--------|
| زمن فتح المصحف | NOT MEASURED — Instruments Time Profiler على Release + جهاز |
| أول صفحة مستقرة | NOT MEASURED — علامة `mushafTurnMark("layoutComplete")` في DEV فقط |
| Touch latency / Frame time / Dropped frames / Hitch ratio | NOT MEASURED — Xcode Instruments Animation Hitches |
| Renderings / Measurements / Reader mount / Font load / Cache hit | جزئيًا عبر telemetry DEV؛ أرقام جهاز: NOT MEASURED |
| ذاكرة بعد 100 صفحة | NOT MEASURED — Allocations / Memory Graph |
| زمن البحث / الانتقال لنتيجة | NOT MEASURED — قياس محلي لاحق |
| حجم بيانات القرآن | 604 صفحة؛ بصمة SOURCE.json: ayahCount=6236 wordCount=83665 |

لا تُخترع أرقام. أي نشر يدّعي تحسنًا رقميًا دون قياس جهاز يُرفض.

## سلامة البيانات

- بوابة `quran-data-integrity` + `quran-data-review-gate` (بصمة + منع تعديل مرجعي دون موافقة).
- أي تعارض → حالة `QuranDataReviewRequired` وإيقاف الدمج.
- CODEOWNERS على مسارات quran-v2 / quran / qpc-v2.

## حالة المراحل

- **P0:** Reader واحد + Geometry/prefetch/cache (PR #1967) + SettingsRepository + fingerprint/review CI — قيد هذا الفرع.
- **P1:** فهرس/تفسير/تلاوة/ليل — أعلام ON جزئيًا؛ إكمال UX خلف نفس القارئ.
- **P2:** ختمة/ورد/حفظ/مشاركة — `khatmaWird/hifzMode/advancedShare = false`.
