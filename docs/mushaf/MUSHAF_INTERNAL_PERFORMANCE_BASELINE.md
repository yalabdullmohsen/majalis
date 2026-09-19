# Mushaf Internal Performance Baseline — PR-1

**Program:** Sunnah Mushaf Internal Architecture, Performance & Fluidity  
**Stage:** PR-1 (Baseline + Instrumentation + Guards)  
**Measured commit (bundle):** `ead50727dcfcfec8a1234eb474889e6fd638fdb3`  
**Measured at:** `2026-09-19T06:37:37.597Z`  
**Reader:** `new-mushaf-reader` · **Preset:** `sunnah-mushaf-signature-v1`  
**Metrics JSON:** `docs/mushaf/baseline/internal-perf-pr1/metrics.json` · `route-chunks.json`

لا أرقام مخترعة. ما لم يُقَس = **NOT MEASURED**.

---

## 1) سلامة النص والهندسة (مرجع مقيس سابق)

مصدر: `docs/mushaf/MUSHAF_NEXT_GEN_BASELINE.md` + `baseline/next-gen-pr1/summary.json`  
قياس Playwright: `2026-09-19T05:08:42Z` على commit `6788f6dd0`.

| فحص | نتيجة |
|---|---|
| overflow صفحة/سطر (عينات 1,2,5,100,221,459,604) | **false** |
| overlap | **false** |
| fontCheck | **true** |
| iPhone 390×844 frame | 386×768 · fontSize 24 |
| iPad 1024×1366 frame | 426×1290 · fontSize 24 (لوحة ضيقة نسبيًا) |

**PR-1 هذا لا يعيد قياس Geometry** — يعتمد المرجع أعلاه ويمنع التراجع عبر بوابات المصحف الحالية.

---

## 2) Bundle / Route chunks (مقيس الآن)

| Asset | File | gzip KiB |
|---|---|---:|
| Entry JS | `index-D9E_Xkrp.js` | **120.29** |
| MushafReaderPage JS | `MushafReaderPage-B6sJZIuH.js` | **24.51** |
| MushafReaderPage CSS | `MushafReaderPage-BO3C9eCb.css` | **23.80** |

Entry يبقى ضمن ≤120 KiB (+320B). مسار المصحف **lazy** (لا يدخل entry).

**Soft ceiling (توثيق):** MushafReaderPage JS gzip ≤ **40 KiB** — إن تجاوز لاحقًا دون مبرر → فشل بوابة البرنامج.

---

## 3) Cache contracts (مقيس وحدة سابقًا)

| Cache | Max | Evidence |
|---|---:|---|
| Page render model | **16** | `mushaf-page-render-cache.ts` + `render-cache-probe.json` |
| Layout (`qpc-page-data`) | **12** | next-gen baseline §3.1 |

Hit/miss سلوك: miss→put→hit→second hit· miss صفحة أخرى (probe).

---

## 4) Instrumentation موجودة

| API | ملف | ملاحظة |
|---|---|---|
| Turn marks (`touchStart`…`activePageCommit`) | `mushaf-turn-telemetry.ts` | DEV أو `localStorage mushaf-turn-telemetry=1` |
| Lifetime counters (mount/render/font/geometry) | نفس الملف | |
| Frame stats (p95/p99/dropped/hitch) | نفس الملف | |
| `ix:mushafPageTurn` | `lib/interaction/perf-marks.ts` | DEV |

عقد موحّد: `artifacts/majalis/src/features/mushaf-reader/mushaf-internal-perf-contract.ts`  
(لا يُستورد من `main` في PR-1).

---

## 5) NOT MEASURED في هذه الجلسة

- Tap-to-route / chunk load / font ready / first interactive (جهاز أو harness موسّع)
- Touch-to-move / swipe FPS / commit latency على لمس حقيقي
- Memory بعد 25/100 انتقال
- Dark / Reduced Motion زمن انتقال
- iPhone/iPad فيزيائي · Split View
- Page 300 ضمن عينة geometry السابقة (موجودة في البرنامج كهدف؛ العينة next-gen بلا 300)

---

## 6) FAIL / PARTIAL / UNKNOWN (استخراج فقط)

| بند | حالة | ملاحظة |
|---|---|---|
| Geometry integrity (عينات) | PASS (مرجع) | next-gen PR-1 |
| Mushaf lazy chunk size | PASS | 24.51 KiB gzip |
| Entry budget | PASS | 120.29 KiB |
| iPad canvas width utilization | PARTIAL | frame ≈426 على 1024 |
| Device swipe/FPS | UNKNOWN | NOT MEASURED |
| Dead touch / gesture arbitration | UNKNOWN | يحتاج قياس جهاز (PR-4) |
| React remount storms | UNKNOWN | telemetry موجودة؛ لا جلسة رقمية هنا |

---

## 7) Performance Guards (PR-1)

| Guard | Tool |
|---|---|
| Bundle entry lock | `test:bundle-budget` |
| Mushaf internal baseline lock | `test:mushaf-internal-perf-pr1` |
| Geometry anti-regression | بوابات `test:mushaf-page-flip` / integrity الحالية |
| Capture chunks | `scripts/mushaf-internal-perf-baseline.mjs` |

لا رفع Entry Budget. لا تعديل Baseline geometry لإخفاء تراجع.

---

## 8) نطاق PRs التالية

PR-2 Pager/recycle · PR-3 State isolation · PR-4 Gesture · PR-5 Motion · PR-6 Chrome · PR-7 Memory/prefetch · PR-8 iPad/web · PR-9 Stress/production.

---

## 9) أوامر

```bash
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
node artifacts/majalis/scripts/mushaf-internal-perf-baseline.mjs --write
pnpm --filter @workspace/majalis run test:mushaf-internal-perf-pr1
pnpm run verify:preflight && pnpm run verify:ci
```
