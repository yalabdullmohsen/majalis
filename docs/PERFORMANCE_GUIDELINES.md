# إرشادات الأداء — PERFORMANCE_GUIDELINES

آخر تحديث: **2026-08-26** · يُكمّل `docs/PERFORMANCE_BASELINE.md`

## مبادئ

1. **لا حذف ميزات** لتسريع التطبيق — قسّم الكود أو أجّل التحميل.
2. **حزمة الإقلاع**: لا تستورد مودالات/شيتات/حركة/بنرات بشكل ثابت في `App.tsx` — استخدم `lazyWithRetry` + `Suspense`.
3. **بلا `select('*')`** في مسارات القراءة العامة — أعمدة صريحة + `Promise.all` للطلبات المستقلة.
4. **قوائم طويلة**: ترقيم واجهة أو `IntersectionObserver` قبل رسم مئات العقد في DOM.
5. **خصوصية**: لا RUM/تحليلات قبل `allowsAnalytics()` (موافقة الكوكيز).

## عتبات Core Web Vitals (تنبيه RUM)

| مقياس | جيد | تنبيه إنتاج (`/api/rum`) |
|--------|-----|---------------------------|
| LCP | ≤ 2.5s | > 2500ms |
| INP | ≤ 200ms | > 200ms |
| CLS | ≤ 0.1 | > 0.1 |
| TTFB | ≤ 800ms | > 800ms |
| طلب API/fetch/supabase | — | > **500ms** → `[perf:slow]` + `client-error-log` |

## أين يُجمع القياس؟

| الطبقة | الملف / المسار | ملاحظات |
|--------|----------------|----------|
| عميل RUM | `src/lib/rum-telemetry.ts` | PerformanceObserver؛ إقلاع كسول من `main.tsx` |
| خادم RUM | `lib/api-handlers/rum.js` → `POST /api/rum` | سجل + webhook اختياري |
| بطء شبكة | `src/lib/performance-monitor.ts` | `PERF_API_SLOW_MS = 500` |
| بوابة بناء محلية | `scripts/test-bundle-budget.mjs` | Entry JS gzip ≤ **120 KiB** |
| LHCI معاينة | `lighthouserc.cjs` | عتبات معاينة (أبطأ من CDN) |
| PSI إنتاج | `config/psi-production-targets.json` + `verify-psi-production-gate` | بوابة إنتاج |

## تنبيهات Slack / Email

عيّن أحد المتغيرات في بيئة Vercel (Production):

- `RUM_ALERT_WEBHOOK` (مفضّل)
- أو `SLACK_WEBHOOK_URL`
- أو `PERF_ALERT_WEBHOOK`

عند تجاوز LCP/INP/CLS/TTFB يُرسل نص تنبيه (مع إلغاء تكرار 120 ثانية لكل مفتاح مقياس+مسار).

**فشل البناء:** لا نُفشل deploy على عيّنة RUM واحدة — نُفشل على بوابات LHCI/PSI/bundle عند الانحدار الموثّق في CI. راقب سجلات `/api/rum` ومتوسطات Vercel بعد النشر.

## أوامر قياس سريعة

```bash
# حجم الحزمة
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
node artifacts/majalis/scripts/test-bundle-budget.mjs

# Lighthouse محلي
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run start
pnpm dlx lighthouse@12.8.2 http://127.0.0.1:24216/ \
  --only-categories=performance --form-factor=mobile \
  --output=json --output-path=/tmp/perf-after.json \
  --chrome-flags="--headless --no-sandbox --disable-gpu"

# بوابات RUM/جلب
pnpm --filter @workspace/majalis exec node --import tsx src/lib/__tests__/rum-telemetry-gate.test.ts
pnpm --filter @workspace/majalis exec node --import tsx src/lib/__tests__/fetch-parallel-select-gate.test.ts
```

## قائمة مراجعة قبل دمج أداء

- [ ] `pnpm run verify:ci -- --changed` أخضر
- [ ] لا `import` ثابت من `@/components/motion` في `App.tsx`
- [ ] لا `select("*")` جديد في مسارات عامة دون مبرر تفصيل
- [ ] تحديث أرقام `PERFORMANCE_BASELINE.md` إن تغيّر الـentry gzip > ±2 KiB
