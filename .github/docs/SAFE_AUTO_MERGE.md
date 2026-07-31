# Safe Auto-Merge (الدمج التلقائي الآمن)

Auto-merge يبقى **مفعّلًا** للتعديلات البسيطة/المتوسطة بعد نجاح الفحوصات، مع منع التغييرات الخطرة.

## Labels مطلوبة (واحد على الأقل)

- `content-safe`
- `ui-safe`
- `code-safe`
- `tests-safe`
- `maintenance-safe`

بدون أحد هذه الوسوم → لا دمج تلقائي (مراجعة يدوية).

## شروط الدمج التلقائي

- PR ليس Draft
- لا يوجد `CHANGES_REQUESTED`
- لا تعارض / الفرع غير `BEHIND` عن `main`
- CI كامل ناجح (`Verify build`)
- `preview-smoke` ناجح
- `lint-typecheck-build` ناجح (يشمل **git diff clean** بعد البناء)
- حالة نشر Vercel `Vercel – majalis-majalis` ناجحة
- ≤ **40** ملفًا، بلا حذف كبير
- وسم آمن من القائمة أعلاه
- **ليس** موسومًا `release-train-ready` (يملكه قطار الإصدار)

## منع تلقائي → مراجعة يدوية

أي تغيير في:

- `supabase/migrations/**`
- `artifacts/majalis/supabase/**`
- `.github/workflows/**`
- `fastlane/**`
- `artifacts/majalis/ios/**`
- `package.json` / `pnpm-lock.yaml`
- `vercel.json`
- ملفات secrets/config الحساسة
- إشارات Auth / Security / RLS
- iOS أو CI/CD أو migration بشكل عام

## بعد الدمج إلى `main`

| ماذا | السلوك |
|---|---|
| موقع الويب | Vercel ينشر تلقائيًا من `main` |
| TestFlight | **لا** — فقط tag `v*.*.*` أو `workflow_dispatch` |
| Supabase migrations | **لا** — فقط `workflow_dispatch` + `apply=true` |

## التنفيذ

| ملف | دور |
|---|---|
| `.github/workflows/auto-merge-to-main.yml` | تفعيل `--auto --squash` بعد تقييم السياسة |
| `.github/workflows/pr-safe-merge-report.yml` | تقرير أهلية على كل PR |
| `.github/scripts/safe-auto-merge/` | المنطق + الاختبارات |

Bundle ID ثابت: `com.yousef.majlisilm`.
