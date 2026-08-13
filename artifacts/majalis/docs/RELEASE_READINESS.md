# جاهزية الإطلاق — ١٣ أغسطس ٢٠٢٦

## ١. قبل/بعد

| مقياس | قبل | بعد |
|--------|-----|-----|
| مسارات حرجة → `/` | نعم | **لا** |
| `/more` | 404 | صفحة منظمة |
| شارة المصحف | أرابيسك | شريط بسيط |
| تشخيص خطوط الإنتاج | ظاهر | DEV فقط |
| كاش `/` | `no-store` | `public, max-age=0, must-revalidate` |
| robots `/search` | ممنوع | مؤكَّد ببوابة |
| ContentTrustBox / قواعد Cursor | لا | نعم |
| JS gzip رئيسي | ~131 KB | ~135 KB |
| CSS gzip حرج | ~66 KB | **~57 KB (<60)** |

## ٢. البوابات
`test:nav-active` (+ critical routes + trust + perf-seo-cache + critical-css-gzip) · `test:on-brand-contrast` · `test:mushaf-*` · Playwright: `tests/01-smoke` + `tests/10-critical-acceptance` (`test:playwright-smoke`).

## ٣. هل جاهز للإطلاق؟
**لا بالكامل** — بقي قبل إطلاق كامل:
1. قياس Lighthouse (LCP/TTI/INP/CLS) @390×844 4G.
2. قرار بشري لتراخيص everyayah/mp3quran/أذان مضمّن.
3. تأكيد RLS يدوي في لوحة Supabase للنوازل الحساسة (فحص CI لا يكفي وحده).
4. CSP بدون `unsafe-inline` (يتطلّب nonce/hash).

Playwright critical (`tests/10-critical-acceptance`) يُشغَّل ضد معاينة Vercel عبر `preview-smoke.yml` عند توفر Preview.

## ٤. أوامر
```bash
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
pnpm --filter @workspace/majalis run test:nav-active
pnpm --filter @workspace/majalis run test:on-brand-contrast
pnpm --filter @workspace/majalis run test:playwright-smoke
```
