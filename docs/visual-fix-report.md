# تقرير الإصلاح البصري — مجالس العلم

تاريخ البدء: 2026-07-26  
ملاحظة: كل ملاحظات `LINK_MISMATCH` في فحص Playwright **مُتجاهَلة** (إنذارات كاذبة). المشاكل الحقيقية ≈ 28.

---

## المرحلة 1 — دروس 404

**الفرع:** `cursor/visual-fix-phase1-lesson-404s-1f54`  
**PR:** https://github.com/yalabdullmohsen/majalis/pull/348

### التشخيص الجذري
1. إعادة كتابة Vercel: `/lessons/:id` → `/api/lessons/:id` → `/api/index`.
2. `matchApiRoute` كان يعتمد `x-vercel-original-path` = `/lessons/...` فلا يطابق بادئة `/api/lessons` → JSON 404 `المسار غير موجود.`
3. صفحة الدرس كانت تبحث في Supabase فقط بلا احتياطي بذرة؛ و`external_key` بصيغة `kuwait-lessons:HASH` كانت تُفسَّد بـ `replace(/-/g, ":")`.
4. معرّفا البصمة الطويلان أسماء بديلة لـ `kw-rashed-fundamental-course-0/1` (من مزامنة قديمة في crawler، أُزيلت لاحقاً).

### جدول الدروس التسعة

| المعرّف | التشخيص | الإجراء |
|---|---|---|
| `sci-tahfiz-adults-2026` | موجود في البذرة (approved)، غير في لقطة SEO القديمة (17) | إصلاح التوجيه + احتياطي البذرة + تحديث اللقطة (97) |
| `sci-seerah-madani-weekly` | كذلك | كذلك |
| `kw-hadith-sahih-bukhari-read-0` | كذلك | كذلك |
| `kw-ajraa-murtaqa-course-3-1` | كذلك | كذلك |
| `kw-ajraa-murtaqa-course-3-2` | كذلك | كذلك |
| `kw-mahboula-dosari-umdat-tawhid-2026-1` | كذلك | كذلك |
| `kw-mutlaq-aljasr-talaeea-elm-0` | كذلك | كذلك |
| `kuwait-lessons-403089…` | اسم بديل لـ `kw-rashed-fundamental-course-0` | 301 + canonicalize في الروابط |
| `kuwait-lessons-7b923f…` | اسم بديل لـ `kw-rashed-fundamental-course-1` | 301 + canonicalize |

### دروس مخفية / بلا رابط تفاصيل
- أي معرّف يطابق `kuwait-lessons-{32hex}` بلا اسم بديل معروف → لا `detailsHref` (حاجز دائم).
- لا إنشاء محتوى درس جديد.

### الملفات المعدّلة
- `lib/api-dispatch.mjs` — مطابقة المسار بعد إعادة الكتابة + بادئة `/lessons`
- `lib/api-handlers/lesson-page.js` — استخراج id، aliases، بذرة، 301
- `lib/lesson-id-aliases.mjs` + `src/lib/lesson-id-aliases.ts`
- `src/lib/kuwait-lessons.ts`, `unified-lesson-card.ts`, `lessons-service.ts`, `supabase.ts`
- `UnifiedLessonCard.tsx`, `LessonDetailPage.tsx`, `CalendarPage.tsx`, `SearchPage.tsx`
- `scripts/lessons-seed.snapshot.json` — من 17 إلى 97

### حالة البناء
(تُحدَّث)

### حالة البناء
نجاح (5932a01d+)

---

## المرحلة 2 — صفحة 404 لائقة

**الفرع:** `cursor/visual-fix-phase2-not-found-page-1f54`  
**PR:** (يُحدَّث)

### ما نُفّذ
- وحدة مشتركة `lib/not-found-html.mjs`: title + meta description + `lang=ar` `dir=rtl` + H1 + شعار + ثلاثة روابط (الرئيسية، الدروس، البحث) + HTTP 404.
- `api-dispatch`: عند عدم تطابق المسار وطلب HTML → صفحة 404 بدل JSON عارٍ.
- `lesson-page`: نفس قالب HTML للدرس غير الموجود.
- واجهة SPA `not-found.tsx`: هوية + روابط الخروج الثلاثة المطلوبة.

### ملاحظة
مسارات SPA العامة غير المعروفة ما زالت قد تُخدم بـ `index.html` وحالة 200 (سلوك catch-all في Vercel). مسار `/lessons/:id` المكسور كان مصدر الـ ~42 حرفاً JSON وهو ما أُصلح بـ HTTP 404 HTML.

### حالة البناء
نجاح

---

## المرحلة 3 — طلبات بيانات فاشلة

**الفرع:** `cursor/visual-fix-phase3-supabase-errors-1f54`  
**PR:** (يُحدَّث)

### ERR_ABORTED على sharia_rulings
- السبب: `RequestManager` يُلغي fetch بعد 8 ثوانٍ → Chrome `net::ERR_ABORTED`.
- الإصلاح: مهلة Supabase العامة → 15 ثانية في `supabase-bootstrap.ts`.
- FiqhPage: يعرض `ErrorState` + إعادة محاولة بدل Empty صامت؛ `cancelled` عند unmount.

### 401 على bookmarks
- السبب: `fetchLessonEngagementStats` يطلب `bookmarks` للزائر؛ RLS ترفض.
- الإصلاح: لا يُطلب bookmarks إلا بوجود جلسة.

### صفحات كانت تنهار بصمت (أُصلِحت)
| الصفحة | الإصلاح |
|---|---|
| `/fiqh` | ErrorState + retry |
| `/updates` | ErrorState + retry |
| `/calendar` | ErrorState + retry |
| `/rulings/:id` | ErrorState عند dbError |

### ما بقي صامتاً (ذِكر — خارج الحد الأدنى)
LearnHub، FiqhCouncilList، AnnualCourses، Vault، HadithPage catch→[] — سُجّلت للمراجعة لاحقاً.

### حالة البناء
نجاح

---

## المرحلة 4 — مسارات مكررة (canonical)

**الفرع:** `cursor/visual-fix-phase4-canonical-1f54`  
**PR:** (يُحدَّث)

### ما نُفّذ
- `applyPageSeo`: يُطبّق `normalizePath` على canonical دائماً (بلا ?/#).
- `canonicalPath` صريح لـ `/adhkar` و`/salah-guide` و`/lessons`.
- JSON-LD لأقسام الأذكار يشير للمسار الأساسي `/adhkar` (لا نسخ ?cat=).
- `sitemap.xml`: كان أصلاً بلا معاملات استعلام لهذه الصفحات — لا تغيير مطلوب.

### حالة البناء
نجاح

---

## المرحلة 5 — صفحات شبه فارغة

**الفرع:** `cursor/visual-fix-phase5-thin-pages-1f54`  
**PR:** (يُحدَّث)

### طبيعية — لم تُعدَّل
`/qibla`، `/tasbih`، `/login`، `/search`، `/prayer-countdown`، `/adhan-settings`، `/prayer-times`

### تقنية — عُولجت
- إثراء `RICH_BODY` في `generate-seo.mjs` لـ `/quiz`، `/raqaiq`، `/daily-wird`، `/learning/paths` بنصوص موجودة أصلاً في الصفحات (لا اختراع).
- `/learning/paths`: ErrorState + retry عند فشل الجلب.

### قانونية — يحتاج كتابة بشرية (لم تُؤلَّف)
| المسار | ملاحظة |
|---|---|
| `/privacy` | يوجد نص حالي؛ مراجعة بشرية للتغطية القانونية الكاملة |
| `/terms` | كذلك |
| `/contact` | كذلك |

### حالة البناء
(تُحدَّث)

---

## المرحلة 6 — تعدد H1

**الفرع:** `cursor/visual-fix-phase6-single-h1-1f54`  
**PR:** (يُحدَّث)

### القاعدة
H1 واحد ظاهر لكل صفحة. أُبقي العنوان الرئيسي H1 وحُوّل الثانوي إلى H2 مع الإبقاء على className (المظهر عبر CSS).

### ملفات عُدّلت (ثانوي → H2 حيث كان تكراراً حقيقياً في الشجرة)
ProphetStories (أقسام)، TopicPage، PrayerCountdown، AccountDeletion، IslamicStories (أقسام)، MyCitations، UniversitiesCompare، CarMode، LearningQuiz (حالات النتيجة الثانوية)، وغيرها بعد مراجعة الحالات الحصرية.

### CSS
توسيع محددات `.page-shell h1.*-hero__title` لتشمل `h2` بنفس المظهر.

### ملاحظة
كثير من حالات «H1 مزدوج» في الفحص كانت حالات حصرية (تحميل/خطأ/نجاح) — أُبقيت H1 لكل حالة على حدة.

### حالة البناء
نجاح

---

## المرحلة 7 — الأداء

**الفرع:** `cursor/visual-fix-phase7-perf-1f54`  
**PR:** (يُحدَّث)

### مكاسب آمنة طُبّقت
- تقسيم المسارات كان موجوداً (`lazyWithRetry`) — أُبقي.
- تأجيل خطوط Google الزخرفية (Amiri/Scheherazade/…) إلى idle/تفاعل.
- تقليل أوزان Alexandria/IBM في التحميل الأول + `display=swap`.
- تأجيل حزمة `AssistantFloatingWidget` حتى idle أو أول تفاعل.
- الصور خارج الطية: `loading="lazy"` موجود في المكوّنات الأساسية.

### قياس قبل/بعد (TTFB عبر curl — ليس Lighthouse كامل)
| المسار | إنتاج (قبل) time_total | محلي بعد التعديل |
|---|---|---|
| `/` | ~0.13s | (يُقاس محلياً) |
| `/lessons` | ~0.16s | |
| `/library` | ~0.18s | |
| `/fiqh` | ~0.09s | |

ملاحظة: بطء 7.9s في الفحص السابق يعود لتحميل العميل/الجوال لا لـ TTFB الخادم. المكاسب تستهدف JS/خطوط فوق الطية.

### حالة البناء
نجاح
