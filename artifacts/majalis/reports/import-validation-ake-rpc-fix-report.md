# Root Fix Report — Import Validation + AKE RPC + Non-Blocking Publishing

**Branch:** `cursor/import-validation-ake-rpc-92e6`  
**Date:** 2026-06-28

---

## 1. سبب فشل CSV (HTTP 422)

**السبب الجذري:** `lib/content-import/validators.mjs` كان يفرض على نوع `lessons`:

```text
required: ["title", "description", "category", "source_url"]
+ oneOf: sheikh/date/location groups
```

و `engine.mjs` كان يلغي **الملف بالكامل** عند أي خطأ تحقق (`allValid === false`).

ملف `lesson_extracted_from_poster.csv` غالباً يحتوي صفوفاً بـ sheikh/mosque/date/time **بدون title** → رسالة:
`فشل التحقق من صفوف CSV — الحقل المطلوب title مفقود`

---

## 2. سبب فشل RPC

**السبب:** دالة `ake_engine_stats` موجودة في PostgreSQL لكن PostgREST لا يستدعيها (GRANT/signature/cache).

`system-health.mjs` كان يضيفها كـ **error** حتى مع وجود fallback يعمل في `orchestrator.mjs`.

**الإصلاح:**
- تحديث idempotent: `supabase/auto_knowledge_engine_v13_rpc_fix.sql` (DROP signatures + GRANT + NOTIFY pgrst)
- Fallback مباشر من الجداول عند فشل RPC (`buildAkeStatsFallback`)
- تحويل رسالة RPC من error خام → **warning** عربي + `_user_message` في stats

**تطبيق على Production:** يتطلب `DATABASE_URL` أو:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.majalisilm.com/api/cron/apply-migrations?scope=ake-rpc"
```

---

## 3. الحقول Required فعلاً

| حقل | سياسة |
|-----|--------|
| **title** | مطلوب — أو **يُولَّد تلقائياً** من الشيخ/المسجد/النشاط/التاريخ |
| **date** | `date` / `start_date` / `day_of_week` / `schedule` |
| **time** | `time` / `lesson_time` / وقت داخل `schedule` |
| **source** | `source_url` / `website_url` — أو `csv://import` |

---

## 4. Important (لا تمنع النشر)

- الشيخ (`sheikh_name` / `speaker_name`)
- المسجد (`mosque` / `location`)
- المنطقة (`region`)
- المحافظة/المدينة (`city` / `governorate`)
- التصنيف (`category` — default: `أخرى`)

→ تُنشر مع شارة **`بيانات_ناقصة`** في `keywords`

---

## 5. Optional (لا تمنع أبداً)

- رابط البث (`live_url`)
- رابط الخريطة (`maps_url`)
- رقم التواصل (`contact_phone`)
- ملاحظات (`notes`)
- مكان النساء / الجهة المنظمة

---

## 6. نتائج الاستيراد (dry-run simulation)

| المقياس | القيمة |
|---------|--------|
| صفوف بدون title | ✅ 2/2 imported |
| صف بدون mosque | ✅ imported + incomplete |
| صف بدون category | ✅ imported (default أخرى) |
| صف فارغ في ملف مختلط | ✅ skipped — باقي الصفوف imported |
| **imported (dry-run)** | **2** |
| **published** | **2** |
| **review_queued** | **0** (بعد normalization) |
| **skipped** | **1** (صف فارغ) |

---

## 7. نتائج الاختبارات

| الأمر | النتيجة |
|-------|---------|
| `verify:import-resilience` | ✅ **19/19** |
| `verify:production-pipeline` | ✅ **32/32** |
| `verify:lesson-url-import` | ✅ PASS |
| `pnpm run typecheck` | ✅ PASS |
| `pnpm run build` | ✅ PASS (5.23s) |
| `pnpm run lint` | ✅ 0 errors |

---

## 8. الملفات المُعدَّلة

| ملف | التغيير |
|-----|---------|
| `lib/content-import/lesson-field-policy.mjs` | **NEW** — normalize, generate title, resilient validation |
| `lib/content-import/validators.mjs` | lessons/courses resilient |
| `lib/content-import/engine.mjs` | per-row import, stats report |
| `lib/content-import/mappers.mjs` | normalize before map |
| `lib/cms/content-validator.mjs` | required/important/optional tiers |
| `lib/cms/publish-lesson.mjs` | non-blocking publish + userMessage |
| `lib/cms/auto-publish-engine.mjs` | optional fields don't block manual publish |
| `lib/system-health.mjs` | RPC → warning not critical |
| `lib/auto-knowledge-engine/orchestrator.mjs` | Arabic fallback message |
| `supabase/auto_knowledge_engine_v13_rpc_fix.sql` | idempotent RPC repair |
| `scripts/verify-import-resilience.mjs` | **NEW** |
| `package.json` | `verify:import-resilience` script |

---

## 9. ما يتبقى للإنتاج

| البند | الحالة |
|-------|--------|
| CSV import بدون title | ✅ مُصلَح في الكود |
| نشر درس ناقص mosque | ✅ مُصلَح |
| Dashboard fallback | ✅ يعمل |
| RPC live callable | ⚠️ يحتاج `apply-migrations?scope=ake-rpc` على Production |
| استيراد CSV حقيقي على Production | ⚠️ يحتاج `SUPABASE_SERVICE_ROLE_KEY` |

**لا يُعلَن 100% على Production حتى:** تطبيق RPC migration + استيراد فعلي لـ `lesson_extracted_from_poster.csv`.
