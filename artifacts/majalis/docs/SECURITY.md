# الأمن — تحديث ١٣ أغسطس ٢٠٢٦

| بند | حالة مقيسة |
|-----|-------------|
| مفتاح المتصفح | anon فقط في الحزمة الأمامية |
| RLS (CI) | `test:supabase-policy-audit` يفحص سياسات مستودع SQL — **لا يغني عن تأكيد يدوي في لوحة Supabase** للنوازل الحساسة |
| RLS (إنتاج) | معلّق يدويًا قبل الإطلاق الكامل (انظر `RELEASE_READINESS.md`) |
| CSP | مفعّل في `vercel.json`؛ ما زال `'unsafe-inline'` لـ`script-src`/`style-src` — إزالة تتطلّب nonce/hash مع Vite SPA (لم تُنفَّذ بعد) |
| `X-Frame-Options` | DENY |
| `X-Content-Type-Options` | nosniff |
| `Referrer-Policy` | strict-origin-when-cross-origin |
| `Permissions-Policy` | camera=() · microphone=(self) · geolocation=(self) |
| HSTS | max-age=31536000; includeSubDomains; preload |
| كاش الخاصة | `version.json` / SW: no-store |
| ContentTrustBox | تنبيه شرعي على تفاصيل الأحكام |
| kill-switch صوت | ضمن سياسات المنصة / كتالوج الأذان |

لا أسرار مقصودة في الحزمة؛ أي كشف → إبطال فوري.
