# قائمة ما قبل النشر إلى الإنتاج — المجلس العلمي

النشر إلى `majlisilm.com` **يدوي ومحمي** (راجع `DEPLOYMENT.md`): لا يصل تغيير إلى
الموقع الحي إلا بدمج المالك لطلب سحب معتمد إلى فرع `production` المحمي.

## 1) بوابة الجودة (تُشغَّل قبل الدمج)

```
pnpm --filter @workspace/majalis run predeploy:gate
```

تشمل: `typecheck` + `test:regression` (12 مجموعة) + `verify:owner-env --require`.
لا تُكمل الدمج إن فشل أي منها.

## 2) متغير البيئة المطلوب: `MAJALIS_OWNER_EMAILS`

بعد إزالة البريد الشخصي من الكود، صار تفويض المالك يقرأ قائمة البريد من هذا المتغير.

- **الفحص (بلا كشف القيمة):** `pnpm --filter @workspace/majalis run verify:owner-env`
- **الضبط في Vercel:** Settings → Environment Variables → Production
  - الاسم: `MAJALIS_OWNER_EMAILS`
  - القيمة: بريد المالك (أو أكثر) مفصولة بفواصل — مثال الصيغة: `owner@example.com,owner2@example.com`
- **بديل البناء للعميل (اختياري):** `VITE_OWNER_EMAILS` بنفس الصيغة (يُدمج وقت البناء).

**إن لم يُضبط المتغير:** لا يتعطّل الموقع، لكن يعتمد تفويض المالك على دور قاعدة
البيانات فقط (`is_owner` / `super_admin`)؛ ولن يعمل «تمهيد المالك بالبريد».
**لا تنشر قبل التأكد من ضبطه في Production.**

## 3) خطوة Vercel اليدوية (مرة واحدة)

تأكد أن **Production Branch** في Vercel = `production` (لا `main`) — راجع `DEPLOYMENT.md`.

## 4) النشر (بيد المالك)

1. ادمج التغييرات إلى `main` عبر طلب سحب (Preview فقط).
2. راجع رابط الـ Preview.
3. افتح طلب سحب `main → production`، راجعه، ثم ادمجه بنفسك.
4. Vercel ينشر تلقائيًا على `majlisilm.com` عند دمج `production`.

## 5) نقطة الرجوع (Rollback)

- سجّل آخر Deployment ناجح في Vercel قبل الدمج.
- إن فشل الإنتاج: من Vercel → Deployments → آخر إصدار سليم → **Promote to Production**
  (أو أعد فتح طلب سحب عكسي على `production`).
