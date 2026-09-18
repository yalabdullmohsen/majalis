# خط أساس برنامج تطوير «سُنّة» — المرحلة 0

**الغرض:** تثبيت أرقام وأدوات ومنع تراجع قبل أي ميزة تعليمية جديدة.  
**القاعدة:** لا رقم بلا مصدر قياس. أي خانة `NOT MEASURED` تبقى كذلك حتى يُشغَّل الأمر الموثّق.

| حقل | قيمة |
|---|---|
| التاريخ | 2026-09-18 |
| commit المقاس | `13931126ede38503dcf8749ad0558d1bb540ce2b` (`origin/main`) |
| المنتج | `artifacts/majalis` فقط |
| ملف الأرقام الآلي | [`baseline-metrics.json`](./baseline-metrics.json) |
| PR المستهدف | PR-01 (Baseline + regression budgets) |

---

## 1) منهجية القياس (أدوات المستودع فقط)

```bash
cd "$(git rev-parse --show-toplevel)"
git fetch origin main && git checkout -B measure origin/main
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
node artifacts/majalis/scripts/test-bundle-budget.mjs
node artifacts/majalis/scripts/test-critical-css-budget.mjs
pnpm --filter @workspace/majalis run test:product-evolution-p0
```

مراجع تاريخية (لا تُخلط مع قياس هذه الجولة):

- `artifacts/majalis/config/lhci-main-baseline.json` (LHCI معاينة 2026-08-29)
- `artifacts/majalis/scripts/perf-baseline.json` (PSI 2026-08-17)
- `artifacts/majalis/docs/PERFORMANCE_BASELINE.md`
- `docs/project-knowledge/12_PERFORMANCE.md`

---

## 2) Bundle — قياس هذه الجولة (بعد build على commit أعلاه)

| المقياس | القيمة المقاسة | الميزانية الحية | النتيجة |
|---|---:|---:|---|
| Entry JS gzip | **120.3 KiB** (`index-DvIZKdTl.js`) | ≤ 120 KiB + 320B slack | pass |
| Icons JS gzip | **22.2 KiB** | ≤ 30 KiB | pass |
| Main CSS gzip | **60.1 KiB** | ≤ 100 KiB | pass |
| react gzip | 3.3 KiB | vendor split | info |
| react-dom gzip | 54.2 KiB | vendor split | info |
| Critical CSS (raw main) | 339 479 B | ≤ 505 000 B | pass |
| Critical embedded | 13 460 B | ضمن بوابة critical | pass |

تحذير soft (ليس فشل entry): `fiqh-books-*.js` ≈ **251.5 KiB** gzip (محتوى كسول).

**سقف Entry عند الحد تقريبًا** — أي تضخم إقلاع في مراحل لاحقة يجب أن يفشل `test:bundle-budget` لا أن يُرفع السقف.

---

## 3) مقاييس تشغيل / تنقل — حالة القياس

| المقياس | القيمة | الأداة المطلوبة |
|---|---|---|
| Cold Start | NOT MEASURED | جهاز + Instruments / Chrome Performance |
| Warm Start | NOT MEASURED | نفس |
| Resume | NOT MEASURED | Capacitor foreground |
| Home → قسم | NOT MEASURED | `perf-marks` / DevTools |
| فتح قائمة دروس | NOT MEASURED | Network + marks |
| تفاصيل درس | NOT MEASURED | Network + marks |
| رجوع للقائمة | NOT MEASURED | cache/SWR + marks |
| بحث | NOT MEASURED | بحث موحّد + Network |
| عالم / سلسلة | NOT MEASURED | Network |
| قرآن / صلاة / إعدادات | NOT MEASURED | مسار يدوي + marks |
| Click-to-Shell | NOT MEASURED | mark بعد shell-stable |
| Click-to-Content | NOT MEASURED | mark بعد محتوى أساسي |
| Network / Duplicate requests | NOT MEASURED | HAR / DevTools |
| Route chunk load | NOT MEASURED | Network waterfall |
| Component mounts | NOT MEASURED | React Profiler |
| Long tasks | NOT MEASURED | PerformanceObserver |
| CLS حي | NOT MEASURED | RUM / LHCI جديد |
| Capacitor timings | NOT MEASURED | جهاز حقيقي |

مرجع LHCI سابق (معاينة، ليس هذه الجولة): CLS≈0.069 · LCP≈7056 ms · FCP≈4100 ms  
مرجع PSI سابق: Performance 58 · LCP 6300 ms · TBT 560 ms · CLS 0.033

---

## 4) بوابات منع التراجع (موجودة + مُفعَّلة في P0)

| مجال | بوابة / سكربت | ربط CI |
|---|---|---|
| إقلاع / Splash | `test:launch-splash-unified` + `startup-readiness-gate` + `startup-shell-stability-gate` | عبر `test:product-evolution-p0` → `test:launch-splash-unified` → `test:ci-unit` |
| App Shell | `verify:pageshell-gate` + readiness/shell gates | build + P0 |
| انتقال صفحات | `page-transitions-gate` داخل `test:native-feel` | `test:ci-unit` |
| تفاصيل درس | `test:lessons-domain` (`lesson-detail-progressive-gate`) | `test:ci-unit` |
| Bundle Budget | `test:bundle-budget` | `verify:ci` بعد build |
| بحث | `test:unified-search` | `test:ci-unit` |
| مصحف | `test:mushaf-page-flip` / mushaf gates | path-lane / ليلي حسب السياسة |
| تنقّل عام | `test:nav-active` | `test:ci-unit` |

عقد جاهزية الإقلاع الحالي (من البوابات): ثيم قبل First Paint · `#root` commit · `mj:shell-stable` مرة واحدة · لا أحداث جاهزية موسّعة · إخفاء Splash بعد استقرار الهيكل لا بعد بيانات Home.

---

## 5) ما يُعاد استخدامه (لا نظام موازٍ)

- `scripts/test-bundle-budget.mjs` · `performance-budget.json` · `check-performance-budget.mjs`
- `src/lib/boot-vitals-snapshot.ts` · `src/lib/interaction/perf-marks.ts` · `src/lib/rum-telemetry.ts`
- `src/lib/splash-screen.ts` · `src/lib/app-shell-stability.ts` · `index.html` boot
- بحث موحّد + Knowledge Platform P0 · مسارات تعلم/اختبارات موجودة خلف بوابات منفصلة

---

## 6) Rollback للمرحلة 0

- الوثائق والبوابة فقط؛ لا Migration ولا Feature Flag منتج.
- التراجع = حذف/عكس PR-01 دون مساس بميزانيات CI الحالية.

---

## 7) المرحلة التالية

**PR-02 / المرحلة 1:** إصلاح الإقلاع والدخول نهائيًا — يبدأ فقط بعد دمج هذه المرحلة، مع مقارنة Bundle ضد أرقام هذا الملف.
