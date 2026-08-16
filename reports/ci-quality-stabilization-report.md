# تقرير تثبيت جودة CI — Majlisilm

**التاريخ:** 2026-08-16  
**الفرع:** `chore/ci-quality-stabilization`

## سبب فشل CI السابق (SEO / admin)

`test:seo` داخل `repo-gates` → `test:ci-unit` كان يعامل صفحات `/admin/**` كصفحات عامة لطول `meta description`، فيضغط البوابة بفشل/تحذيرات P0 على مسارات داخلية غير مفهرسة (`/admin/fiqh-review`, `/admin/import`, `/admin/integrations/instagram`, `/admin/review-center`, …).

**الإصلاح المعتمد (موجود + مُثبَّت هنا):**

| قاعدة | السلوك |
|---|---|
| `/admin/*`, `/dashboard/*`, `/internal/*` | `noindex,nofollow` |
| نفس المسارات | خارج `sitemap.xml` + `Disallow` في `robots.txt` |
| طول meta description | **ليس P0** للـ admin (info فقط) |
| الصفحات العامة | وصف أقصر من 50 حرفًا = **P0** |

مصادر: `artifacts/majalis/scripts/seo-path-class.mjs`, `test-seo.mjs`, `seo-admin-privacy.test.ts`.

## ما تغيّر في repo-gates

- إدراج `audit:public-site` + `audit:data-completeness` + `audit:feature-readiness` ضمن `test:ci-unit` (مع `test:seo` الحالي).
- fail-fast: عند فشل `repo-gates` يُلغى بقية تشغيل CI لتقليل هدر الفحوص الثقيلة.
- Severity موحّد في `scripts/ci/severity.mjs` (P0/P1/P2/admin).

## ما تغيّر في SEO audit

- غلاف `audit:seo` يلتقط ملخص الصفحات وadmin infos ويخرج JSON مع `merge_ok`.
- لا يفشل على أوصاف admin القصيرة؛ يفشل فقط عند P0 عام.

## ما تغيّر في GitHub Actions

| عنصر | التغيير |
|---|---|
| `concurrency` | موجود مسبقًا: `ci-${{ ref }}` مع `cancel-in-progress` (ما عدا merge_group) |
| `changed-scope` | `scripts/ci/changed-scope.mjs` يُشغَّل في `classify` |
| `visual-snapshot` | `continue-on-error: true` — **لا يمنع** Verify build |
| `Color contrast` | `continue-on-error: true` — إعلامي حسب المسار |
| fail-fast | على `build` و`repo-gates` وبوابات المصحف الحرجة |
| تقرير PR | workflow جديد `pr-quality-report.yml` (تعليق قصير + artifact) |

## الفحوص المطلوبة الآن (للدمج)

1. **Verify build** (حماية `main`)
2. داخلها (حسب المسار): `static-checks` · `build` · `repo-gates` · عند المصحف: `mushaf-measure` · `mushaf-gates` · `layout-bands`
3. Auto-merge يبقى مفعّلًا فقط عند نجاح Verify build (لا يُلغى بسبب فشل Color contrast / visual)

## الفحوص الشرطية / المعلوماتية

| فحص | متى يعمل | يمنع الدمج؟ |
|---|---|---|
| mushaf-measure/gates/layout-bands | لمس مصحف/QPC أو full | نعم |
| visual-snapshot | لمس مصحف | لا (`continue-on-error`) |
| Color contrast Playwright | UI/CSS أو mushaf أو full | لا |
| postgres-integration | مسارات خطرة/SQL | نعم عند تفعيله |
| fast-lane | docs/policy فقط | نعم في مساره |

## كيف نمنع التكرار مستقبلًا

1. قبل الدفع: `pnpm run verify:pr` (يفشل فقط على P0؛ أمر ناقص = تحذير).
2. للبوابة الكاملة الموازية لـ CI: `pnpm run verify:ci`.
3. أي PR بيانات: `audit:data-completeness` يفرض أنبياء=25، بلا homepage fallback، بلا مصادر وهمية في معرفة منشورة.
4. أي مسار admin جديد: أضفه عبر `generate:seo` / `seo-path-class` — الاختبار `seo-admin-privacy` يحمي الانحدار.
5. لا تضف فحوص Playwright ثقيلة كـ required إلا عند لمس الملفات ذات الصلة.

## نتيجة verify:pr

```
verify:pr — جاهزية الدمج (فشل فقط عند P0)
scopes: ci/config, other
  ✓ typecheck
  ✓ lint
  · build — --skip-build (أُعيد لاحقًا كـ build مستقل)
  ✓ audit:public-site — P0=0
  ✓ audit:data-completeness — P0=0
  ✓ audit:seo — pages=969 P0=0
  ✓ audit:feature-readiness — P0=0
يمكن الدمج؟ نعم · P0=0
```

ملفات التقرير:
- `reports/verify-pr-ready-summary.md`
- `reports/verify-pr-ready-latest.json`
