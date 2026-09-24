# Startup + Dark Mode — Root Cause Report (PR-0)

**Program:** سُنّة — Startup FOUC/Hang + Dark Mode Release Blocker  
**Stage:** PR-0 — Reproduction inventory + root cause only (**لا إصلاح منتج**)  
**Base:** `origin/main` @ `16385bace` (بعد #2261)  
**Branch:** `cursor/startup-dark-mode-pr0-rootcause`  
**Measured at:** `2026-09-24T19:15:00Z` (تقريبي)  
**Evidence images:** جلسة المستخدم — Home FOUC + Toast تحديث · مركز قرآن ليلي · أقسام ليلي  

لا أرقام مخترعة للجهاز. ما لم يُقَس على TestFlight = **NOT MEASURED**.  
لا إعلان `SUNNAH_STARTUP_AND_DARK_MODE_COMPLETE` في PR-0.

مراجع سابقة مرتبطة (لا تلغي هذا التقرير الموحّد):

- `docs/performance/UPDATE_DISPLAY_HANG_ROOT_CAUSE_PR0.md`
- `docs/performance/STARTUP_ROOT_CAUSE_REPORT.md`

---

## 1) مطابقة أعراض الصورة 1 (إقلاع / FOUC)

| عرض في الصورة | تفسير كود مؤكد |
|---|---|
| Toast «تم تحديث المنصة، جاري تحسين العرض…» | `chunk-recovery.ts` → `CHUNK_RECOVERING_EVENT` · يرسمه `ChunkRecoveryToast` في `main.tsx` **خارج** ErrorBoundary |
| Home ظاهرة جزئيًا تحت الـToast | ليست دائمًا شاشة ErrorBoundary الكاملة؛ الاستعادة قد تُعلن من `lazyWithRetry` / SectionErrorBoundary بينما يبقى جزء من الشجرة |
| نص أبيض على أبيض (تحية / أزرار) | Hero يفترض سطحًا داكنًا/براند بينما CSS/الثيم لم يكتمل → **THEME_HYDRATION_LATE** + نقص طبقة Hero |
| روابط زرقاء تحتها خط (`الورد…` / دليل طالب العلم) | أنماط المتصفح الافتراضية لـ`<a>` — **CRITICAL_CSS_NOT_READY** / CSS مسار الصفحة مؤجّل |
| بطاقات/مساحات فارغة كبيرة | هيكل بدون أسطح ملوّنة جاهزة |
| Bottom Navigation ظاهرة | الكروم السفلي يُرسم قبل استقرار المحتوى/الثيم |
| Header ناقصة / غير مستقرة | Suspense chrome + تأخر NavBar الحقيقي (موثّق سابقًا) |

### تصنيف السبب المؤكد (إقلاع)

أسباب متعددة متراكبة — كلها مثبتة بالكود؛ الجهاز يحدد الغالب:

| رمز | ارتباط بالصورة |
|---|---|
| **CHUNK_LOAD_FAILURE** | Toast التحديث من `tryRecoverFromStaleChunk` بعد stale hashed assets |
| **CRITICAL_CSS_NOT_READY** | روابط زرقاء + غياب أنماط الهوية على Home |
| **THEME_HYDRATION_LATE** | نص أبيض على خلفية فاتحة |
| **SERVICE_WORKER_WAITING** / **STALE_HTML_NEW_ASSETS** | محفّز شائع لـChunkLoadError بعد نشر |
| **ROOT_REMOUNT** | غير مثبت رقميًا هذه الجلسة (NOT MEASURED) |

---

## 2) مسار رسالة التحديث (حرفي)

| نص | ملف |
|---|---|
| `تم تحديث المنصة، جاري تحسين العرض…` | `src/lib/chunk-recovery.ts` (`announceRecovering`) |
| Toast UI | `src/components/ChunkRecoveryToast.tsx` |
| `تحديث العرض` + `يُحدَّث العرض…` (صفحة كاملة) | `src/components/ErrorBoundary.tsx` عند `recovering` |
| قسم | `SectionErrorBoundary` نفس الملف |
| محفّز | `lazyWithRetry` → `tryRecoverFromStaleChunk` · أو `componentDidCatch` |
| إغلاق متوقع | `window.location.reload()` عبر `safeLocationReload({force:true})` بعد 80ms |
| شرط التعليق | `recovering` بلا مهلة خروج إن تأخّر/فشل reload · أو FOUC أثناء الإعلان قبل اكتمال الاستعادة |

**مصدران UI لنفس الحدث:** صفحة ErrorBoundary (عند catch) + Toast عام — يطابق ازدواج الرسائل.  
**لا** `AppUpdateManager` بعد.  
`AppStartupController` موجود لكن **لا يملك** حالة الاستعادة ولا يمنع الرسم قبل CSS الحرجة لمسار الصفحة.

---

## 3) FOUC / ترتيب الأصول (كود)

| بند | حالة على `main` |
|---|---|
| Inline critical في `index.html` | `#mj-lcp-critical` + splash · `app-booting` من أول إطار |
| حزمة CSS ثقيلة في `main.tsx` | عشرات الاستيرادات المتزامنة قبل mount + طبقات مؤجّلة عبر `loadNonCriticalCss` |
| ميزانية critical gzip | بوابة ≤60KiB — ضغط الميزانية يدفع تأجيل أنماط الصفحة |
| خطوط UI | Amiri preload · `font-display: optional` — قد يتخطى الخط → مقاييس بديلة ثم قفزة |
| Theme | `readThemePreference` / `resolveTheme` مبكر؛ Hero/صفحات قد ترسم قبل اكتمال طبقات CSS الليلية/النهارية |
| SW | تسجيل بعد 5s · `controllerchange` → quiet (لا reload) · استعادة chunk ما زالت تفرض reload |

**الخلاصة:** الرسم يحدث قبل اكتمال **هوية الصفحة** (ليس فقط App Shell الكروم)، فيظهر FOUC حتى مع وجود critical جزئي.

---

## 4) مصفوفة إعادة الإنتاج (هذه الجلسة)

| سيناريوهات 1–20 (تثبيت/شبكة/SW/أجهزة/Release) | نتيجة |
|---|---|
| إثبات مسار بالكود + مطابقة صور المستخدم | ✅ |
| Cold/Warm/Offline/TestFlight على جهاز | **NOT MEASURED** |

---

## 5) AppStartupController — فجوة العقد

موجود: `NATIVE_LAUNCH → BOOTSTRAPPING → MINIMUM_READY → INTERACTIVE` (+ BACKGROUND_REFRESH / ERROR).

**ناقص مقابل عقد المهمة:**

- بوابة MINIMUM_READY لا تشترط «لا واجهة خام / CSS صفحة جاهزة».
- لا ربط مع chunk-recovery.
- حالات UPDATE_DISPLAY / IMPROVING_DISPLAY غير رسمية لكنها **موجودة فعليًا** عبر ErrorBoundary + Toast.
- لا AppUpdateManager · لا Atomic Cache activation · لا Watchdog إقلاع مستقل مكتمل لهذه الرسالة.

---

## 6) Dark Mode — مطابقة الصور 2 و 3

| عرض | جذر كود / بنية |
|---|---|
| خلفية ≈ بطاقات (كل شيء أخضر داكن) | طبقات `html.dark` / `--mj-*` متقاربة · غياب نظام Layer 0–4 دلالي موحّد `--app-surface-*` |
| نص ثانوي / tags غير مقروءة | ألوان ثابتة أو soft على أسطح داكنة بلا AA |
| زر «متابعة القراءة» شبه مخفي | سطح تفاعلي ≈ سطح البطاقة |
| أسهم عائمة تغطي المحتوى | Floating controls بلا FloatingLayerManager / inset |
| Bottom Nav Active ضخم / قريب من المحتوى | كثافة Active + ضعف content-inset |
| Header بدون فصل طبقي | نفس درجة الخلفية |
| مكونات بـHex / light-only overrides | طبقات متعددة: `dark-mode-surfaces.css`, `dark-design-system.css`, `section-cards-theme`, brand-v4 — هجرة غير مكتملة |

**لا يوجد** بعد عقد Semantic Tokens المطلوب (`--app-background`, `--app-surface-primary`, …) كمصدر وحيد Light/Dark/Increase Contrast.

الوضع الحالي أقرب إلى: overrides ليلية متراكمة + هوية خضراء داكنة واسعة، لا تجربة ليلية مدروسة بطبقات.

---

## 7) مركز القرآن (الصورة 2) — قائمة إصلاح لاحقة (لا تُنفَّذ هنا)

- بطاقة فتح المصحف / متابعة القراءة  
- شبكة التلاوة والتفسير  
- FAB السهم  
- Active القرآن في Bottom Nav  
- تباين العنوان والوصف  

→ **PR-8** في خطة المهمة بعد استقرار Shell + Tokens.

---

## 8) خطة PRs (من عقد المالك — لا تنفيذ في PR-0)

| PR | هدف |
|---|---|
| **0** | هذا التقرير + بوابة جرد |
| 1 | AppStartupController + Stable App Shell (لا FOUC) |
| 2 | AppUpdateManager + حذف رسائل/شاشة التحديث |
| 3 | Atomic SW/Cache |
| 4 | Watchdog + Root mount |
| 5 | Semantic color tokens |
| 6–9 | Dark migration Shell → Cards → Quran Hub → Routes |
| 10 | A11y / Contrast |
| 11 | Release / TestFlight / Legacy delete |

---

## 9) قبول PR-0

- [x] نصوص التحديث مربوطة بملفات  
- [x] FOUC مصنّف (CRITICAL_CSS / THEME / CHUNK)  
- [x] Dark Mode gaps موثّقة من الصور + بنية CSS  
- [x] لا تعديل منتج  
- [ ] جهاز / Upgrade / 20 cold starts — مؤجّل PR-11  

**الحالة:** PARTIAL
