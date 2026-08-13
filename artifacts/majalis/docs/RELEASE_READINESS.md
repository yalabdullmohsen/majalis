# جاهزية الإطلاق — تحديث ١٣ أغسطس ٢٠٢٦

## ١. قبل/بعد (مقيس)

| مقياس | قبل | بعد |
|--------|-----|-----|
| `/library` → `/` (App+Vercel) | نعم | **لا** — #1079+#1080 |
| `/more` 404 | نعم | **200** صفحة منظمة #1082 |
| `/prayer` | 404 | **308** → `/prayer-times` |
| `/quran/mushaf` | بلا تحويل HTTP | **308** → `/mushaf` |
| شارة السورة | أرابيسك/ميداليات | **شريط عاجي بسيط** #1081 |
| تشخيص خطوط المصحف في الإنتاج | يظهر | **DEV/`fontDebug` فقط** #1080 |
| ContentTrustBox | لا | **نعم** على الأحكام #1082 |
| قواعد `.cursor/rules` | لا | **5 ملفات .mdc** #1082 |
| تباين on-brand | بوابة قائمة | **خضراء** (إرشادي 63=خط أساس) |
| JS gzip رئيسي | ~135 KB | فوق هدف الحزمة الكلية |
| CSS حرج | فوق 60 KB gzip | **فوق الهدف** |

## ٢. PRs هذه الجولة
| PR | النتيجة |
|----|---------|
| #1079 مسارات حرجة | مدمج `2be92cef` |
| #1080 HTTP + font banner | مدمج `97962cad` |
| #1081 شارة بسيطة | مدمج `678fc24f` |
| #1082 المزيد + Trust + rules | مدمج `57ca57d1` |
| #1073/#1074/#1075/#1072 | أُغلقت كمستبدلة/متعارضة |

## ٣. هل جاهز للإطلاق؟
**لا بعد** — متبقٍ مقيس:
1. أداء: تقطيع CSS/`index.css`، LCP/TTI غير مقيسة بـLighthouse في الجلسة.
2. بحث موحّد/SEO كامل يحتاج جولة مستقلة.
3. أمان: مراجعة CSP/`unsafe-inline` وRLS يدوي في Supabase.
4. PWA offline كامل + Playwright smoke لكل المسارات.
5. تنظيف رموز `--background/--primary` المكررة إلى مصدر `@theme` واحد.
6. تراخيص صوت: قرار بشري (`LICENSE_RISKS.md`).

## ٤. أوامر
```bash
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
pnpm --filter @workspace/majalis run test:nav-active
pnpm --filter @workspace/majalis run test:mushaf-gates
pnpm --filter @workspace/majalis run test:on-brand-contrast
```
