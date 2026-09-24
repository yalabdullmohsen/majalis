# Update Display Hang — Root Cause Report (PR-0)

**Program:** Sunnah Startup & Atomic Update Pipeline  
**Stage:** PR-0 — Reproduce + inventory + root cause only (**لا إصلاح منتج**)  
**Base:** `origin/main` @ `6b9333430` (فرع `cursor/startup-update-display-pr0-rootcause`)  
**Measured at:** `2026-09-24T17:22:00Z` (توقيت تقريبي للجلسة)  
**Environment:** local agent · static code path + unit inventory  
**Companion baseline:** `docs/performance/STARTUP_ROOT_CAUSE_REPORT.md` (مسار إقلاع أوسع، 2026-09-23)

لا أرقام مخترعة. ما لم يُقَس على iPhone/iPad/TestFlight في هذه الجلسة = **NOT MEASURED**.  
لا إعلان `SUNNAH_STARTUP_AND_UPDATE_PIPELINE_STABLE` في PR-0.

---

## 1) مطابقة العرض المؤكد (الصورة)

| عنصر في الصورة | مصدر الكود المثبت |
|---|---|
| عنوان كامل «تحديث العرض» | `ErrorBoundary.render` عند `recovering` — `artifacts/majalis/src/components/ErrorBoundary.tsx` ~L158 |
| «تم تحديث المنصة، يُحدَّث العرض…» (نص الصفحة) | نفس الملف ~L160 (`يُحدَّث` بشدة على الدال) |
| Toast أسفل «تم تحديث المنصة، جاري تحسين العرض…» | `chunk-recovery.ts` → `CHUNK_RECOVERING_EVENT` detail + `ChunkRecoveryToast.tsx` |
| مساحة فارغة كبيرة / لا Home | ErrorBoundary يستبدل **كل** الشجرة تحت الجذر بصفحة الاستعادة |
| لا زر استرداد أثناء التعليق | واجهة `recovering` بلا أزرار؛ الأزرار فقط بعد فشل الاستعادة (`recovering=false`) |
| رسالتان لنفس العملية | صفحة ErrorBoundary + Toast من نفس `tryRecoverFromStaleChunk` |

نصوص البحث الحرفي (موجودة في المستودع):

- `تحديث العرض` → ErrorBoundary فقط (صفحة كاملة)
- `تم تحديث المنصة` → ErrorBoundary + SectionErrorBoundary + chunk-recovery + ChunkRecoveryToast
- `يُحدَّث العرض` → ErrorBoundary / SectionErrorBoundary / fallback Toast
- `جاري تحسين العرض` → `chunk-recovery.ts` announce فقط

لا يوجد route باسم `/update-display` — الشاشة **ليست مسار تنقّل** بل حالة `ErrorBoundary.state.recovering`.

---

## 2) التسلسل الفعلي حتى نقطة التعليق

```
App start (main.tsx)
→ createRoot + ChunkRecoveryToast + ErrorBoundary + App
→ (اختياري) SW register بعد 5s · version check · lazy routes
→ ChunkLoadError عند import ديناميكي لأصل hashed مفقود/قديم
→ lazyWithRetry.catch → tryRecoverFromStaleChunk(label)
   و/أو ErrorBoundary.getDerivedStateFromError(recovering=true)
→ announceRecovering() → Toast
→ ErrorBoundary يعرض صفحة «تحديث العرض» (يحجب Home)
→ requestSwShellPurge (postMessage MAJALIS_PURGE_SHELL_ASSETS)
→ setTimeout 80ms → safeLocationReload({ force: true }) → window.location.reload()
→ ★ نقطة التعليق المحتملة: بين عرض الشاشة واكتمال reload + أول INTERACTIVE ناجح
```

**آخر خطوة قبل التعليق المستخدم:** رسم صفحة `recovering` + إطلاق Toast، ثم انتظار `reload` (أو انتظار `PAGE_LOAD_TIMEOUT_MS = 20000` داخل `lazyWithRetry` قبل إعادة رمي الخطأ).

**Promise / Event / State المسببة:**

| نوع | اسم |
|---|---|
| State | `ErrorBoundary.recovering` / `SectionErrorBoundary.recovering` |
| Module flag | `chunk-recovery.recoveryInFlight` |
| Session | `majalis-chunk-reload` (سماح محاولة واحدة) |
| Event | `majalis:chunk-recovering` |
| Timer | `setTimeout(..., 80)` قبل reload |
| Promise hang aid | `lazyWithRetry` ينتظر حتى 20s بعد بدء الاستعادة ثم `throw` |
| Side effect | `window.location.reload()` عبر `safeLocationReload` |

لا توجد حالة `UPDATE_DISPLAY_SCREEN` في `AppStartupController` — الشاشة **خارج** آلة الإقلاع وتعمل عبر ErrorBoundary رغم وجود Controller (PR-1 سابق).

---

## 3) السبب الجذري (مثبت بالكود)

### الجذر التقني (محفّز)

بعد نشر جديد، تبقى جلسة WebView/تبويب (أو كاش SW) مع **رسم وحدة module graph يشير إلى `/assets/*.{js,css}` بـhash قديم**. فشل التحميل يُصنَّف `isChunkLoadError` (انظر `lazy-with-retry.ts`).

### الجذر السلوكي (ما يُنتج التعليق الظاهر)

مسار «الاستعادة» مصمَّم كـ **شاشة حاجبة كاملة + Toast + reload تلقائي**:

1. **يحجب التطبيق** بدل الإبقاء على آخر Shell صالحة.
2. **لا مهلة خروج من حالة `recovering`** إن تأخّر/فشل `reload` (Capacitor WebView، شبكة، SW).
3. **مصدران UI لنفس الحدث** (صفحة + Toast) → تطابق الصورة.
4. عند فشل المحاولة الأولى واستمرار الكاش المختلط: المستخدم إما يبقى على الشاشة الحاجبة أو يصل لزر «تحديث المنصة» الذي يستدعي `hardRecoverStaleDeploy` (مسح **كل** Cache + unregister SW + reload) — مسار قاسٍ وغير مقبول كإقلاع.

هذا ليس «تحديث منصة» حقيقيًا عبر AppUpdateManager (غير موجود بعد)، بل **استعادة chunk بعد فشل import** مغلَّفة برسائل تحديث.

---

## 4) Service Worker / Cache (ذو صلة)

| بند | حالة على `main` الحالي |
|---|---|
| تسجيل | `registerProductionServiceWorker` بعد **5000ms** |
| `skipWaiting` / `clients.claim` | موجودان في `public/sw.js` |
| `controllerchange` | **لا reload** بعد الجلسة — `mj:sw-updated-quiet` فقط (`service-worker.ts`) |
| Purge من الاستعادة | `MAJALIS_PURGE_SHELL_ASSETS` يحذف مفاتيح كاش محددة ثم reload |
| خطر | purge + reload قد يتركان HTML قديمًا في الذاكرة حتى يكتمل التنقّل؛ أو يخدمان أصولًا ناقصة إن فشل التنزيل |
| تحديث النسخة المنفصل | `useVersionCheck` + `UpdateAvailableBanner` — مسار موازٍ **غير** شاشة «تحديث العرض» |

---

## 5) AppStartupController vs الواقع

موجود: `NATIVE_LAUNCH → BOOTSTRAPPING → MINIMUM_READY → INTERACTIVE` (+ BACKGROUND_REFRESH / ERROR).

**غير موجود بعد:**

- `AppUpdateManager`
- ربط chunk-recovery بحالات Controller
- منع ErrorBoundary من استبدال الشجرة أثناء INTERACTIVE

شاشة «تحديث العرض» = تجاوز فعلي لعقد «لا UPDATE_DISPLAY_SCREEN».

---

## 6) مصفوفة إعادة الإنتاج (هذه الجلسة)

| # | سيناريو | نتيجة هذه الجلسة |
|---|---|---|
| 1–7 | Clean / upgrade / cold / warm / resume / update while open/closed | **NOT MEASURED** على جهاز |
| 8–11 | شبكة سريعة/بطيئة/قطع/offline | **NOT MEASURED** |
| 12–15 | SW waiting/active / cache قديمة/تالفة | **مثبت بالكود** كمسار؛ تشغيل جهاز NOT MEASURED |
| 16–17 | HTML/JS إصدار مختلط | **مثبت** كمحفّز `ChunkLoadError` |
| 18–20 | iPhone / iPad / TestFlight Release | **NOT MEASURED** |

**إعادة إنتاج منطقية محلية (بدون جهاز):**  
تشغيل بوابات/قراءة ثابتة تُثبت أن النصوص والمسار ما زالا في الشجرة؛ محاكاة وحدة `tryRecoverFromStaleChunk` تضبط `recoveryInFlight` وتطلق الحدث.  
**لا** يُعتبر ذلك إثباتًا على TestFlight.

---

## 7) ما يجب أن تفعله PRs اللاحقة (لا تُنفَّذ هنا)

| PR | هدف |
|---|---|
| 1 | ربط/تشديد AppStartupController حول MINIMUM_READY دون شاشة تحديث |
| 2 | AppUpdateManager (IDLE…FAILED) منفصل عن chunk recovery |
| 3 | **حذف** صفحة «تحديث العرض» + رسائل Toast التقنية المكررة |
| 4 | تحديث SW/كاش ذري (نسخة كاملة قبل التفعيل) |
| 5 | Recovery + Watchdog مهلة خروج من أي BOOTSTRAP/recover بدون reload loop |
| 6 | استقرار Root mount (لا key/reload من update) |
| 7–8 | اختبارات Offline/deep-link/resume + أجهزة |
| 9 | حذف legacy + تقرير قبول |

---

## 8) قبول PR-0

- [x] نصوص الشاشة/Toast محددة بملفات وأسطر  
- [x] تسلسل التنفيذ ونقطة التعليق موثّقة  
- [x] السبب الجذري: حاجز ErrorBoundary recovering + reload بعد chunk stale + ازدواج Toast  
- [x] لا تعديل منتج إصلاحي في هذا الـPR  
- [ ] إثبات جهاز/TestFlight — مؤجّل PR-8  

**الحالة:** PARTIAL (جذر مثبت بالكود؛ تحقق الجهاز غير مكتمل)
