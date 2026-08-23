# نظام حصاد المصادر (Sources Harvest)

## الهدف
جمع إعلانات **دروس · حلقات · دورات · خطب · تسجيل** من حسابات معتمدة ونشرها في:
- `public/data/lessons/feed.json` (آخر ٩٠ يوماً)
- `public/data/lessons/archive/YYYY-MM.json`

## البنية
```
scripts/harvest/
  run.mjs           # خط الأنابيب الرئيسي
  accounts-seed.mjs # بذرة الحسابات (المصدر لإعادة البناء)
  build-accounts.mjs
  adapters/         # telegram · web · youtube · instagram(off|oembed|provider)
  classify.mjs      # تصنيف واستخراج الحقول
  dedupe.mjs        # إزالة التكرار
  schema.mjs        # مدقق المخطط
public/data/sources/
  accounts.json     # سجل الحسابات المنشور (SSOT للتشغيل)
  inbox.jsonl       # روابط إنستغرام للصق (سطر = رابط)
```

## إضافة حساب جديد
1. أضف الحساب في `scripts/harvest/accounts-seed.mjs` (مفتاح فريد: `platform + handle`)
2. شغّل: `pnpm run harvest:accounts`
3. ادفع `public/data/sources/accounts.json` — الحصاد التالي يلتقط المنشورات تلقائياً (Telegram/Web فوراً؛ Instagram عند توفر provider أو روابط inbox)

## تعطيل حساب
في `accounts-seed.mjs` أو مباشرة في `accounts.json`:
```json
"enabled": false
```
ثم `pnpm run harvest:accounts` إن عدّلت البذرة.

## أوامر
| أمر | الوظيفة |
|---|---|
| `pnpm run harvest` | تشغيل كامل (شبكة) |
| `pnpm run harvest:dry` | اختبار بfixtures بلا شبكة |
| `pnpm run test:harvest` | بوابات الجودة |
| `pnpm run harvest:accounts` | إعادة بناء accounts.json من البذرة |

## الواجهة
- `/lessons` — شريط «جديد اليوم من المصادر»
- `/sources` — دليل الجهات
- `/sources/:id` — منشورات جهة واحدة

## إنستغرام — أوضاع الاستيعاب
| `INSTAGRAM_INGEST_MODE` | السلوك |
|---|---|
| `off` | تعطيل إنستغرام بالكامل |
| `oembed` | روابط يدوية من `inbox.jsonl` فقط (افتراضي محلي) |
| `provider` | مزوّد مرخّص عبر API (افتراضي CI) |

### وضع provider
- **مطلوب:** `INSTAGRAM_PROVIDER_KEY` + `INSTAGRAM_PROVIDER_ENDPOINT`
- **العقد:** `GET {endpoint}/accounts/{handle}/posts?since={iso}` مع `Authorization: Bearer {key}`
- إن لم يُضبط: التشغيلة لا تفشل — يُكتب `Instagram provider is not configured.` في التقرير

## كيف أعرف أن كل منصة تعمل؟
| المنصة | يعمل الآن؟ | الشرط |
|---|---|---|
| **Telegram** | نعم | قناة عامة `t.me/s/{handle}` — `TELEGRAM_BOT_TOKEN` اختياري |
| **Web** | نعم | RSS أو og:title/description من الموقع |
| **Instagram** | oembed فقط | روابط في `inbox.jsonl`؛ أو provider عند ضبط المفتاح |

## أسرار CI (GitHub Secrets)
- `YOUTUBE_API_KEY` (اختياري)
- `TELEGRAM_BOT_TOKEN` (اختياري — القنوات العامة تعمل بلا توكن)
- `INSTAGRAM_PROVIDER_KEY` (مطلوب لوضع provider)
- `INSTAGRAM_PROVIDER_ENDPOINT` (مطلوب لوضع provider)

**لا تلمس `PROD_DEPLOY_TOKEN`** — الحصاد يستخدم `GITHUB_TOKEN` فقط لـ PR المحتوى.

## الأتمتة
`.github/workflows/harvest-sources.yml` — مرتان يومياً (٦ صباحاً و٦ مساءً بتوقيت الكويت = ٠٣:٠٠ و١٥:٠٠ UTC).
- بلا تغيير → ينتهي بنجاح بلا PR
- مع تغيير → PR تلقائي لـ `feed.json` و`accounts.json` و`harvest-report.json` تحت `public/data/**` (متوافق مع `safe:content`)

## التصنيف والنشر
يُستخرج من النص (والوصف/صورة عبر provider): عنوان، شيخ، مكان، وقت، تاريخ، رابط تسجيل، جمهور، نوع (درس/حلقة/دورة/خطبة/تسجيل/إعلان).
يُنشر تلقائياً فقط إن توفرت: `title` + حساب مصدر + `post_url` أصلي.
