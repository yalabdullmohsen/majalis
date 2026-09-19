# Whole-App Excellence Baseline — PR-01 (WAVE 1)

**Program:** Sunnah Whole-App Excellence & Final Release  
**Stage:** WAVE 1 / PR-01 — Baseline + Protection Gates  
**Measured commit:** `6c197f577535a36f8feb9547abb5a02baa103f5d` (`origin/main`)  
**Measured at:** `2026-09-19T10:40:47.419Z`  
**Environment:** local agent · `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build`  
**Metrics JSON:** `docs/performance/whole-app-baseline-metrics.json`

لا أرقام مخترعة. ما لم يُقَس في هذه الجلسة = **NOT MEASURED**.

مراجع مرتبطة (لا تُستبدل):  
`docs/performance/ARCHITECTURE_BASELINE.md` · `docs/mushaf/MUSHAF_INTERNAL_PERFORMANCE_BASELINE.md`

---

## 1) Bundle / Route chunks (مقيس)

| Asset | File | raw B | gzip B | gzip KiB | Budget | Gate |
|---|---|---:|---:|---:|---|---|
| Entry JS | `index-uXAsnAaN.js` | 375057 | 117085 | **114.34** | ≤120 KiB (+320B) | pass |
| Icons JS | `icons-BA8uIA1L.js` | 72905 | 22749 | **22.22** | ≤30 KiB | pass |
| Main CSS | `index-Q_QQ-IFT.css` | 339627 | 61595 | **60.15** | ≤100 KiB (bundle) | pass |
| MushafReaderPage JS | `MushafReaderPage-CYy6e8Ai.js` | 75498 | 24748 | **24.17** | soft ≤40 KiB | pass |
| MushafReaderPage CSS | `MushafReaderPage-Bj5NLgEj.css` | 150913 | 24848 | **24.27** | — | info |

**Soft warning (lazy, not entry fail):** `fiqh-books-*.js` gzip ≈ **251.5 KiB**.

**قفل الميزانيات:** Entry/Icons/CSS عبر `test:bundle-budget`؛ سقف المصحف الكسول soft 40 KiB عبر بوابة هذا البرنامج.

---

## 2) Runtime / journeys (NOT MEASURED في هذه الجلسة)

| Metric | Status |
|---|---|
| Cold / Warm / Resume start | NOT MEASURED |
| Home readiness | NOT MEASURED |
| Route transitions · Sections · Lessons list/detail | NOT MEASURED |
| Search · Prayer · Quran Hub · Mushaf open · Settings | NOT MEASURED |
| Touch-to-response · Frame drops · Long tasks · CLS | NOT MEASURED |
| Duplicate requests · Render counts · Memory growth | NOT MEASURED |
| Lighthouse / field CWV (هذه الجلسة) | NOT MEASURED |

**مرجع تاريخي فقط (لا ادعاء تحسن):** `artifacts/majalis/scripts/perf-baseline.json` (2026-08-17) LCP 6300ms · TBT 560ms · CLS 0.033 · Perf 58.

---

## 3) Instrumentation موجودة (عقد)

| Mark / API | مصدر |
|---|---|
| `mj:theme-applied` | `theme-preference.ts` |
| `mj:safe-area-ready` | `app-shell-stability.ts` |
| `mj:home-painted` | `HomeView.tsx` |
| `route-nav:<path>` | `App.tsx` |
| `ix:*` | `lib/interaction/perf-marks.ts` |

عقد: `artifacts/majalis/src/lib/whole-app-excellence/marks-contract.ts` (لا استيراد من `main`/`App` في PR-01).

---

## 4) Protection gates (موجودة + قفل البرنامج)

| مجال | Guard | سلوك |
|---|---|---|
| Bundle | `test:bundle-budget` | fail عند تجاوز Entry/Icons/CSS |
| Critical CSS (عند وجود dist) | `critical-css-gzip-gate` | ≤60 KiB gzip |
| Startup / Shell | `test:startup-*` · `startup-shell-stability` · `product-evolution-p1-startup` | نصّي/عقد |
| CLS Home | `test:cls-home-gate` | منع قفزة Layout |
| LHCI budget | `test:lhci-budget` | عتبات مقفولة |
| Mushaf | `test:mushaf-gates:unit` + internal-perf | نص/هندسة/أداء مسار |
| Dark / Contrast | `test:on-dark-text-tokens` · heading-contrast | AA |
| Whole-App baseline lock | `test:whole-app-excellence-pr01` | docs + metrics + budgets + marks |

**قاعدة:** لا رفع لـ Entry/Icons/CSS/soft mushaf في هذا البرنامج.

---

## 5) نطاق الأمواج التالية (لا تنفيذ في PR-01)

PR-02 Startup · PR-03 Navigation/Motion · PR-04 Lessons/Search · … حتى PR-17 حسب برنامج Whole-App Excellence.

---

## 6) أوامر إعادة القياس

```bash
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
pnpm --filter @workspace/majalis run test:bundle-budget
node artifacts/majalis/scripts/whole-app-baseline.mjs --write
pnpm --filter @workspace/majalis run test:whole-app-excellence-pr01
```
