# منظومة عمليات المحتوى الذاتية — سُنّة (P0)

**النظام:** Sunnah Autonomous Content Operations System  
**العلامة:** سُنّة فقط  
**المرحلة الحالية:** P0 — الحماية فقط (بدون نشر تلقائي)

## ماذا اكتمل في P0

| مكوّن | المسار |
|---|---|
| Source Registry | `lib/content-ops/data/source-registry.json` + `source-registry.mjs` |
| Protected Content Registry | `lib/content-ops/data/protected-content-registry.json` + `protected-content-registry.mjs` |
| Risk Classification A/B/C | `risk-classifier.mjs` |
| Safe Change Policy | `safe-change-policy.json` + `safe-change-policy.mjs` |
| Versioning | `versioning.mjs` |
| Rollback (idempotent) | `rollback.mjs` |
| Security Controls | `security-controls.mjs` |
| Pipeline skeleton | `pipeline.mjs` |
| Tests + Gate | `scripts/content-ops/test-content-ops-p0.mjs`, `run-p0-gate.mjs` |

## قواعد صارمة

- `autoPublishEnabled: false` — لا نشر إنتاج من الأتمتة في P0.
- المستوى **C** (قرآن / حديث / فقه / أذكار مرجعية / …): رفض + `needs_specialist_review`.
- المستوى **B**: عزل في staging/draft/proposed فقط.
- المستوى **A**: يُصنَّف ويُختبر، لكن قرار النشر يبقى `hold_p0` حتى اكتمال بوابات P0 + تفعيل صريح لاحقًا.
- بيانات المستخدم معزولة عن تراجع المحتوى.

## الأوامر

```bash
pnpm --filter @workspace/majalis run content-ops:p0-gate
pnpm --filter @workspace/majalis run content-ops:test
```

## مراحل Pipeline (مُعلنة — النشر غير مفعّل)

Discover → Collect → Normalize → Deduplicate → Validate → Classify Risk → Correct → Test → Publish Safe Changes → Verify Production → Rollback on Failure → Report

## ما لم يُنفَّذ بعد (P1+)

التجميع اليومي، التدقيق اللغوي/المعلوماتي، الأحداث، لوحة الإدارة، الجدولة، النشر التلقائي للمستوى A.
