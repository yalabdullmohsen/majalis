# Sunnah World-Class Product Polish — Baseline (PR-1)

**Program:** Sunnah World-Class Product Polish  
**Stage:** PR-1 — Measure only (لا إصلاح منتج هنا)  
**Measured commit:** `551aee391f03d7d59fa767411b7ea24f3d2ad86d` (`origin/main`)  
**Measured at:** `2026-09-20T06:05:59.137Z`  
**Environment:** local agent · `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build`  
**Metrics JSON:** `docs/performance/sunnah-world-class-baseline-metrics.json`  
**Product:** `artifacts/majalis`

لا أرقام مخترعة. ما لم يُقَس في هذه الجلسة = **NOT MEASURED**.

**App Store:** التطبيق قيد مراجعة Apple. هذا الخط أساس **للإصدار التالي فقط**. لا تعديل لـBuild المقدمة · لا سحب تلقائي · أي Crash/قرآن/خصوصية حرج → `RELEASE_BLOCKER_CRITICAL` + `OWNER_DECISION`.

مراجع مرتبطة (لا تُستبدل):  
`WHOLE_APP_BASELINE.md` · `ARCHITECTURE_BASELINE.md` · `docs/mushaf/MUSHAF_INTERNAL_PERFORMANCE_BASELINE.md` · `artifacts/majalis/docs/design/SUNNAH_VISUAL_LANGUAGE.md`

---

## 1) Bundle / Route chunks (مقيس في هذه الجلسة)

| Asset | File | raw B | gzip B | gzip KiB | Budget | Gate |
|---|---|---:|---:|---:|---|---|
| Entry JS | `index-CRX-qD-q.js` | 377625 | 117440 | **114.69** | ≤120 KiB (+320B) | pass |
| Icons JS | `icons-CO28lmET.js` | 72905 | 22749 | **22.22** | ≤30 KiB | pass |
| Main CSS | `index-BiNWIW9r.css` | 333989 | 60733 | **59.31** | ≤100 KiB | pass |
| MushafReaderPage JS | `MushafReaderPage-iDU1xf4G.js` | 75931 | 24861 | **24.28** | soft ≤40 KiB | pass |
| MushafReaderPage CSS | `MushafReaderPage-S1WEcgzp.css` | 155399 | 25625 | **25.02** | — | info |

**Soft warning (lazy, not entry fail):** `fiqh-books-BNbapBXO.js` gzip ≈ **251.5 KiB**.

**قفل الميزانيات:** لا رفع Entry/Icons/CSS/soft mushaf في هذا البرنامج. بوابة: `test:bundle-budget` + `test:world-class-polish-pr1`.

---

## 2) Runtime / journeys (NOT MEASURED في هذه الجلسة)

| فئة | أمثلة | Status |
|---|---|---|
| Startup | Cold / Warm / Resume / Deep link / Shell ready / FMC | NOT MEASURED |
| Interaction | Touch-to-feedback · Button/Card/Filter · Search typing · Sheet | NOT MEASURED |
| Navigation | Home→Section · Detail · Search · Lessons · Quran Hub→Mushaf · Back | NOT MEASURED |
| Rendering | Frame drops · Long tasks · CLS · Remounts · Memory · Dup requests | NOT MEASURED |
| Scroll FPS | Home · Quran Hub · Lessons | NOT MEASURED |
| Lighthouse / field CWV | هذه الجلسة | NOT MEASURED |

**مرجع تاريخي فقط (لا ادعاء تحسن):** `artifacts/majalis/scripts/perf-baseline.json` (2026-08-17) LCP 6300ms · TBT 560ms · CLS 0.033 · Perf 58.

---

## 3) جرد عيوب مرئية / ديون (من مصادر موجودة — بلا اختراع)

| تصنيف | Issue | Evidence | Wave |
|---|---|---|---|
| PARTIAL | شرائط جانبية خضراء على بطاقات عامة أُزيلت من DS؛ بقايا صفحات محلية محتملة | SVL PR-2 `#2150` · `card-decorative-strip-cleanup.css` | PR-7 |
| FAIL→fix pending | عمود 4px على هيرو الأقسام (`page-hero-mj--bleed`) — إصلاح في SVL PR-3 `#2151` (لم يُدمج بعد على main عند القياس) | `page-hero.css` على `551aee391` ما زال يحمل 4px حتى دمج #2151 | PR-7 / SVL-3 |
| PARTIAL | خط أخضر قصير تحت عناوين lobby/quran-hub | `section-lobby.css` · `quran-numbers.css` | PR-8/9 |
| PARTIAL | Card داخل Card في بعض Feature paths | SVL inventory | PR-7 |
| UNKNOWN | Touch lag / Dead touch / Ghost click على جهاز | لا harness في هذه الجلسة | PR-3 |
| UNKNOWN | Scroll jank / sticky jump | لا قياس FPS | PR-6 |
| PARTIAL | Entry قريب من السقف (114.69 / 120) | هذا القياس | PR-17 |
| REGRESSION risk | Lazy `fiqh-books` 251.5 KiB soft | `test:bundle-budget` warning | PR-17 |
| UNKNOWN | Flash theme / guest-before-session | بوابات startup نصية موجودة؛ لا قياس جهاز | PR-2 |
| UNKNOWN | Audio player overlap / ghost player | لا قياس جلسة | PR-11 |
| — | مصحف geometry/text | خارج نطاق التعديل؛ قياس عبر mushaf gates | PR-12 |

---

## 4) Instrumentation موجودة (عقد)

| Mark / API | مصدر |
|---|---|
| `mj:theme-applied` | `theme-preference.ts` |
| `mj:safe-area-ready` | `app-shell-stability.ts` |
| `mj:home-painted` | `HomeView.tsx` |
| `route-nav:<path>` | `App.tsx` |
| `ix:*` | `lib/interaction/perf-marks.ts` |

عقد البرنامج: `artifacts/majalis/src/lib/world-class-polish/marks-contract.ts` (لا استيراد من `main`/`App` في PR-1).

---

## 5) Protection gates

| مجال | Guard | سلوك |
|---|---|---|
| Bundle | `test:bundle-budget` | fail عند تجاوز Entry/Icons/CSS |
| World-Class baseline lock | `test:world-class-polish-pr1` | docs + metrics + budgets + marks + App Store policy |
| Capture | `scripts/sunnah-world-class-baseline.mjs` | يقرأ `dist/assets` فقط |
| Startup / Shell / CLS / LHCI / Mushaf / Contrast | بوابات المستودع الحالية | لا تخفيف |

---

## 6) نطاق PRs التالية (لا تنفيذ هنا)

| PR | موضوع |
|---|---|
| 2 | إقلاع ودخول (Splash → Shell) |
| 3 | استجابة ولمس |
| 4 | Motion Contract |
| 5 | تنقل وثبات صفحات |
| 6 | سلاسة تمرير |
| 7 | بطاقات وأسطح |
| 8 | طباعة ونصوص |
| 9 | SVL بصري مصقول |
| 10 | Light/Dark |
| 11 | مشغل صوت |
| 12 | مصحف (سلوك فقط، بلا نص/هندسة) |
| 13 | إشعارات وصلاة |
| 14 | بحث وفلاتر |
| 15 | iPhone/iPad/Web |
| 16 | وصول |
| 17 | أداء وذاكرة |
| 18 | صقل نهائي |

لا إعلان: `SUNNAH_WORLD_CLASS_POLISH_COMPLETE` حتى اكتمال الموجات + Production Smoke.

---

## 7) أوامر إعادة القياس

```bash
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
pnpm --filter @workspace/majalis run test:bundle-budget
node artifacts/majalis/scripts/sunnah-world-class-baseline.mjs --write
pnpm --filter @workspace/majalis run test:world-class-polish-pr1
```
