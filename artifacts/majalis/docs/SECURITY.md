# الأمن — تحديث ١٣ أغسطس ٢٠٢٦

| بند | حالة مقيسة |
|-----|-------------|
| مفتاح المتصفح | anon فقط في الحزمة الأمامية |
| RLS | يُراجع آلياً عبر `test:supabase-policy-audit` |
| CSP | مفعّل في `vercel.json` (ما زال `unsafe-inline` للسكربت/الأنماط — تقليص لاحق) |
| `X-Frame-Options` | DENY |
| `X-Content-Type-Options` | nosniff |
| `Referrer-Policy` | strict-origin-when-cross-origin |
| `Permissions-Policy` | camera=() · microphone=(self) · geolocation=(self) |
| HSTS | max-age=31536000; includeSubDomains; preload |
| كاش الخاصة | `version.json` / SW: no-store |
| ContentTrustBox | تنبيه شرعي على تفاصيل الأحكام |
| kill-switch صوت | ضمن سياسات المنصة / كتالوج الأذان |

لا أسرار مقصودة في الحزمة؛ أي كشف → إبطال فوري.
