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
