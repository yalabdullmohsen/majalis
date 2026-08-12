# تشخيص نظام الاستيراد — مرحلة صفر

**التاريخ:** 2026-07-08  
**المهندس:** Claude Sonnet 4.6  
**الحالة:** مكتمل — يُرجع إلى هذا التقرير في كل إصلاح لاحق

---

## الملفات المشخَّصة

| الملف | الغرض |
|---|---|
| `artifacts/majalis/vercel.json` | إعدادات Vercel (crons, maxDuration, routes) |
| `artifacts/majalis/api/index.js` | نقطة دخول Serverless → api-dispatch.mjs |
| `artifacts/majalis/lib/api-handlers/cron/process-import-jobs.js` | معالج cron الرئيسي |
| `artifacts/majalis/lib/api-handlers/admin/content-import.js` | API handler للاستيراد (upload, commit, process) |
| `artifacts/majalis/lib/api-handlers/admin/lesson-from-image.js` | استخراج الدرس من الصورة (Vision AI) |
| `artifacts/majalis/lib/content-import/engine.mjs` | محرك قائمة الوظائف (524 سطر) |
| `artifacts/majalis/lib/content-import/import-jobs.mjs` | CRUD لجدول import_jobs |
| `artifacts/majalis/lib/content-import/import-worker.mjs` | جدولة المعالجة بعد HTTP response |
| `artifacts/majalis/lib/content-import/bulk-importer.mjs` | الاستيراد الفعلي إلى Supabase |
| `artifacts/majalis/lib/cms/lesson-extractor.mjs` | pipeline استخراج الدروس بـ Anthropic Vision |

---

## النتائج الحرجة

### BUG-001 — TIMEOUT_MS > maxDuration [حرج جداً]
**الملف:** `lib/cms/lesson-extractor.mjs:23`  
**الخط:** `const TIMEOUT_MS = 90_000;`  
**المشكلة:** الـ Anthropic client مضبوط على 90 ثانية، لكن Vercel يقتل الدالة عند 60 ثانية (`maxDuration: 60` في vercel.json:9).  
**النتيجة:** كل طلب استخراج صورة يستغرق أكثر من 60 ثانية → Vercel يرسل 504 قبل أن يكمل الـ Anthropic client retryَه.  
**الإصلاح:** تغيير `TIMEOUT_MS` إلى `45_000` (يترك 15 ثانية للـ overhead والـ DB calls).

---

### BUG-002 — سلسلة Anthropic calls متعاقبة تتجاوز 60 ثانية [حرج]
**الملف:** `lib/cms/lesson-extractor.mjs`  
**التدفق:**  
1. Stage 1: Primary Vision call → 15-30 ث  
2. Stage 2: Fallback Vision (إذا confidence < 40%) → 15-30 ث إضافية  
3. Stage 3: DB Enrichment → 1-2 ث  
4. Stage 4: Enrich/Spelling call (callText) → 10-20 ث  
**المجموع الأسوأ:** 80-82 ثانية لصورة واحدة → يتجاوز 60 ثانية بكثير.  
**الإصلاح:** 
- تقليل `TIMEOUT_MS` إلى 45 ث
- جعل Stage 4 (Enrich) اختيارية، تُتخطى إذا مضى أكثر من 40 ث منذ البدء  
- تشغيل Stage 2 فقط عند confidence < 0.3 بدلاً من 0.4

---

### BUG-003 — processQueuedImportJobs تعالج الوظائف تسلسلياً [حرج]
**الملف:** `lib/content-import/engine.mjs:447-455`  
```js
for (const job of jobs) {
  results.push(await processImportJob(job.id));  // تسلسلي!
}
```
**المشكلة:** الـ cron يعالج حتى 5 وظائف في كل مرة، كل وظيفة قد تستغرق 30-60 ثانية → المجموع 150-300 ثانية.  
**النتيجة:** 504 timeout عند وجود أي عدد من الوظائف المتراكمة.  
**الإصلاح:** معالجة وظيفة واحدة فقط لكل cron tick، مع budget للوقت (50 ثانية max).

---

### BUG-004 — IMPORT_SYNC_ROW_THRESHOLD = 5000 يؤدي للـ synchronous processing [حرج]
**الملف:** `lib/content-import/import-worker.mjs:11`  
```js
export const IMPORT_SYNC_ROW_THRESHOLD = Number(process.env.IMPORT_SYNC_ROW_THRESHOLD) || 5000;
```
**المشكلة:** أي مجموعة بيانات ≤ 5000 صف تُعالج بشكل متزامن داخل HTTP request → timeout للملفات الكبيرة.  
**الإصلاح:** تخفيض القيمة الافتراضية إلى 50، وتفعيل async mode دائماً لأي عمليات AI.

---

### BUG-005 — lesson-from-image يستدعي Vision AI مباشرة داخل HTTP request [حرج]
**الملف:** `lib/api-handlers/admin/lesson-from-image.js:86,131`  
```js
const result = await extractLessonFromImage({ imageBase64, mimeType: check.mime });
```
**المشكلة:** الاستخراج من الصورة (4 مراحل Anthropic) يحدث داخل request مباشر → timeout عند أي صورة.  
**الإصلاح:** إرجاع draft فوري مع status "processing"، ثم معالجة الصورة في cron worker.

---

### BUG-006 — scheduleImportProcessing لا يستخدم waitUntil بشكل موثوق [متوسط]
**الملف:** `lib/content-import/import-worker.mjs:19-39`  
```js
if (res && typeof res.waitUntil === "function") { ... }        // Vercel Edge فقط
if (typeof globalThis.waitUntil === "function") { ... }       // نادر
void work;  // detached — يموت مع response!
```
**المشكلة:** في Vercel Serverless (Node.js runtime)، `res.waitUntil` غير موجودة → يصبح `void work` → العمل يتوقف حين ترسل الـ response → وظائف مفقودة.  
**الإصلاح:** الاعتماد على cron بدلاً من waitUntil، أو استخدام Vercel `afterResponse` hook.

---

### BUG-007 — 422 Errors من Anthropic Vision API [متوسط]
**الملف:** `lib/cms/lesson-extractor.mjs:299-308`  
```js
{ type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: imageBase64 } }
```
**المشكلة:** إذا كانت الصورة PNG لكن mimeType = "image/jpeg"، أو العكس → Anthropic يرفض بـ 422.  
**الإصلاح:** الـ `validateImageUpload` تُصحح `check.mime` بالفعل، التأكد من أن `check.mime` يُمرر دائماً.

---

### BUG-008 — MAX_RETRIES = 3 مع retryable errors يضاعف وقت الاستجابة [تحسين]
**الملف:** `lib/cms/lesson-extractor.mjs:22,279`  
```js
const MAX_RETRIES = 3;
const delay = BASE_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
// attempt=1: ~1.5s, attempt=2: ~2.5s, attempt=3: ~4.5s → +8.5s overhead
```
**المشكلة:** للـ retryable errors (rate limit, server error)، يُعيد المحاولة تلقائياً مما يزيد من وقت الاستجابة.  
**الإصلاح:** تقليل MAX_RETRIES إلى 2، وإرجاع "يُعاد المحاولة في الـ cron" بدلاً من الانتظار.

---

### INFO-001 — البنية التحتية موجودة وصحيحة
- جدول `import_jobs`: موجود مع status tracking كامل
- Cron `/api/cron/process-import-jobs` كل 10 دقائق: موجود
- Job queue engine: موجود في engine.mjs
- معالج الأخطاء: classifyAnthropicError يعمل بشكل صحيح
- لا تُسجَّل أي API keys في logs (BUG-007 check في classifyAnthropicError)

---

### INFO-002 — مسارات الـ Cron الموجودة
```
vercel.json → maxDuration: 60 (Pro plan)
كرون process-import-jobs: كل 10 دقائق
```

---

## أولويات الإصلاح

| الأولوية | BUG | الإصلاح |
|---|---|---|
| 1 🔴 | BUG-001 | `TIMEOUT_MS = 45_000` |
| 2 🔴 | BUG-002 | time-budget للـ pipeline + تخطي Stage 4 إذا > 40s |
| 3 🔴 | BUG-003 | معالجة وظيفة واحدة/cron + time budget |
| 4 🟠 | BUG-004 | `IMPORT_SYNC_ROW_THRESHOLD = 50` |
| 5 🟠 | BUG-005 | تأجيل Vision AI إلى cron worker |
| 6 🟡 | BUG-006 | الاعتماد على cron بدلاً من waitUntil |
| 7 🟡 | BUG-007 | التأكد من تمرير check.mime دائماً |
| 8 🟢 | BUG-008 | `MAX_RETRIES = 2` |

---

## خريطة ملفات الإصلاح

```
BUG-001, BUG-002, BUG-008 → lib/cms/lesson-extractor.mjs
BUG-003                   → lib/content-import/engine.mjs
BUG-004, BUG-006          → lib/content-import/import-worker.mjs
BUG-005                   → lib/api-handlers/admin/lesson-from-image.js
BUG-007                   → يُتحقق عند أي رفع صورة جديد
```
