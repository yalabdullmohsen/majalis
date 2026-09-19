# Architecture & Performance Baseline — PR-1

**Program:** Sunnah Internal Architecture & Performance Excellence  
**Stage:** PR-1 (Baseline + Instrumentation + Performance Guards)  
**Measured commit:** `e729831e2d95f2e1c8db135c5ec78e290f05c1d0` (`origin/main`)  
**Measured at:** `2026-09-19T06:29:04.935Z`  
**Environment:** local agent · `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build`  
**Machine metrics file:** `docs/performance/architecture-baseline-metrics.json`

لا أرقام مخترعة. ما لم يُقَس في هذه الجلسة مُعلَّم **NOT MEASURED**.

---

## 1) Bundle budgets (مقيس)

| Asset | File | raw B | gzip B | gzip KiB | Budget | Gate |
|---|---|---:|---:|---:|---|---|
| Entry JS | `index-D9E_Xkrp.js` | 394203 | 123173 | 120.29 | ≤120 KiB (+320B slack) | pass |
| Icons JS | `icons-CUnclxhB.js` | 72905 | 22749 | 22.22 | ≤30 KiB | pass |
| Main CSS | `index-Blv7h4zq.css` | 339479 | 61575 | 60.13 | ≤100 KiB (bundle) / ≤60 KiB gzip unit gate when dist present | pass (bundle) |

**Soft warning (lazy, not entry fail):** `fiqh-books-*.js` gzip ≈ **251.5 KiB** (> soft 150 KiB).

**أدوات القفل:** `artifacts/majalis/scripts/test-bundle-budget.mjs` · `test-critical-css-budget.mjs`

---

## 2) Runtime / CWV (NOT MEASURED في هذه الجلسة)

| Metric | Status |
|---|---|
| Cold start / warm start / resume | NOT MEASURED |
| Click-to-Shell / Click-to-Content | NOT MEASURED |
| Lesson detail progressive paint | NOT MEASURED (بوابة نصية موجودة) |
| Search typing lag / duplicate requests | NOT MEASURED |
| Memory after N route transitions | NOT MEASURED |
| Lighthouse / PSI field median (هذه الجلسة) | NOT MEASURED — مرجع تاريخي فقط أدناه |
| Home network request count | NOT MEASURED |

**مرجع تاريخي (لا يُستخدم كادعاء تحسن):** `artifacts/majalis/scripts/perf-baseline.json` (PSI mobile exam-7, 2026-08-17): LCP 6300ms · TBT 560ms · CLS 0.033 · Performance 58.

---

## 3) Instrumentation موجودة (عقد علامات)

علامات حالية في المنتج (DEV/قياس — لا تُضاف لـ Entry عبر هذا الـPR):

| Mark / API | مصدر |
|---|---|
| `mj:theme-applied` | `theme-preference.ts` |
| `mj:safe-area-ready` | `app-shell-stability.ts` |
| `mj:home-painted` | `HomeView.tsx` |
| `route-nav:<path>` | `App.tsx` |
| `ix:*` (`markInteraction`) | `lib/interaction/perf-marks.ts` |
| Boot vitals snapshot | `boot-vitals-snapshot.ts` |

عقد موحّد جديد: `artifacts/majalis/src/lib/architecture-excellence/marks-contract.ts`  
(قائمة أسماء إلزامية للبرامج اللاحقة — بلا استيراد من `main`/`App` في PR-1).

---

## 4) مشاكل مثبتة / ديون (من مصادر موجودة — بلا إعادة Audit)

| Issue | Evidence | Priority |
|---|---|---|
| Entry JS قريب من السقف (120.29 KiB gzip) | هذا القياس + `12_PERFORMANCE.md` | P0 |
| CSS حرج gzip ≈ 60.1 KiB (وحدة `critical-css-gzip` عند وجود dist) | هذا القياس؛ سبق توثيقه على main | P1 |
| Lazy chunk `fiqh-books` ضخم | softTop أعلاه | P2 |
| تاريخيًا: seeds / `select('*')` / icons barrel | `docs/performance/PERFORMANCE_BASELINE.md` (2026-07-30) | متابعة في PR-3/6/7 |
| Waterfalls Supabase | `12_PERFORMANCE.md` — Unknown قياس حالي | P2 |

---

## 5) Performance Guards (PR-1)

| Guard | Script / test | Behavior |
|---|---|---|
| Bundle budget | `test:bundle-budget` | fail on entry/icons/css exceed |
| Architecture baseline lock | `test:architecture-excellence-pr1` | docs + metrics + marks contract + no budget raise |
| Capture metrics | `scripts/architecture-excellence-baseline.mjs` | يقرأ `dist/assets` فقط؛ يفشل إن غاب dist |

**قاعدة الهامش:** لا رفع لـ Entry/Icons/CSS budgets في هذا البرنامج. أي تحسن لاحق يُقارن بهذا الملف + JSON.

---

## 6) نطاق PRs التالية (لا تنفيذ هنا)

PR-2 Startup/Shell · PR-3 Data/Cache · PR-4 Render/State · PR-5 Motion/Touch · PR-6 Splitting · PR-7 Dead code · PR-8 Memory/Offline · PR-9 Stress · PR-10 Full regression.

---

## 7) أوامر إعادة القياس

```bash
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
pnpm --filter @workspace/majalis run test:bundle-budget
node artifacts/majalis/scripts/architecture-excellence-baseline.mjs --write
pnpm --filter @workspace/majalis run test:architecture-excellence-pr1
```
