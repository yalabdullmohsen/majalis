# مصحف سُنّة — سبب جذري لتجربة القراءة (PR-0)

**البرنامج:** إعادة بناء مركزة لتجربة المصحف (سرعة · RTL · استقرار · وضوح)  
**المرحلة:** PR-0 — جرد إنتاج + Baseline + تصنيف أسباب (بلا إصلاح منتج لـGeometry/نص)  
**المسار الرسمي:** `/mushaf` · التحويل: `/quran/mushaf` → `/mushaf`  
**قارئ الإنتاج:** `NewMushafReader` (= `MushafViewport`) عبر `MushafReaderPage`  
**Commit أساس الجرد:** يُثبَّت في `docs/mushaf/mushaf-experience-pr0-metrics.json`  
**إعلان ممنوع في هذه المرحلة:** `SUNNAH_MUSHAF_EXPERIENCE_COMPLETE`

لا أرقام مخترعة. ما لم يُقَس على جهاز/جلسة = **NOT MEASURED**.

---

## 1) مسار الإنتاج (ما يُركَّب فعليًا)

```
AppRoutes.tsx
└─ Route /mushaf → SafeLazyRoute → MushafReaderPage (lazy)
   ├─ ScriptureScreen
   └─ MushafAppearanceProvider          (@/lib/mushaf-v2)
      └─ NewMushafReader (= MushafViewport)
         ├─ MushafPager (= MushafPageViewport)   [3 panes: next|current|prev]
         │  └─ PrefetchPage × ≤3 → MushafPage
         │     ├─ header (juz/hizb)              [data-component=MushafPageMetadataHeader]
         │     ├─ MushafOpeningSpreadLayout      [صفحتا الافتتاح فقط]
         │     ├─ AyahSelectionOverlay
         │     ├─ MushafSurahBanner              [عند بداية سورة داخل الصفحة]
         │     ├─ MushafBasmalaView / MushafVerseLayer → MushafAyahMarker
         │     ├─ MushafPageNumber
         │     └─ MushafBookmarkMarkers          [اللوحة الحالية فقط]
         ├─ MushafPageArrows
         ├─ MushafPageScrubber                   [عند تفعيل القدرة]
         ├─ MushafControlsLayer (+ DisplayMode + VerseMenu)
         ├─ QuranAudioPlayer → MushafAudioDock   [lazy]
         ├─ MushafTafsirSheet / MushafSearchSheet [lazy]
         └─ MushafBookmarkComposer / NavigationHighlightChip
```

| مطلوب بالاسم | حالة الإنتاج |
|---|---|
| MushafReader | `NewMushafReader.tsx` |
| MushafViewport | alias لـ `NewMushafReader` من `MushafReaderPage` |
| MushafPage / Layout / OpeningSpread | `MushafPage.tsx` · `page-layout-engine.ts` · `MushafOpeningSpreadLayout.tsx` |
| MushafPageHeader / Metadata | **لا مكوّن منفصل** — رأس juz/hizb داخل `MushafPage` |
| MushafSurahHeader | `MushafSurahBanner` عند صف `surah-header` فقط |
| MushafPageNumber / MushafAyahMarker | موجودان في شجرة الإنتاج |
| MushafSelectionLayer | `AyahSelectionOverlay` + تحديد في `MushafVerseLayer` |
| MushafGestureLayer | `useMushafPager` + مضيف `MushafPager` |
| MushafToolbar / Settings | `MushafControlsLayer` + `QuranSettingsRepository` (ليس `MushafSettingsSheet`) |
| Page arrows | `MushafPageArrows` |
| Audio | `AudioEngine` داخل القارئ + `QuranAudioPlayer` / `MushafAudioDock` |

### Legacy — مشابهة الاسم وليست في شجرة `/mushaf`

`VerifiedMushafReader` · `features/mushaf-madinah/MushafPage.tsx` · `MushafPageHeader` · `MushafAyahLine` · `MushafSettingsSheet` · `ImmersiveQuran*` · `styles/quran.css` (مسارات أخرى).

لا تُصلَح هذه الملفات ثم يُعلن نجاح تجربة `/mushaf`.

---

## 2) مسار Render

1. `MushafReaderPage` يحسب `bootPage` مرة، يبقي القارئ مركّبًا، ويحدّث `?page=` بـ `history.replaceState` فقط بعد الالتزام.
2. `NewMushafReader` يحمّل التخطيط عبر `loadMushafPage` / كاش (`qpc-page-data` LRU **12** + `mushaf-page-render-cache` **16**).
3. `MushafPager` يرسم **ثلاث** لوحات فقط (`next` · `current` · `prev`) مع `key={pageNumber}` لإعادة تدوير الجار.
4. `MushafPage` يرسم صفوف QPC الثابتة؛ نهاية الآية → `MushafAyahMarker` من `glyphText` (ليس رقمًا مكتوبًا يدويًا).
5. `useStableMushafLayout` مصدر هندسة العرض الوحيد (هاتف + لوحي؛ مسار iPad بعد #2283).

**صفحات DOM المحمّلة معًا:** **3** (مثبت بالكود في `MushafPager.tsx`).  
**ليس** 604 صفحة في DOM → `ALL_PAGES_RENDERED` = **غير موجود**.

---

## 3) مسار التقليب (RTL)

عقد `useMushafPager.ts` (معلّق في المصدر):

- ترتيب المسار LTR بصريًا: **next | current | prev** و`dir="rtl"` على الغلاف.
- **سحب لليمين (`dx > 0`) → صفحة +1 (التالية رقمًا).**
- سحب لليسار → صفحة −1.
- أسهم: التالي = `page+1` على حافة inline-start؛ السابق = `page-1`.
- لوحة مفاتيح: ArrowRight/PageDown → +1؛ ArrowLeft/PageUp → −1.
- حواف اللمس: relX ≥ 0.85 → +1؛ ≤ 0.15 → −1.

| مصدر | دالة فعلية | API مركزي مطلوب |
|---|---|---|
| Swipe / Flick | `useMushafPager` → `go` | **ناقص** `goToNextMushafPage` / `goToPreviousMushafPage` / `goToMushafPage` موحّدة عبر المكوّنات |
| أسهم | `MushafPageArrows` → `onNext`/`onPrev` من القارئ | نفس الفجوة — التعيين متسق اليوم (+1/−1) لكن مكرّر |
| لوحة مفاتيح / حواف | داخل `useMushafPager` | نفس العقد |

**سبب اتجاه «معكوس» المحتمل (فرضية مقيّدة بالكود، بلا قياس جهاز في PR-0):**

1. **توقّع مستخدم ≠ عقد المنتج:** بعضهم يتوقع «اتجاه ورقة المصحف» بشكل يخالف `dx>0 ⇒ +1` رغم اتساق الكود والتعليقات.
2. **ازدواج مسارات الالتزام** (pager `go` + reader `go` + أسهم) بلا واجهة مركزية — خطر انحراف مستقبلي أكثر من انحراف حالي مثبت.
3. **قياس على جهاز:** اتجاه السحب الفعلي / تعارض سهم↔Swipe = **NOT MEASURED** في هذه الجلسة.

حدود الصفحة: `clampMushafPage` يمنع 0 و605.

---

## 4) مسار التحديد

| بند | تنفيذ حالي |
|---|---|
| مصدر UI | `selectedVerseKey` في `NewMushafReader` |
| بث للكلمات/الشريط | `setMushafAyahSyncKeys` → `mushaf-ayah-sync-store` |
| ضغط آية / فاصل | `MushafVerseLayer` → `onSelectVerse` |
| تمييز بصري | `AyahSelectionOverlay` (`getClientRects`) |
| إلغاء التحديد | رقاقة «إلغاء التحديد» · مساحة فارغة · تقليب الصفحة يمسح الكروم |
| `MushafSelectionController` | **غير موجود** |

**خلل مثبت بالكود:** `clearSelection` **لا يعمل** أثناء `playing` / `buffering` / `loading` — قد يبقى التحديد ظاهريًا بلا إلغاء واضح أثناء التلاوة.

منع لوحة المفاتيح: `onSelectVerse` يستدعي `blur()` على هدف الآية إن ركّز — جزئي؛ لا تسجيل منهجي لـ`document.activeElement` قبل/بعد في DEV بعد.

---

## 5) مصادر اسم السورة ورقم الآية

| بيان | مصدر | أين يُعرض في الإنتاج |
|---|---|---|
| اسم السورة عند البداية | `layout.rows` نوع `surah-header` → `row.surah.nameArabic` | `MushafSurahBanner` |
| `headerSurahName` في التخطيط | يُحسب في `qpc-page-data` | **غير مرسوم** في `features/mushaf-reader/MushafPage.tsx` (الرأس = جزء/حزب فقط) |
| `MushafPageSurahLabel` | — | **ناقص** — لا تسمية سورة مستمرة في رأس كل صفحة 1–604 |
| رقم الآية | `charType === "end"` + `glyphText` من QPC | `MushafAyahMarker` |

---

## 6) مصادر إعادة Render / Mount

| مصدر | أثر | تصنيف |
|---|---|---|
| نافذة 3 صفحات كاملة من كلمات QPC | DOM ثقيل محدود | `EXCESSIVE_PAGE_DOM` (bounded) |
| `key={pageNumber}` على اللوحات | Mount للجار الداخل فقط | `PAGE_REMOUNT` (جار) |
| كل كلمة تشترك بـ`useMushafAyahWordSelected/Playing/...` | تضخيم تحديثات التحديد/التلاوة | `GLOBAL_STORE_SUBSCRIPTION` |
| `audio.onSnapshot` → عدة `setState` على القارئ | إعادة رسم شجرة كبيرة | `AUDIO_STATE_RERENDER` |
| تغيير المظهر / إعدادات | تحديث جذر المظهر | `SETTINGS_STATE_RERENDER` |
| تحديد آية + Overlay قياس | كلفة `getClientRects` | `SELECTION_RERENDER` + `EXPENSIVE_TEXT_LAYOUT` |
| انتظار خط الصفحة قبل الالتزام | تأخير التقليب | `FONT_LOADING_DELAY` |
| `/fonts/` في SW = stale-while-revalidate | خطر أصل قديم | `SERVICE_WORKER_STALE_ASSET` (خطر) |
| مفاتيح `readerKey` / `themeKey` على القارئ | غير موجودة | `READER_REMOUNT` مخفَّف |
| Prefetch بيانات/خطوط ±1..±2 + صوت | عمل شبكة/خطوط إضافي | `OTHER_CONFIRMED` |

عدّادات العمر في `mushaf-turn-telemetry` (`readerMount` / `pagerMount` / `pageRender`) موجودة؛ **أرقام جلسة جهاز لهذه المهمة = NOT MEASURED**.

---

## 7) CSS / خطوط / SW / كاش

**CSS على مسار الإنتاج (مستورد من القارئ/التحكم):**

- `mushaf-reader.css` · `mushaf-madinah.css` (+ `fonts-quran.css`) · `ayah-nav-selection.css` · `reader-page-chrome.css` · `reader-bookmarks.css` · `quran-audio-chrome.css` · `page-goto-dial.css` · `page-goto-visibility.css` · `mushaf-display-mode-control.css`

**بيانات الصفحة:** `/data/quran-v2/pages/page-NNN.json`  
**خطوط الصفحة:** `/fonts/qpc-v2/pN.woff2` عبر `useQpcPageFont` / `ensureQpcPageFont`  
**SW (`public/sw.js`):** بيانات quran-v2 = network-first؛ خطوط = SWR  

---

## 8) فجوات مقابل عقد إعادة البناء المطلوبة

| مطلوب | حالة PR-0 |
|---|---|
| نافذة صفحات محدودة | **موجودة سلوكًا (3)** — بلا وحدة تحكم مسمّاة |
| تثبيت Reader lifecycle | **جزئي** — لا remount على `?page=`؛ عزل صوت غير كامل |
| `goToNext/Previous/Page` مركزية | **ناقصة** |
| `MushafPageSurahLabel` لكل صفحة | **ناقصة** (`headerSurahName` غير معروض) |
| `MushafSelectionController` + إلغاء موثوق أثناء الصوت | **ناقص / معطّل جزئيًا أثناء التشغيل** |
| Gates الأسماء المطلوبة (`test:mushaf-reader-performance` …) | **لم تُضف بعد** — تتابع في PRs لاحقة |
| iPad fill | **مُعالَج في #2283** — Split View / Landscape جهاز = NOT MEASURED |
| Performance marks بالأسماء المطلوبة | تُضاف في هذا الـPR كـDEV فقط (انظر §10) |

---

## 9) ما أُصلح سابقًا وما يبقى مفتوحًا

**مُعالَج (مرجع):**

- عمود هاتف ضيق على iPad → مسار لوحي في `useStableMushafLayout` + `resolveTablet*` (#2283).
- قارئ واحد ثابت بدون remount على مزامنة URL الهادئة.
- نافذة 3 لوحات (ليست كل الصفحات).
- كاش تخطيط 12 / نموذج رسم 16.
- رقاقة «إلغاء التحديد» موجودة (مع قيد أثناء التشغيل).

**مفتوح لإصلاح منتج في PRs لاحقة (ليس هذا الـPR):**

- مركزية تنقّل الصفحات + اختبار اتجاه جهاز.
- تسمية سورة مستمرة في الرأس.
- عزل حالة الصوت عن Render الصفحة.
- إلغاء تحديد يعمل أثناء التلاوة + منع Keyboard/Zoom بأدلة.
- مصفوفة أداء جهاز + TestFlight.
- Gates الانحدار بالأسماء المطلوبة في المواصفة.

---

## 10) Instrumentation (PR-0)

| طبقة | ملف | ملاحظة |
|---|---|---|
| تقليب قائم | `mushaf-turn-telemetry.ts` | touchStart…activePageCommit · lifetime |
| علامات تجربة مطلوبة | `mushaf-experience-perf.ts` | `mushaf:route-start` … `mushaf:selection-complete` — **DEV** أو `localStorage mushaf-experience-perf=1` فقط |
| عقد توثيق | هذا الملف + `mushaf-experience-pr0-metrics.json` | لا رفع Bundle/CSS budget |

أرقام زمن الفتح/التقليب/الذاكرة على جهاز حقيقي في هذه المرحلة: **NOT MEASURED**.

---

## 11) سلامة القرآن (قيود لا تُمس في أي مرحلة)

ممنوع تغيير نص/تشكيل/وقف/أرقام/ترتيب/Page Mapping/`line_start`/`line_end`/عدد الأسطر/QPC/مصدر القرآن · ممنوع `transform:scale` أو letter-spacing على النص · ممنوع تعطيل mushaf-gates أو رفع الميزانيات لإخفاء فشل · أي اختلاف نص/هندسة = **RELEASE_BLOCKER_CRITICAL**.

البصمة المرجعية (من `public/data/quran-v2/SOURCE.json`): تُنسَخ في `mushaf-experience-pr0-metrics.json` وتُتحقق بالبوابة.

---

## 12) خطة PRs (بعد دمج هذا الجرد)

| PR | نطاق |
|---|---|
| **0** | هذا المستند + علامات DEV + بوابة جرد (الحالي) |
| 1 | Lifecycle + عزل حالة + توثيق نافذة الصفحات |
| 2 | تنقّل RTL مركزي + Swipe/أسهم |
| 3 | `MushafPageSurahLabel` / metadata |
| 4 | اكتمال علامات الآيات + gates |
| 5 | Selection controller + إلغاء + لا keyboard/zoom |
| 6 | iPad / Split View تحقق جهاز |
| 7 | عزل Audio + حفظ حالة Search/Index |
| 8 | مصفوفة أداء + Release/TestFlight |

كل PR من أحدث `origin/main` · لا خلط خارج المصحف · لا إعلان اكتمال قبل معايير القبول الصارمة.

---

## 13) حالة PR-0

**PARTIAL** — جرد إنتاج وأسباب مثبتة بالكود مكتملة؛ قياس جهاز / TestFlight / إصلاحات المنتج = لاحقًا.
