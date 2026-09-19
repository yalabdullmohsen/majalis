# Mushaf Next-Gen — Baseline (PR-1)

**تاريخ القياس (UTC):** `2026-09-19T05:08:42Z`  
**Commit المقيس:** `6788f6dd067960c1a4c2a01cdffd2052347bd1aa` (`6788f6dd0`) — `origin/main` وقت التشغيل  
**الفرع المنتج لهذا المستند:** `cursor/mushaf-nextgen-pr1-baseline`  
**القارئ:** `new-mushaf-reader` · **Preset:** `sunnah-mushaf-signature-v1`  
**أداة القياس:** `artifacts/majalis/scripts/mushaf-madinah/measure.mjs` (Playwright Chromium headless) + بوابات الوحدة للكاش/التكامل  
**خام النتائج:** `docs/mushaf/baseline/next-gen-pr1/*.json`

> قاعدة: لا أرقام مخترعة. ما لم يُقَس في هذه الجولة يُعلَن صراحةً **غير مقيس**.

---

## 1) سلامة النص والهندسة (مقيس)

| فحص | نتيجة |
|---|---|
| `mushaf-604-integrity-gate` | pages=**604** · ayahs=**6236** · lineSlots=**8820** |
| overflow صفحة/سطر (measure) | **false** لكل الصفحات المقيسة |
| overlap حروف/slots | **false** لكل الصفحات المقيسة |
| fontCheck (document.fonts) | **true** لكل الصفحات المقيسة |
| hasPdf | **false** |
| نص QPC / تشكيل / ترتيب | لم تُمسّ في PR-1 (قياس فقط) |

صفحات العينة: **1, 2, 5, 100, 221, 459, 604**.

---

## 2) قياسات العرض (Playwright) — Light

### 2.1 iPhone viewport `390×844`

| page | ok | slots | ayahLines | fontSize px | frame W×H | pageType | chromeVisible |
|---:|:---:|---:|---:|---:|---|---|:---:|
| 1 | ✓ | 15 | 6 | 24 | 386×768 | opening | false |
| 2 | ✓ | 15 | 6 | 24 | 386×768 | lead | false |
| 5 | ✓ | 15 | 15 | 24 | 386×768 | normal | false |
| 100 | ✓ | 15 | 15 | 24 | 386×768 | normal | false |
| 221 | ✓ | 15 | 13 | 24 | 386×768 | surah-start | false |
| 459 | ✓ | 15 | 15 | 24 | 386×768 | normal | false |
| 604 | ✓ | 15 | 9 | 24 | 386×768 | surah-start | false |

المصدر: `docs/mushaf/baseline/next-gen-pr1/measure-iphone-390x844.json`

### 2.2 iPhone Pro Max viewport `430×932` (عينة)

| page | ok | frame W×H | fontSize |
|---:|:---:|---|---:|
| 1 | ✓ | 426×856 | 24 |
| 100 | ✓ | 426×856 | 24 |
| 604 | ✓ | 426×856 | 24 |

المصدر: `measure-iphone-pro-max-430x932.json`

### 2.3 iPad Portrait viewport `1024×1366`

| page | ok | frame W×H | fontSize | ملاحظة |
|---:|:---:|---|---:|---|
| 1–604 عينة | ✓ | **426×1290** | 24 | عرض اللوحة ≈ هاتف كبير؛ الشاشة العريضة لا تُستثمر بالكامل (جذر لاحق لـ PR iPad) |

المصدر: `measure-ipad-1024x1366.json`

### 2.4 لم يُقَس في هذه الجولة (أجهزة/ظروف)

- iPhone فيزيائي صغير / Pro / Pro Max (Device)  
- iPad 13 Landscape و Split View على جهاز  
- Dark mode عبر measure (القياس الحالي Light فقط؛ ثيم DOM عند الفتح الافتراضي light)  
- `prefers-reduced-motion` زمن انتقال فعلي  
- Touch-to-response / Swipe start / Page commit / Frame drops على جهاز لمس  
- Memory بعد 5 / 25 / 100 انتقال  
- زمن فتح البحث / الفهرس / التفسير / الصوت  
- CLS داخل القارئ (PerformanceObserver)  
- Save-Data / Offline جزئي  

هذه البنود تُقاس في PR لاحقة بأدوات الجهاز أو توسيع harness — **لا تُخمَّن**.

---

## 3) الكاش (مقيس وحدة)

### 3.1 تخطيط الصفحة (`qpc-page-data`)

- `mushaf-page-cache-gate.test.ts`: **ok**  
- `LAYOUT_CACHE_MAX = 12` (عقد موجود)  
- إعادة `getCachedMushafPage(5)` بعد التحميل تعيد نفس المرجع (hit)

### 3.2 نموذج الرسم (`mushaf-page-render-cache`)

مسبار وحدة (`render-cache-probe.json`):

| بند | قيمة |
|---|---|
| miss قبل put | true |
| hit بعد put | true |
| hit ثانٍ | true |
| miss لصفحة أخرى | true |
| `MAX_ENTRIES` | **16** |

---

## 4) الحزم (مقيس بعد build محلي)

| ملف | raw B | gzip B | KiB gzip |
|---|---:|---:|---:|
| `MushafReaderPage-*.js` | 76486 | 25093 | **24.50** |
| Entry `index-*.js` (مرجع) | 394203 | 123198 | 120.31 |

المصدر: `route-chunks.json` من `dist/assets` بعد  
`PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build` على commit أعلاه.

---

## 5) جرد Reader Chrome (من الكود — ليس زمن لمس)

### 5.1 الشريط العلوي (`MushafControlsLayer`)

أزرار ظاهرة في الصف عند `chromeOpen` (غير وضع تركيز كامل):

1. إغلاق (`nm-controls__exit`)  
2. وضع القراءة / إظهار (`nm-controls__focus`)  
3. رقم الصفحة (`nm-controls__page` — يفتح القفز)  
4. بحث  
5. فهرس  
6. تشغيل الصفحة (إن وُجد `onPlayPage`)  
7. المزيد  

عقد الإخفاء: `MUSHAF_CHROME_HIDE_MS = 4000`  
الافتراضي: `readerChromeVisible` يبدأ **false** (immersive) — مطابق لقياس `readerChromeVisible=false`.

### 5.2 أحجام CSS الحالية (عقد مرئي)

| رمز | قيمة |
|---|---|
| `--nm-chrome-exit-min` | 2.75rem (44px touch) |
| `--nm-chrome-arrow-size` | 2.5rem |
| `--nm-chrome-arrow-touch` | 2.75rem |
| `HEADER_H` / `FOOTER_H` | 36 / 40 px |
| `.nm-controls__btn` min-height | 2.2rem |
| أسهم: border+shadow في `reader-page-chrome.css` | border 2px + box-shadow خفيف |

### 5.3 ملاحظات جذرية للـPRs اللاحقة (من الجرد + القياس)

1. صف علوي بعدّة أزرار متساوية الوزن (ازدحام).  
2. زر الإغلاق بعرض/ارتفاع touch كامل يظهر «أثقل» من الثانوي.  
3. أسهم أسفل بحدّ وظل ولون ذهبي — وزن بصري عالٍ قرب النص.  
4. على iPad عرض اللوحة ~426px رغم viewport 1024 — تخطيط هاتف موسّع رأسيًا لا أفقيًا.  
5. Telemetry موجود (`mushaf-turn-telemetry.ts`) لكن معطّل افتراضيًا في الإنتاج — لم تُجمع أزمنة touch→settle في هذه الجولة.

---

## 6) Telemetry — عقد قياس لاحق (موجود في الكود)

Marks: `touchStart` · `firstPageMovement` · `pageDataReady` · `fontReady` · `layoutStart` · `layoutComplete` · `transitionStart` · `transitionSettled` · `activePageCommit`  

Lifetime counters: `readerMountCount` · `pagerMountCount` · `pageRenderCount` · `fontLoadCount` · `geometryChangeCount`  

تفعيل: DEV أو `localStorage mushaf-turn-telemetry=1`.

---

## 7) حدود منع التراجع المقترحة (مشتقة من هذا الـBaseline فقط)

| مقياس | حد PR لاحق | مصدر |
|---|---|---|
| overflow/overlap على صفحات العينة | يجب البقاء false | measure JSON |
| slots قياسية (=15 لغير الصفحتين الأولى عند عقد measure) | كما في `evaluateOk` الحالي | measure.mjs |
| `MushafReaderPage` gzip | ≤ **28 KiB** (هامش فوق 24.50) | route-chunks |
| `MAX_ENTRIES` render cache | = 16 ما لم يُوثَّق تغيير ذاكرة | كود |
| سلامة 604/6236/8820 | ثابتة | integrity gate |
| عدم لمس `public/data/quran*` / `public/fonts/qpc-v2` | diff فارغ على المصادر | byte-lock / review |

أزمنة اللمس/الذاكرة: **لا حد رقمي حتى تُقاس**؛ يُشتق لاحقًا من تشغيل telemetry على جهاز.

---

## 8) مخاطر متبقية (Owner / لاحق)

- قياس لمس حقيقي وذاكرة على iPhone/iPad فيزيائي.  
- Dark + reduced-motion في harness.  
- Landscape / Split View.  
- توسيع canvas على iPad دون كسر هندسة الصفحة.

---

## 9) نطاق PR-1

- توثيق Baseline + أرشفة JSON.  
- بوابة `mushaf-nextgen-baseline-gate` لمنع فقدان العقد أعلاه.  
- **لا** تغيير UI/أداء/نص قرآن في هذا الـPR.
