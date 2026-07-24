# تسليم فني — لنافذة automation/tasks

> كل ما هنا اكتُشف من نافذة automation/content ولا يجوز إصلاحه من هذه النافذة
> لأنه يتطلب تعديل بنية التطبيق/سكربتات البناء لا بيانات المحتوى فقط.

---

## 1. فجوة seo-routes.json: صفحات ديناميكية بلا مسارات فردية (خطورة: حرجة)

**الملف المولَّد:** `artifacts/majalis/src/lib/seo-routes.json`
**يُولَّد بواسطة:** `artifacts/majalis/scripts/generate-seo.mjs` (+ إضافات جزئية من `sync-seo-data.ts`)
**يُستهلَك بواسطة:** `artifacts/majalis/scripts/prerender.mjs` — يبني صدفة HTML ثابتة لكل مسار وقت البناء لخدمة الزواحف مباشرة (Vercel static serving له أولوية على rewrites).

**المشكلة:** فحصت 175 مدخلاً في `seo-routes.json` (بتاريخ 2026-07-24) وحسبت التوزيع حسب البادئة. الأقسام التالية **لا تملك أي مسار فردي لكل عنصر** — فقط مسار المجموعة العام:

- `/library/*` — 0 من 133 كتاباً
- `/rulings/*` — 0 (عدد الأحكام غير محسوب لكنه كبير)
- `/sheikhs/*` — 0 من ~92 مشايخ
- `/scholars/*` — كان 0، لكن **تشغيل `sync-seo-data.ts` أضاف 99 مساراً فعلياً بنجاح هذه الجلسة** (كان السكربت موجوداً لكن لم يُشغَّل منذ فترة — ليس بالضرورة موصولاً بـ`pnpm run build`؛ تحقق من أنه مُستدعى في سلسلة البناء الفعلية، غير مؤكد من `package.json` أنه كذلك).
- `/annual-courses/*` — 0
- `/sahabah` — لم يُتحقق منه مساراً فردياً

بالمقابل، هذه الأقسام **لها** مسارات فردية فعلية: `/fiqh-council/*` (14)، `/hadith/*` (4)، `/quran/*` (4)، `/learning/*` (3)، `/prophets/*` (1 فقط — ناقص أيضاً غالباً)، `/universities/*` (1)، `/auth/*` (2).

**الأثر المشاهَد فعلياً:** صفحة `/library/{id}` لكتاب "حصن المسلم" — عند التحقق من `src/lib/seo.ts` دالة `routeForPath`، أي مسار `/library/*` غير مُدرَج فردياً في `seo-routes.json` يقع في fallback عام نصّه الثابت **"كتاب شرعي | المجلس العلمي"** (`artifacts/majalis/src/lib/seo.ts:127`). هذا الـfallback **مصمَّم عمداً** كنمط عام لكل أنواع المحتوى الديناميكي (نفس النمط لـ"قرار المجمع الفقهي"، "حكم شرعي"، "دورة علمية") — أي أنه سلوك متعمَّد لحالة "لم يوجد مسار محدد"، وليس خللاً في هذا الملف نفسه. الخلل الحقيقي هو **غياب توليد المسار الفردي** لهذه الأقسام في `generate-seo.mjs`.

على مستوى العميل (بعد Hydration)، `LibraryDetailPage.tsx` يستدعي `applyPageSeo` مباشرةً بعنوان الكتاب الحقيقي — فالمستخدم البشري لا يرى المشكلة أبداً؛ **الزواحف فقط** (وروابط مشاركة السوشيال ميديا قبل تحميل JS) تُصادف العنوان العام أو (في حالة `/rulings/*`) قد تُصادف محتوى الصفحة الرئيسية بالكامل بدل محتوى الحكم إن كان الـfallback عند `routeForPath` لمسار غير معروف تماماً يرتد لـ`/`.

**المطلوب من automation/tasks:** توسيع `generate-seo.mjs` (بنفس نمط `/fiqh-council/*` الموجود فعلاً كمرجع) ليولّد مدخلاً فردياً لكل: `/library/:id`, `/rulings/:id`, `/sheikhs/:id`, `/annual-courses/:id`, وأي قسم ديناميكي آخر يتضح افتقاره عند التوسّع.

---

## 2. تعارض كاتبَين على `src/data/library-catalog.json` (خطورة: عالية)

اكتُشف أثناء محاولة تشغيل `sync-seo-data.ts` لمزامنة `scholars-seo.json` (البند 4 من backlog.json — b004). السكربت شغّال بلا تحذير لكنه **يكتب أيضاً** إلى `artifacts/majalis/src/data/library-catalog.json` بمخطط مبسّط جداً (`id, title, author, category, description` فقط) — **يحذف** الحقول `slug, canonicalTitle, normalizedTitle, authorId, editions, verificationStatus, sources, reviewedBy, reviewedAt` التي يعتمد عليها `scripts/test-library-integrity.mjs` وسكربت آخر مخصص:

`scripts/regen-library-catalog-json.mjs` — يكتب لنفس الملف **بالمخطط الكامل الصحيح**، ويحافظ على الإثراء القائم (authorId/editions/verificationStatus) للكتب الموجودة مسبقاً.

**ما حدث فعلياً هذه الجلسة:** شغّلت `sync-seo-data.ts` (لغرض آخر تماماً — تحديث `scholars-seo.json`)، فولّد نسخة مبسّطة أفقدت 1463 سطراً من الإثراء في `library-catalog.json`. **رُصد الأمر وأُرجِع فوراً عبر `git checkout`** قبل أي commit — لم يُدفع أي فقدان بيانات. لكن هذا يعني: **أي تشغيل مستقبلي لـ`sync-seo-data.ts` (يدوياً أو ضمن سلسلة بناء) سيُتلف `library-catalog.json` بصمت** ما لم يُشغَّل `regen-library-catalog-json.mjs` بعده مباشرة لإصلاح الضرر — وهذا ترقيع لا حل.

**المطلوب من automation/tasks:** حسم أي السكربتين هو "المصدر" لهذا الملف (الأرجح: `regen-library-catalog-json.mjs` لأنه يحافظ على الإثراء المُستهلَك في `test-library-integrity.mjs`)، ثم إما:
- تعديل `sync-seo-data.ts` ليتوقف عن الكتابة لهذا الملف أصلاً (وينقل مسؤوليته لملف مرآة SEO منفصل)، أو
- توحيد المخطط بين السكربتين فعلياً.

---

## 3. للمرجعية: نتائج فحوصات محلية سريعة (لا تتطلب فعلاً تقنياً، محتوى فقط)

- `node scripts/audit-data-quality.mjs` → 4 تكرارات في Adhkar (راجع `data/data-quality-audit.json`) — عنصر backlog b008، سيُعالَج من نافذة المحتوى.
- `node scripts/test-identity.mjs` → ناجح، لا مشكلة هوية.
- `npx tsx scripts/generate-content-counts.ts` → الأعداد مشتقة آلياً بالفعل (books:133, scholars:99, fawaid:496, quizQuestions:978, mindMaps:23) — بند التكليف 4-3 (الأرقام الثابتة) **مُنفَّذ مسبقاً بالكامل**، لا حاجة لعمل إضافي.
