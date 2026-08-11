# CI Pipeline Fix Report — إنهاء تأخّر الدمج

**الفرع:** `ci/pipeline-speed-and-notify`  
**الوسم:** `safe:ui`  
**التاريخ:** 2026-08-11

## 1) سبب فشل البوابة (الجذر)

مسرح التقليب `MushafPageFlipStage` يُبقي صفحة الجار في DOM تحت `[data-mushaf-underlay]` مع `visibility: hidden` / `aria-hidden` لتسريع اللفّ. بوابات كانت تستعلم بـ `document.querySelector(.mf2-lines)` أو `querySelectorAll(.mf2-line)` فتلتقط **النشطة + الجار** (مثلاً ٣٠ سطراً بدل ١٥، أو ٤٥ عند وجود ثلاث أوراق).

### الإصلاح

| ملف | التغيير |
|-----|---------|
| `artifacts/majalis/src/components/quran/MushafPageFlipStage.tsx` | `data-page-state="active\|prev\|next"` على الورقة النشطة والجيران |
| `artifacts/majalis/scripts/quran-import/mushaf-gate-active-page.mjs` | مُساعد مشترك: `resolveGatePages` + حقن `window.__mushaf*` |
| `mushaf-active-page-lines-gate.mjs` | اختبار: صفحة عادية (ص٤) = **١٥ سطراً بالضبط** من النشطة |

### بوابات كان فيها نفس العيب (قياس غير مقيَّد / fallback عالمي)

كلها رُبطت بـ `addInitScript(ACTIVE_PAGE_BROWSER_SOURCE)` واستعلام من الصفحة النشطة:

- `mushaf-live-overflow-gate.mjs` (شبكة/هامش — سبب الفشل المعلن)
- `mushaf-hard-visual-gate.mjs`
- `mushaf-ink-collision-gate.mjs`
- `mushaf-ink-clip-gate.mjs`
- `mushaf-layout-bands-gate.mjs`
- `mushaf-opening-frame-gate.mjs`
- `mushaf-toolbar-overlap-gate.mjs`
- `mushaf-cartouche-center-gate.mjs`
- `mushaf-typescale-gate.mjs`
- `mushaf-spec-lockdown-gate.mjs`
- `mushaf-banner-density-gate.mjs`
- `mushaf-ref-visual-gate.mjs` / `mushaf-ref-parity-gate.mjs` / `mushaf-311-parity-gate.mjs`
- `mushaf-visual-layout-gate.mjs`
- `mushaf-render-visibility-gate.mjs`

**إثبات محلي:** `pnpm run test:mushaf-active-page-lines` → scoped=15، global=30 (جار في DOM).  
`MUSHAF_GATE_PAGES=4,228 pnpm run test:mushaf-live-overflow` → lineCount=15 لكل صفحة، failures=[].

## 2) تسريع CI

| قبل | بعد |
|-----|-----|
| وظيفة واحدة متسلسلة «Verify build» ≈ **٩٫٥ دقائق** ثم فشل | أربع وظائف متوازية: `build` · `mushaf-gates` · `layout-bands` · `visual-snapshot` + مجمّع باسم **Verify build** |
| مسح كثيف/٦٠٤ على PR | عيّنة **٢٥** صفحة (١٤ ثابتة + ١١ بذرة `20260811`)؛ الكامل ليلاً `mushaf-gates-nightly.yml` |
| بلا إلغاء للمتجاوز | `concurrency: ci-${{ github.ref }}` + `cancel-in-progress` + fail-fast عبر `gh run cancel` |
| بلا تخزين Playwright/Vite/pnpm | `actions/cache` لمخزن pnpm وPlaywright وVite |

**هدف الجدار:** ≤ ٤ دقائق لـ Verify build (زمن الجدار = أبطأ وظيفة متوازية + ثوانٍ للمجمّع).  
الأزمان الدقيقة قبل/بعد تُسجَّل في ملخص تشغيل CI بعد أول PR أخضر.

## 3) دمج ونشر وإشعار

- Auto-merge: يبقى `gh pr merge --auto --squash`؛ **حُذف تعليق PR** عند إلغاء الدمج بسبب فشل Verify.
- `auto-deploy.yml`: تحقق HTTP 200 + تطابق `version.json.commit` مع SHA المدموج؛ **إعادة محاولة واحدة** تلقائياً؛ وظيفة `notify-success` بعد نجاح النشر فقط (ملخص Actions + اختياري `DEPLOY_NOTIFY_WEBHOOK`).

## 4) إعدادات GitHub اليدوية (إيقاف بريد الفشل · إبقاء نجاح النشر)

الكود لا يتحكم ببريد حسابك. نفّذ بالترتيب:

1. افتح **GitHub → Settings → Notifications** (إعدادات الحساب، لا المستودع).
2. قسم **Actions**:
   - عطّل أو قلّص **Send notifications for failed workflows** / إشعارات فشل سير العمل (حسب واجهة حسابك الحالية).
   - إن وُجد خيار **Only notify for workflows I'm watching** أو مشابه، أبقِه مفعّلاً وراقب فقط مسار النشر إن رغبت.
3. لبريد/رسالة **نجاح واحد** بعد النشر:
   - أضف سر المستودع `DEPLOY_NOTIFY_WEBHOOK` (Slack Incoming Webhook أو Discord أو جسر بريد) — وظيفة `notify-success` ترسل إليه عند نجاح النشر من `main` فقط.
   - أو اعتمد ملخص **Actions → Auto Deploy → notify-success** دون بريد، إن عطّلت بريد Actions بالكامل.
4. تأكد أن حماية `main` ما زالت تتطلب الفحص بالاسم **`Verify build`** (المجمّع الجديد يحتفظ بنفس الاسم).
5. لا تعتمد على تعليقات PR للفشل — الفشل صامت في صفحة Checks فقط.


## 5) أزمان فعلية — PR #1036 (run 31467069906)

| وظيفة | قبل (متسلسل) | بعد (متوازٍ) |
|--------|-------------|--------------|
| build | ضمن ٩٫٥ دقائق | **٤٫٠ دقائق** (06:58→07:02) |
| layout-bands | ضمن المتسلسل | **٢٫١ دقيقة** |
| visual-snapshot | ضمن المتسلسل | **١٫٧ دقيقة** |
| mushaf-gates | ضمن المتسلسل (فشل) | **٨٫٣ دقائق** (عنق الزجاجة — Vite لكل بوابة + عيّنة ink-collision واسعة) |
| Verify build (مجمّع) | ≈٩٫٥ ثم فشل | **~٨٫٥ دقائق جدار** (حتى اكتمال أبطأ وظيفة) → نجاح |

**متابعة فورية:** Vite مشترك عبر `MUSHAF_GATE_BASE_URL` في CI + حصر ink-collision على عيّنة ٢٥ في CI — هدف الجدار ≤٤ دقائق.

**دمج ونشر #1036:** squash `067bde454` → `version.json` مطابقة على الإنتاج.

## 6) ما لم يُمس

نص القرآن · الترقيم · حدود الصفحات · `SOURCE.json` — بلا تغيير.  
لم تُضعَف أي بوابة؛ قُيّد القياس فقط + عيّنة PR مع مسح ليلي كامل.
