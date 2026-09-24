# Zero Flicker & Layout Shift — Root Cause Report (PR-0)

**Program:** سُنّة — Zero Flicker / Layout Shift Release Blocker  
**Stage:** PR-0 — Reproduction inventory + performance baseline + root cause only (**لا إصلاح منتج**)  
**Base:** `origin/main` @ `07d580b0afdfc65ce9142129a73c6201f1e47854`  
**Branch:** `cursor/startup-zero-flicker-pr0-baseline`  
**Measured at:** `2026-09-24T21:50:00Z` (تقريبي — جرد كود محلي)  

لا أرقام جهاز مخترعة. ما لم يُقَس على TestFlight / جهاز حقيقي = **NOT MEASURED**.  
**ممنوع** إعلان `SUNNAH_ZERO_FLICKER_AND_LAYOUT_SHIFT_COMPLETE` في هذا الـPR.

مراجع سابقة (لا تلغي هذا التقرير الموحّد):

- `docs/performance/STARTUP_ROOT_CAUSE_REPORT.md`
- `docs/performance/STARTUP_AND_DARK_MODE_ROOT_CAUSE.md`
- `docs/performance/UPDATE_DISPLAY_HANG_ROOT_CAUSE_PR0.md`

---

## 1) نطاق PR-0

| بند | حالة |
|---|---|
| جرد Timeline إقلاع (علامات موجودة) | ✅ موثّق + موصول جزئيًا |
| علامات صلاة DEV جديدة | ✅ مضافة في هذا الـPR (قياس فقط) |
| عدّادات Mount DEV | ✅ وحدة جاهزة؛ الربط التشغيلي لإقلاع/صلاة جزئي |
| فيديو Slow Motion / CLS رقمي | **NOT MEASURED** |
| Cold/Warm/Resume على جهاز | **NOT MEASURED** |
| TestFlight / Upgrade | **NOT MEASURED** |
| إصلاح منتج | ❌ خارج النطاق |

---

## 2) خريطة علامات الأداء (DEV)

### إقلاع — موجود على `main` (أسماء تاريخية)

| مطلوب في العقد | الموجود فعليًا | موصول؟ |
|---|---|---|
| `startup:js-start` | `startup:js-start` | ✅ `main.tsx` |
| `startup:root-mount` | `startup:root-mounted` | ✅ |
| `startup:theme-ready` | `startup:theme-ready` | ✅ |
| `startup:rtl-ready` | — | ❌ غير موصول كعلامة مستقلة (RTL مبكر عبر `dir` في HTML) |
| `startup:critical-css-ready` | — | ❌ (critical مضمّن؛ لا mark) |
| `startup:ui-font-ready` | `startup:fonts-ready` | ✅ تقريبي |
| `startup:router-ready` | — | ❌ |
| `startup:shell-ready` | `startup:shell-ready` | ✅ |
| `startup:first-frame` | — | ❌ |
| `startup:first-stable-frame` | `startup:stable` | ✅ تقريبي |
| `startup:interactive` | انتقال `INTERACTIVE` في AppStartupController | جزئي (لا mark بهذا الاسم) |

المصدر: `artifacts/majalis/src/lib/startup-performance-marks.ts`.

### صلاة — أُضيفت في PR-0 (DEV فقط)

`prayer:navigation-start` · `prayer:route-mount` · `prayer:cached-data-ready` · `prayer:timezone-ready` · `prayer:location-ready` · `prayer:permissions-ready` · `prayer:calculation-ready` · `prayer:first-frame` · `prayer:first-stable-frame` · `prayer:interactive`

المصدر: `artifacts/majalis/src/lib/prayer-performance-marks.ts` + ربط خفيف في `usePrayerCountdown` / `PrayerTimesView`.

---

## 3) أسباب جذرية مؤكدة (بدليل كود)

كل صف يتطلب ملف/سطر أو سلوك شجرة قابل لإعادة الإنتاج من المصدر. لا فرضيات بلا دليل.

| الرمز | الدليل | الأثر المرئي |
|---|---|---|
| **CHUNK_LOAD_FAILURE** | `chunk-recovery.ts` → `announceRecovering` + `safeLocationReload` | Toast «جاري تحسين العرض…» + احتمال reload |
| **SERVICE_WORKER_STALE_ASSET** | مسار stale hashed assets → ChunkLoadError (موثّق سابقًا) | محفّز الشاشة/الـToast أعلاه |
| **OTHER_CONFIRMED** (`UPDATE_DISPLAY_SCREEN`) | `ErrorBoundary.tsx` عند `recovering`: عنوان «تحديث العرض» | صفحة كاملة تحجب المحتوى؛ خارج AppStartupController |
| **CRITICAL_CSS_LATE** / هوية صفحة متأخرة | critical جزئي + طبقات CSS مسار الصفحة مؤجّلة؛ روابط زرقاء افتراضية في صور المستخدم السابقة | FOUC / واجهة خام |
| **THEME_HYDRATION_LATE** | Hero/صفحات قد تُرسم قبل اكتمال طبقات الثيم الليلية (تقرير سابق + صور) | نص فاتح على خلفية فاتحة |
| **FONT_SWAP_LAYOUT_SHIFT** | `fonts-ui.css` / critical: `font-display: optional` | قد يتخطى الخط → مقاييس بديلة ثم قفزة |
| **PAGE_REMOUNT** (مسار كسول) | `PrayerTimesPage` عبر `lazy` + `SafeLazyRoute` → `Suspense` + `LazyRouteFallback` ثم Mount الصفحة | أول دخول للصلاة: هيكل lrf ثم الصفحة |
| **SKELETON_SIZE_MISMATCH** | فرع `!countdown?.next` يعرض `pts-hint--skeleton` (min-height ≈ 4.5rem) **بدون** `pts-hero` / `pts-list`؛ الفرع الجاهز يعرض Hero كامل + قائمة | قفزة ارتفاع كبيرة عند وصول البيانات |
| **ASYNC_DATA_LAYOUT_SHIFT** | `usePrayerCountdownState`: يبدأ من كاش أو `null` ثم `fetchPrayerTimes` يحدّث `data`/`countdown` | تبديل شجرة UI كاملة |
| **PRAYER_LOCATION_SHIFT** / تسمية | `hijriStr ? <p className="pts-hijri">` يظهر بعد البيانات؛ تسمية المدينة عبر `locToken` | إضافة صفوف بعد أول رسم |
| **PRAYER_CALCULATION_SHIFT** | `setCountdown` كل ثانية عبر `subscribeSecondTick`؛ الصفحة تستهلك `useSharedPrayerCountdown()` (يشمل countdown) → إعادة رسم الصفحة كاملة كل ثانية | اهتزاز محتمل / تكلفة render (ليس بالضرورة remount) |
| **DYNAMIC_KEY_REMOUNT** (جذر التطبيق) | مسح `key=` المرتبطة بـ theme/locale/startup على Root/Router/AppShell: **لا يُعثر** على مفاتيح مشبوهة | ROOT_REMOUNT عبر `key` الثيم: غير مثبت |
| **ROOT_REMOUNT** / **ROUTER_REMOUNT** | عدّادات runtime | **NOT MEASURED** هذه الجلسة |
| **SAFE_AREA_LATE** | CSS safe-area موجود؛ قياس JS متأخر | **NOT MEASURED** كسبب غالب |

### سبب قفزة صفحة الصلاة (الخلاصة المؤكدة)

**سلسلة مثبتة:**

1. الدخول إلى `/prayer-times` يمر بـ`LazyRouteFallback` (`lrf-wrap--prayer`) ثم Mount لـ`PrayerTimesView`.
2. إن لم يوجد كاش حقيقي (`initialPayload` → null) أو لم يكتمل العدّاد بعد: الفرع الفارغ **بدون Hero** يعرض skeleton صغير أو رسالة اختيار مدينة.
3. عند اكتمال `countdown.next`: الشجرة تُستبدل بـHero + ranks + `pts-list` (+ hijri شرطي) → **SKELETON_SIZE_MISMATCH** + **ASYNC_DATA_LAYOUT_SHIFT**.
4. على المسار الرئيسي، `PrayerCountdownScope deferMs={20_000}` يؤجّل تفعيل مزوّد الصلاة حتى بعد التحميل؛ أول دخول مبكر للصلاة يبدأ الجلب متأخرًا نسبيًا → يفاقم (2)–(3).

الكاش الحقيقي موجود (`getCachedPrayerTimes`) ويُزرع في `useState` الأولي — **عندما يتوفر** لا يظهر الفرع الفارغ. القفزة الأوضح عند: كاش فارغ / تقدير مرفوض / مدينة غير محددة / أول زيارة بعد مسح التخزين.

---

## 4) AppStartupController — فجوة العقد (ما زالت)

موجود: `NATIVE_LAUNCH → BOOTSTRAPPING → MINIMUM_READY → INTERACTIVE` (+ BACKGROUND_REFRESH / ERROR).

| مطلوب | واقع `main` |
|---|---|
| منع App Shell قبل Critical CSS + RTL + خط UI + هندسة Header/BottomNav | جزئي — ChromeNavFallback/BottomFallback موجودان؛ MINIMUM_READY لا يشترط «لا واجهة خام» |
| ملكية استعادة الـchunk | ❌ ما زالت ErrorBoundary + Toast |
| منع «تحديث العرض» | ❌ الشاشة ما زالت في ErrorBoundary |
| علامات `startup:interactive` بالاسم العقدي | ❌ |

---

## 5) مصفوفة إعادة الإنتاج (هذه الجلسة)

| سيناريو | نتيجة |
|---|---|
| إثبات مسار بالكود + مطابقة تقارير/صور سابقة | ✅ |
| دخول صلاة بلا كاش (منطق الشجرة المزدوجة) | ✅ مثبت بالكود |
| Cold/Warm/Offline/SW waiting على جهاز | **NOT MEASURED** |
| فيديو Slow Motion | **NOT MEASURED** |
| CLS رقمي قبل/بعد | **NOT MEASURED** (baseline JSON يسجّل الحقول كـ null) |
| Light/Dark/System على جهاز | **NOT MEASURED** |
| iPhone / iPad / Split View | **NOT MEASURED** |
| Upgrade / TestFlight | **NOT MEASURED** |

---

## 6) خطة PRs (عقد المالك — لا تنفيذ إصلاح هنا)

| PR | هدف |
|---|---|
| **0** | هذا التقرير + خط أساس + علامات صلاة DEV + بوابة جرد |
| 1 | تشديد AppStartupController + pre-paint Theme/RTL + سد فجوات العلامات |
| 2 | Critical CSS + ثبات الخطوط (مقاييس fallback) |
| 3 | Stable AppShell + Header + BottomNav (هندسة من أول frame) |
| 4 | AppPageTransition موحّد |
| 5 | Prayer stores فصل + cached-first UI بلا شجرة مزدوجة |
| 6 | هندسة صلاة + Skeleton مطابق + ticker نصّي فقط |
| 7 | Atomic SW/Cache + حذف شاشة/رسائل التحديث التقنية |
| 8 | Device matrix + frame visual tests |
| 9 | Release / TestFlight / legacy delete |

---

## 7) قبول PR-0

- [x] أسباب جذرية مصنّفة برموز العقد مع دليل ملف
- [x] سبب قفزة الصلاة موثّق (شجرة مزدوجة + lazy + كاش/defer)
- [x] خط أساس JSON بدون أرقام ملفّقة
- [x] علامات صلاة DEV
- [x] لا تعديل سلوك منتج جوهري
- [ ] قياسات جهاز / CLS / TestFlight — مؤجّلة PR-8/9

**الحالة:** PARTIAL
