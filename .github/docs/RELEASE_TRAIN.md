# Release Train (قطار الإصدار)

مرّتان يوميًا في **06:00** و**18:00 بتوقيت الكويت** (UTC 03:00 / 15:00) يجمع النظام PRs المؤهلة، يختبرها، يدمجها squash بالتتابع، يتحقق من `main`، ثم يفحص الإنتاج ويتراجع عند الفشل.

## وسم PR للمشاركة في القطار

إلزامي:

1. `release-train-ready`
2. وسم مجال واحد على الأقل:
   - `security-safe` | `code-safe` | `performance-safe` | `maintenance-safe` | `content-safe` | `tests-safe`

PR يجب أن يكون Ready (غير Draft)، بدون تعارض، وليس `CHANGES_REQUESTED`.

## فحوصات مطلوبة قبل الدمج في القطار

| فحص | الشرط |
|---|---|
| Verify build | دائمًا pass |
| preview-smoke | ليس fail/pending |
| postgres-integration | إلزامي عند مسارات SQL |
| xcodebuild-simulator | إلزامي عند مسارات iOS |

## مستويات المخاطرة

| Level | المعنى | السلوك |
|---|---|---|
| A | محتوى/اختبارات/إصلاحات آمنة | دمج بعد تحقق محلي خفيف |
| B | UI بسيط / refactor / ≤15 ملفًا | تحقق محلي أشمل (`test`) |
| C | SQL/Auth/RLS/iOS/Cron/vercel.json/>40 ملفًا | استبعاد + تعليق — **مراجعة بشرية** |

حدود الدفعة: **8 PRs** أو **80 ملفًا تراكميًا**.

## التشغيل

- تلقائي: `.github/workflows/scheduled-release-train.yml`
- يدوي: Actions → Scheduled Release Train → Run workflow (`dry_run` متاح)
- منطق: `.github/scripts/release-train/`
- تقارير: `artifacts/release-train/reports/YYYY-MM-DD-HH.md`
- مصفوفة PRs: `pnpm run report:pr-matrix`

## علاقة بالدمج المستمر

`auto-merge-to-main.yml`:

- يتجاوز `release-train-ready` (ملك القطار)
- يوقف Auto-merge على Auth/SQL/iOS/Cron ويطلب مراجعة بشرية
- بلا undraft تلقائي
