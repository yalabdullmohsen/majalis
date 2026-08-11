# تقرير تسريع CI — تمريرة قياس واحدة

تاريخ: ٢٠٢٦-٠٨-١١  
فرع: `ci/single-pass-measurement`  
وسم: `safe:ui`

## الخلاصة

| مقياس | قبل | بعد |
|--------|-----|-----|
| رسم الصفحات في PR (بوابات القياس) | ≈٥ بوابات × ٢٥ ≈ **١٢٥** (ومع `MUSHAF_GATE_FULL=1` على الاكتمال: **٦٠٤+**) | **٢٥** تمريرة واحدة (~٣٥ث محليًا) |
| رسم الصفحات للمسح الكامل ٦٠٤ | ≈٥ × ٦٠٤ ≈ **٣٠٢٠** | **٦٠٤** (÷٨ أجزاء ≈٧٦/جزء) |
| مهلة `mushaf-gates` | ٤٥ دقيقة | **١٠** دقائق |
| مهلة المسح الليلي | ١٨٠ دقيقة | **١٠**/جزء + دمج ≤٥ · هدف الجدار **≤١٢** |
| عيّنة PR | ٢٥ (١٤ ثابتة) | ٢٥ (**١٥** ثابتة تشمل ٥٢٨ + ١٠ بذرة `20260811`) |

## ما تغيّر

1. **`mushaf-single-pass-measure.mjs`**: متصفح Chromium واحد، `page.goto` + `evaluate` مرة لكل صفحة، JSON شامل.
2. **`mushaf-single-pass-assert.mjs`**: كل فحوص البوابات على الـJSON في Node (بلا إعادة رسم).
3. **CI**: بناء مرة → artifact `majalis-dist` · قياس · assert · وحدات Playwright المتبقية على preview.
4. **على `main`/ليلي**: `matrix.shard: [1..8]` ثم `merge`.
5. **فشل ليلي** → Issue تلقائي (لا بريد).

## البوابات — نفس الصرامة (صفر حذف/تخفيف)

| بوابة | أين تُفحص الآن |
|--------|----------------|
| page-completeness | assert JSON |
| live-overflow | assert JSON |
| ink-collision (+ بيانات ٦٠٤ ثابتة) | assert JSON |
| typescale | assert JSON + فحص المصدر |
| opening-frame | assert JSON + فحص المصدر |
| cartouche-center | assert JSON + فحص المصدر |
| toolbar-overlap | assert JSON + فحص CSS |
| render-visibility | assert JSON |
| layout-bands | assert JSON (+ وظيفة CI تستدعي نفس الـassert) |
| spec-lockdown / page-curl / وحدات | `test:mushaf-gates:unit` |
| active-page-lines / flip-perf | Playwright مرة (صفحة واحدة / سيناريو أداء) |
| ref-visual / hard-visual | `visual-snapshot` (عيّنة) |

لم تُضعف أي عتبة رقمية عن البوابات الأصلية على `main`.

## تعارض الملفات مع PRs الطورية

| PR / فرع | تداخل فعلي مع `ci/single-pass-measurement`؟ |
|----------|-----------------------------------------------|
| اكتمال الصفحة (مدموج) | لا — هذا الفرع من بعده |
| الشارة والصفحتان (`fix/mushaf-banner-opening`) | **لا تعارض جوهري**: ذلك يمسّ `SurahBanner` / `MushafPageV2` / عتبات؛ هذا يمسّ scripts + workflows + `mushaf-gate-active-page` (إضافة ٥٢٨ فقط) |
| الفهرس والأداء (مرحلة ٣) | لا — `SurahList` / flip hooks |

→ يمكن فتح/متابعة الـPRs **بالتوازي** دون انتظار دمج هذا الفرع إلا عند لمس نفس ملفات القياس.

## التحقق المحلي المقترح

```bash
cd artifacts/majalis
PORT=24216 BASE_PATH=/ pnpm run build
MUSHAF_GATE_USE_PREVIEW=1 pnpm run test:mushaf-single-pass
```

## قرارات هندسية

- إزالة `MUSHAF_GATE_FULL=1` من مسار PR (كان السبب الجذري للـ١٥+ دقيقة).
- العشوائية بذرة ثابتة فقط — نفس الصفحات كل تشغيل.
- `cache: npm` لم يُستخدم مع pnpm؛ التخزين عبر `actions/cache` لمخزن pnpm ومتصفحات Playwright.
