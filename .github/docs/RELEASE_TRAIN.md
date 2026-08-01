# Release Train (قطار الإصدار)

مرّتان يوميًا في **06:00** و**18:00 بتوقيت الكويت** (UTC 03:00 / 15:00) يجمع النظام PRs المؤهلة، يختبرها، يدمجها squash بالتتابع، يتحقق من `main`، ثم يفحص الإنتاج ويتراجع عند الفشل عبر **rollback PR** (لا `git reset` مباشر على `main`).

## وسم PR للمشاركة في القطار

إلزامي:

1. `release-train-ready`
2. وسم مجال واحد على الأقل:
   - المفضّل: `safe:content` | `safe:ui` | `safe:test`
   - أو القديم: `security-safe` | `code-safe` | `performance-safe` | `maintenance-safe` | `content-safe` | `tests-safe` | `ui-safe`

PR يجب أن يكون Ready (غير Draft)، بدون تعارض، وCI أخضر (`Verify build`).

PRs الخطرة (Level C: SQL/Auth/iOS/workflows/api/package manager/…) **لا تُدمج** — يُترك تعليق استبعاد فقط.

## مستويات المخاطرة

| Level | المعنى | السلوك |
|---|---|---|
| A | محتوى/اختبارات/إصلاحات آمنة | دمج بعد تحقق محلي خفيف |
| B | UI بسيط / refactor / ≤15 ملفًا | تحقق محلي أشمل (`test`) |
| C | SQL/Auth/RLS/iOS/workflows/api/>40 ملفًا | استبعاد + تعليق على الـPR |

حدود الدفعة: **8 PRs** أو **80 ملفًا تراكميًا**.

## Smoke بعد الدمج

`/`, `/mushaf`, `/prayer-times`, `/lessons`, `/search`, `/api/healthz`, `/api/readyz`  
فشل 5xx أو `readyz` غير جاهز → rollback PR.

## التشغيل

- تلقائي: `.github/workflows/scheduled-release-train.yml`
- يدوي: Actions → Scheduled Release Train → Run workflow (`dry_run` متاح)
- منطق: `.github/scripts/release-train/`
- تقارير: `artifacts/release-train/reports/YYYY-MM-DD-HH.md`

## علاقة بالدمج المستمر

`auto-merge-to-main.yml` **يتجاوز** أي PR يحمل `release-train-ready` حتى لا يُدمَج مرتين — هذه الـPRs تنتظر القطار فقط.

للدمج الفوري (بدون انتظار القطار) راجع `.github/docs/SAFE_AUTO_MERGE.md`.
