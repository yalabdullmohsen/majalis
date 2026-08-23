# نظام حصاد المصادر (Sources Harvest)

## الهدف
جمع إعلانات **دروس · حلقات · دورات · خطب · تسجيل** من حسابات معتمدة ونشرها في:
- `public/data/lessons/feed.json` (آخر ٩٠ يوماً)
- `public/data/lessons/archive/YYYY-MM.json`

## البنية
```
scripts/harvest/
  run.mjs           # خط الأنابيب الرئيسي
  accounts-seed.mjs # دمج الحسابات القديمة + الجديدة
  adapters/         # telegram · web · youtube · instagram(oembed)
  classify.mjs      # تصنيف واستخراج الحقول
  dedupe.mjs        # إزالة التكرار
  schema.mjs        # مدقق المخطط
public/data/sources/
  accounts.json     # سجل الحسابات (SSOT)
  inbox.jsonl       # روابط إنستغرام للصق (سطر = رابط)
```

## إضافة حساب جديد
1. أضف سطراً في `accounts-seed.mjs` أو عدّل `accounts.json` مباشرة
2. شغّل: `pnpm run harvest:accounts`
3. الحصاد التالي يلتقط المنشورات تلقائياً

## تعطيل حساب
```json
"enabled": false
```

## أوامر
| أمر | الوظيفة |
|---|---|
| `pnpm run harvest` | تشغيل كامل (شبكة) |
| `pnpm run harvest:dry` | اختبار بfixtures بلا شبكة |
| `pnpm run test:harvest` | بوابات الجودة |
| `pnpm run harvest:accounts` | إعادة بناء accounts.json |

## الواجهة
- `/lessons` — شريط «جديد اليوم من المصادر»
- `/sources` — دليل الجهات
- `/sources/:id` — منشورات جهة واحدة

## أسرار CI (GitHub Secrets)
- `YOUTUBE_API_KEY` (اختياري)
- `TELEGRAM_BOT_TOKEN` (اختياري — القنوات العامة تعمل بلا توكن)
- `INSTAGRAM_PROVIDER_KEY` (لاحقاً)

## الأتمتة
`.github/workflows/harvest-sources.yml` — مرتان يومياً (٦ صباحاً و٦ مساءً بتوقيت الكويت).
