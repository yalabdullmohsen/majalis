# PR #2202 — Color Contrast Failures

**PR:** [#2202](https://github.com/yalabdullmohsen/majalis/pull/2202) · Visual Redesign V2 PR-2 Dashboard  
**Commit الفاشل:** `be06e7f49`  
**Gate:** `test:color-contrast-gate` (Playwright)  
**نطاق الإصلاح:** تباين فقط · بلا إعادة تصميم · بلا Layout · بلا Features

## 1. العناصر الفاشلة (CI)

| # | المسار | المحدد | النص | لون النص | لون الخلفية المقاسة | النسبة | المطلوب | السبب |
|---|---|---|---|---|---|---|---|---|
| 1 | `/` [light] | `.home-page-hero .page-hero-mj__title` | سُنّة | `#FFFFFF` | `#FFFCF8` (`--v2-color-ivory-surface`) | **1.02:1** | 4.5:1 (AA) | LOW_CONTRAST |
| 2 | `/` [light] | `.page-hero-mj__title` | سُنّة | `#FFFFFF` | `#FFFCF8` | **1.02:1** | 3:1 (عنوان) | LOW_CONTRAST |

تحذير غير حاجز (لا يدخل عدّ الفشل الحرج):

| المسار | ملاحظة |
|---|---|
| `/features-in-progress` [light] | title ≈ 1.02:1 — تحذير مسار العنوان العام؛ خارج نطاق فشل baseline لهذه الجولة |

## 2. Root Cause

تحت `html[data-v2-dashboard="1"]` فُرض لون عنوان أبيض (`--v2-color-on-emerald`) على بطاقة الترحيب، بينما `background-color` للبطاقة بقي **شفافًا** (`transparent !important` من قاعدة الهيرو القديمة).

بوابة التباين (`effectiveBg`) تصعد في الشجرة حتى تجد خلفية معتمة → وصلت إلى سطح العاجي `#FFFCF8`، فقاست **أبيض على عاجي** بدل أبيض على زمرد.

التدرج الزمردي كان على `::before` فقط، ولا يدخل في `getComputedStyle(...).backgroundColor`.

## 3. اللون الحالي → المقترح

| عنصر | قبل | بعد (إصلاح قياس) | النسبة المستهدفة |
|---|---|---|---|
| خلفية `.home-page-hero.page-hero-mj` (محسوبة) | شفاف → عاجي `#FFFCF8` | **صلب** `--v2-color-emerald` `#0F5C45` | — |
| عنوان `سُنّة` | `#FFFFFF` على `#FFFCF8` | `#FFFFFF` على `#0F5C45` | ≥ 4.5:1 (AA) · ≥ 7:1 AAA إن أمكن |
| الوضع الليلي للبطاقة | شفاف / ليلي قديم | صلب `--v2-color-emerald-deep` `#0A3D2E` + نص أبيض | ≥ 3:1 عنوان |

**لا تغيير لرموز الهوية V2** (`--v2-color-emerald` / `--v2-color-on-emerald` / ivory). الإصلاح = جعل الخلفية المحسوبة تطابق الخلفية المرئية.

## 4. النسب

| الحالة | النسبة |
|---|---|
| قبل (CI `be06e7f49`) | **1.02:1** (أبيض على `#FFFCF8`) |
| مستهدف | ≥ **4.5:1** (`.home-page-hero .page-hero-mj__title`) · ≥ **3:1** (`.page-hero-mj__title`) |
| بعد (محسوب أبيض على `#0F5C45`) | **7.96:1** |
| بعد (ليلي أبيض على `#0A3D2E`) | **12.21:1** |
| تحقق محلي | `pnpm --filter @workspace/majalis run test:color-contrast-gate` → **نجحت** (127 تأكيد انحدار + 189 مسارًا عامًا) |

## 5. ملف الإصلاح

| ملف | دور |
|---|---|
| `styles/components/home-brand-title.css` | خلفية زمردية **صلبة** + لون عنوان أبيض (حرج LCP / قياس التباين) |
| `styles/pages/home-dashboard-v2.css` | زخرفة `::before` / أزرار الهيرو (مؤجّلة مع HomeView — ميزانية CSS الحرج) |
| `docs/design/PR2202_CONTRAST_FAILURES.md` | هذا التقرير |

```css
html[data-v2-dashboard="1"] .home-page-hero.page-hero-mj {
  background-color: var(--v2-color-emerald, #0f5c45) !important;
  background-image: none !important;
}
```

التدرج يبقى على `::before` في `home-dashboard-v2.css` للشكل البصري فقط.

## 6. ممنوعات احُترمت

- لا تعطيل gate · لا تخفيف WCAG · لا استثناء محددات · لا تعديل snapshot · لا تغيير Dashboard/Layout/Features.
