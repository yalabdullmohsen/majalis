# 16 — البيئات والخدمات الخارجية

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d` · **أسماء فقط — لا قيم.**

## متغيرات من `.env.local.example`

| الاسم | خدمة | Client/Server | مطلوب؟ | ملاحظات |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase | Client (عام) | للبيانات/auth | بدونها placeholder |
| `VITE_SUPABASE_ANON_KEY` | Supabase | Client (عام) | للبيانات/auth | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Server only | ops | **لا VITE_** |
| `SUPABASE_URL` | Supabase | Server | ops | |
| `DATABASE_URL` | Postgres | Server | migrations | موافقة |
| `SUPABASE_POOLER_HOST` | Supabase | Server | اختياري | |
| `MAJALIS_PRODUCTION_CONTENT` | محتوى | Server | اختياري | |
| `VITE_MAJALIS_PRODUCTION_CONTENT` | محتوى | Client | اختياري | عام |
| `CRON_SECRET` | Cron APIs | Server | اختياري | |
| `ADMIN_API_SECRET` | Admin APIs | Server | اختياري | |
| `UPSTASH_REDIS_REST_URL` | Upstash | Server | اختياري | |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Server | اختياري | |
| `OPENAI_API_KEY` | OpenAI | Server | اختياري | |
| `ANTHROPIC_API_KEY` | Anthropic assistant | Server | إنتاج مساعد | |
| `INSTAGRAM_*` (عدة) | Instagram | Server | اختياري | |
| `PORT` | Dev servers | Runtime | **مطلوب لتشغيل Vite/Express** | |
| `BASE_PATH` | Vite app | Runtime | **مطلوب للويب** | |

## أسماء إضافية في الكود/docs (بلا قيم)

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (mobile)
- aliases `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_ANON_KEY` في طبقات env
- `MAJALIS_ALLOW_CLI_MIGRATIONS` لتفعيل CLI هجرات
- `GITHUB_TOKEN` في Actions

## خدمات خارجية

| خدمة | دور | اختبار تعديلي؟ |
|---|---|---|
| Supabase | Auth/DB | لا تُنشئ بيانات في مهمة توثيق |
| Vercel | استضافة ويب/دوال | لا |
| Apple / TestFlight | توزيع iOS | لا |
| Expo push | api-server | لا ترسل إشعارات |
| Anthropic | مساعد | لا |
| OpenAI | اختياري | لا |
| Upstash | rate limit | لا |
| Instagram Graph | استيراد | لا |
| AlQuran Cloud / everyayah / mp3quran | محتوى/صوت | جلب حي مقيّد بالترخيص |
| Maps/Leaflet | قبلة/خرائط إن فُعّل | لا |

لا تقرأ ملفات `.env` الفعلية في التوثيق.
