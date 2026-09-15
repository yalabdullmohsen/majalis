# CI Throughput — قياس وإصلاح خط الأنابيب

تاريخ القياس: 2026-08-13 · عيّنة: آخر ~60 تشغيلًا عبر المستودع + آخر 20 لـ CI.

## جدول التشغيلات

| الاسم | متوسط (د) | وسيط (د) | مطلوب للدمج؟ | بلا داعٍ على PRs الويب؟ | إجراء هذا الـPR |
|---|---:|---:|---|---|---|
| CI (Verify build + شقيقات) | ~7.3 | ~8.4 | **نعم — Verify build فقط** | لا | الإبقاء؛ path-lane + concurrency موجودان |
| Vercel Check (PR) lint/typecheck/build | ~1.8 | ~2.0 | لا | **نعم — تكرار كامل لـ static+build** | أُوقف التشغيل التلقائي → `workflow_dispatch` فقط |
| Preview smoke | ~0.3 (+ انتظار نشر معاينة) | ~0.3 | لا | نعم إن أُوقف Preview | أُوقف التلقائي → `workflow_dispatch` |
| Auto Deploy main → production | ~1.8 | ~2.0 | لا (بعد الدمج) | لا | الإبقاء على `main` |
| Auto-ready and merge PRs | ~0.2 | ~0.2 | لا (مفعّل) | لا | الإبقاء |
| Resolve PR conflicts | ~0.4 | ~0.4 | لا | لا | الإبقاء |
| PR Safe Auto-Merge Report | ~0.4 | ~0.4 | لا | خفيف | الإبقاء |
| iOS Capacitor / native / TestFlight | — | — | لا | **نعم** (paths أصلًا) | الإبقاء + concurrency |
| mushaf-gates-nightly | — | — | لا | مجدول | الإبقاء |

## حماية `main` (مُثبَّت)

- Ruleset **Protect main** (`19782052`): الفحوصات المطلوبة = `Verify build` و`ci-required` (Skipped في بوابة إلزامية = فشل).
- `allow_auto_merge=true` · `delete_branch_on_merge=true`.
- **2026-08-13:** `strict_required_status_checks_policy` → `false` (لا يُجبر تحديث الفرع من main قبل كل دمج — يقلّل إعادة تشغيلات CI على الفروع المتراكمة).
- **2026-08-17:** `Color contrast` و`visual-snapshot` ضمن `needs` لـ Verify build عند `need_build`؛ `ci-required` يجمع البوابات ويرفض `Skipped`.

## ما طُبِّق في `fix/ci-throughput`

1. إلغاء تكرار **Vercel Check (PR)** على كل PR.
2. إيقاف **Preview smoke** التلقائي (لا معاينة = لا smoke مرتبط بها).
3. `artifacts/majalis/vercel.json`: نشر Git على **`main` فقط** (لا Preview لكل PR).
4. `concurrency.cancel-in-progress` على workflows كانت بلا مجموعة.
5. وثائق: هذا الملف + `REPO_INDEX.md` + بروتوكول الوكيل في `AGENT_THROUGHPUT.md`.

## الهدف المقيس

| مقياس | قبل (عيّنة) | هدف |
|---|---|---|
| PR → دمج (بعد خضرة Verify) | غالبًا >٦د بسبب التكرار/الانتظار/strict | **< ٦ دقائق** لـ PR بلا مصحف |
| انتظار الوكيل لـCI | عشرات الدقائق | **صفر** (`AGENT_THROUGHPUT.md`) |
| تشغيلات مكررة على نفس ref (lint+build خارج CI) | Vercel Check + CI | **صفر** تلقائيًا |

## ملاحظات

- Color contrast و visual-snapshot ضمن `needs` لـ Verify build عندما `need_build=true` (Skipped = فشل).
- المجمّع `ci-required` يفشل إن تُخطّيت بوابة إلزامية.
- بوابات المصحف داخل CI تُفعَّل بـ path-lane عند تغيير مسارات المصحف فقط؛ الكامل ليلاً.
- كاش التبعيات موجود في `.github/actions/setup-workspace` (pnpm store + node_modules + vite + tsbuildinfo + Playwright).

## جانب الوكيل (لا يضعف CI)

بروتوكول التنفيذ: `docs/AGENT_THROUGHPUT.md` (يشمل **Finalization Freeze** / `IMPLEMENTATION_FROZEN`).

| سلوك بطيء شائع | البديل الإلزامي |
|---|---|
| `verify:ci` بعد كل تعديل صغير | Focused Test + `verify:preflight` ثم `verify:ci` مرة واحدة |
| إعادة تشغيل كل jobs عند فشل تابع | أصلح أول job أصلي على نفس الفرع/PR |
| تخفيف gate/baseline لإخفاء فشل | أصلح المنتج؛ تعديل البوابة فقط بدليل عقد + جودة ≥ |
| Lighthouse/visual/native في كل مهمة | فقط Path-lane أو نطاق المهمة |
| استكشاف شامل بعد معرفة المسار | `REPO_INDEX` + قراءة الملفات المرشحة فقط |
| انتظار workflows اختيارية بعد ci-required | راقب required فقط ثم Delivery |

حوكمة نصية: `node --test scripts/__tests__/agent-throughput-policy.test.mjs` (ضمن `test:safe-auto-merge`).

---

## Baseline المقاس (2026-09-15) — قبل `cursor/ci-throughput-hardening`

عيّنة تشغيلات ناجحة على GitHub Actions (queue=0s في الكل):

| Scenario (PR/event) | Required jobs (فعلي) | Critical path ≈ | Duplicate / خطأ تصنيف | Bottleneck |
|---|---|---:|---|---|
| docs/agent policy (#34994087127) | build+static+repo+visual+color+LHCI+postgres | **8.2m** (repo-gates 418s) | `.cursor`/scripts صُنّفت frontend/risky بدل docs/ci-config | repo-gates + contrast |
| freeze docs (#35000926684) | نفس المسار الثقيل | **8.0m** | package.json → risky → postgres | repo-gates 365s |
| visual CSS (#35017033541) | build+static+repo+visual+color+LHCI | **8.8m** | صحيح نسبيًا | repo-gates 412s |
| mushaf (#35019375800) | +mushaf shards | **9.3m** | صحيح | build 258s + repo 314s |
| main full (#34996467151) | full incl. mushaf×8 | **10.2m** | `--full` متعمّد | repo-gates + mushaf |

### عمل مكرر مكتشف (قبل الإصلاح)

1. PRs وثائق/CI تُشغّل build+Playwright+postgres بلا حاجة (تصنيف خاطئ).
2. pre-commit + pre-push + `verify:ci` = typecheck/build حتى 3× محليًا.
3. visual/color/LHCI تبدأ دائمًا ثم تخرج حياديًا (حجز runner) بدل `if:` skip.
4. لا بصمة محلية لإعادة استخدام `verify:ci`.

### بعد الإصلاح (عقد مثبت بالاختبارات + path-lane)

| Scenario | Required jobs | Critical path المتوقع | Saved work |
|---|---|---|---|
| docs-only / `.cursor` | fast-lane فقط | classify+fast-lane+aggregators ≪ 2m | لا build/Playwright/postgres |
| ci-config (`package.json` scripts, actions) | fast-lane + policy tests | ≪ 2m | لا visual/LHCI/postgres |
| web-logic (`.ts` فقط) | build+static+repo | ≈ max(repo,build) بلا visual trio | تخطّي contrast/visual/LHCI |
| visual (CSS/TSX) | +visual+color+LHCI على نفس dist | ≈ كما قبل للمسار البصري | build once + artifact stamp |
| mushaf / native / mixed / full | كما يلزم Path-lane | بلا تكرار build | shard/native بدون postgres إلا risky |

محليًا: `verify:preflight` + fingerprint reuse لـ`verify:ci`؛ hooks سريعة بلا Vite في pre-commit.
