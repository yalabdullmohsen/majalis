# SUNNAH TOTAL TRUST — برنامج التحقق الشامل

**الحالة:** ACTIVE · **الفرع:** `cursor/sunnah-total-trust-audit`  
**المنتج:** `artifacts/majalis` فقط  
**ليس:** إعادة كتابة · توليد محتوى شرعي · حكم آلي على صحة النص الشرعي

## قواعد App Store (قيد المراجعة)

1. لا تعديل النسخة المقدمة في App Store Connect.
2. لا تغيير بيانات المتجر / Build المقدَّم أثناء هذا البرنامج.
3. التدقيق على فرع مستقل من `origin/main` + ويب + TestFlight المطابق للمصدر إن أمكن.
4. لا سحب من مراجعة Apple تلقائيًا.
5. خطأ حرج → `RELEASE_BLOCKER_CRITICAL` + إيقاف الدمج/النشر + `OWNER_DECISION`.
6. غير حرج → `POST_RELEASE_FIX` أو `NEXT_BUILD_FIX`.

## حالات المادة (فقط)

| الحالة | ظهور عام؟ |
|---|---|
| `VERIFIED_EXACT` | نعم |
| `VERIFIED_WITH_CORRECTION` | نعم |
| `LINGUISTICALLY_REVIEWED` | لا (لغة فقط) |
| `NEEDS_SCHOLAR_REVIEW` | لا |
| `NEEDS_SOURCE` | لا |
| `CONFLICTING_SOURCES` | لا |
| `BLOCKED_LICENSE` | لا |
| `DRAFT` | لا |
| `EXCLUDED` | لا |
| `NOT_APPLICABLE` | لا |

العام المسموح حاليًا في الواجهة يُدار بآليات النشر القائمة؛ هذا التصنيف **عقد تحقق** فوقها. لا SQL مستضاف بلا موافقة المالك.

## مبدأ المراجعة المزدوجة

افصل دائمًا: شرعي/مصدري · لغوي · بيانات/علاقات · عرض · ترخيص · خصوصية · بحث/SEO.

## مخرجات الآلة

| ملف | دور |
|---|---|
| `reports/total-trust/inventory-summary.json` | ملخص + findings |
| `reports/total-trust/content-inventory.json` | سجل عناصر المسارات |
| `reports/total-trust/route-coverage-matrix.json` | مصفوفة تغطية Routes |
| `docs/content-quality/TOTAL_TRUST_PHASE0.md` | تثبيت المستودع |

## أوامر

```bash
node scripts/total-trust-inventory.mjs
pnpm --filter @workspace/majalis run verify:protected-quran-byte-lock
pnpm --filter @workspace/majalis run test:total-trust-phase0
```

## PR

PR صغيرة لكل موجة (مرحلة أو نوع محتوى). ممنوع PR عملاقة واحدة.
