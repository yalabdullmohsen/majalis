# المرحلة 0: جرد آليات البحث الموجودة

**تاريخ الجرد:** 2026-07-12  
**الفرع:** feat/unified-arabic-search  
**المسار الجذري:** `artifacts/majalis/`

---

## 1. آليات البحث الموجودة

### 1.1 وحدات البحث في `src/lib/`

| الملف | الغرض | الدوال الرئيسية |
|-------|-------|----------------|
| `arabic-search.ts` | تطبيع وفهرسة عربية | `normalizeArabic()`, `arabicIncludes()`, `arabicMatchAny()`, `arabicSearchPatterns()`, `ilikePattern()` |
| `search-synonyms.ts` | توسيع المرادفات | `expandSearchTerms()` |
| `lesson-search.ts` | بحث الدروس بنظام التقييم | `scoreLessonSearch()`, `rankLessonsBySearch()`, `buildLessonSearchMeta()` |
| `fiqh-global-search.ts` | بحث المجمع الفقهي المدعوم | `searchFiqhCouncilForGlobal()`, `mergeFiqhSearchResults()`, `isFiqhRelatedQuery()` |
| `platform-search.ts` | بحث بيانات seed المحلية | `searchPlatformSeed()` |
| `local-search-ext.ts` | بحث في بيانات محلية متنوعة | `searchLocalExtensions()` (مناسبات، نووية، قرآن، أذكار، قصص) |
| `search-suggestions.ts` | اقتراحات الإكمال التلقائي | `buildSearchSuggestions()` |
| `search-history.ts` | تاريخ البحث (localStorage) | `addSearchHistory()`, `getSearchHistory()`, `getTopSearchQueries()` |
| `scholarly-intelligence-service.ts` | البحث الذكي عبر API | `intelligentSearch()` → يستدعي `/api/intelligent-search` |
| `quran-api.ts` | بحث القرآن (AlQuran Cloud) | `searchQuran()` → `api.alquran.cloud/v1/search/...` |

### 1.2 صفحات البحث في `src/views/`

| الملف | الوصف |
|-------|-------|
| `SearchPage.tsx` | الصفحة الرئيسية `/search/:q` — تدمج intelligentSearch + searchEverything + searchFiqhCouncilForGlobal + searchLocalExtensions |
| `FiqhCouncilAdvancedSearchPage.tsx` | بحث متقدم في المجمع الفقهي `/fiqh-council/advanced-search` |
| `admin/SearchAnalyticsSection.tsx` | تحليلات البحث للمشرف |
| `QuranPage.tsx` | بحث داخل المصحف (تبويب "بحث") عبر AlQuran Cloud API + `arabicIncludes` لأسماء السور |

### 1.3 المكوّنات

| الملف | الوصف |
|-------|-------|
| `components/GlobalSearchModal.tsx` | مودال Ctrl+K — يستخدم `intelligentSearch` مع فلاتر |
| `components/SearchSuggestions.tsx` | مكوّن الاقتراحات للبحث الفوري |

### 1.4 قاعدة البيانات (Supabase)

**دالة RPC الرئيسية:** `search_platform(query text)` — تُستدعى في `supabase.ts:searchEverything()`

**دوال البحث الاحتياطي في `supabase.ts`:**

| الدالة | الجدول | الفلتر |
|--------|--------|--------|
| `searchLessonsFallback` | `lessons` | `status = 'approved'` |
| `searchSheikhsFallback` | `sheikhs` | — |
| `searchLibraryFallback` | `library_items` | `status = 'approved'` |
| `searchQaFallback` | `qa_questions` | `status = 'published'` |
| `searchMiraclesFallback` | `scientific_miracles` | `status = 'approved'` |
| `searchFawaidFallback` | `fawaid` | `status = 'approved'` |
| `searchAdhkarFallback` | بيانات محلية (seed) | — |
| `searchHadithFallback` | `verified_hadith_items` | `status = 'published'` |
| `searchStoriesFallback` | `akp_stories` | `status = 'published'` |

---

## 2. جداول قاعدة البيانات القابلة للبحث

### جداول Supabase مع الأعمدة النصية

| الجدول | الأعمدة النصية القابلة للبحث | فلتر الاعتماد |
|--------|------------------------------|----------------|
| `lessons` | `title`, `description`, `speaker_name`, `category`, `mosque`, `city`, `keywords[]` | `status = 'approved'` |
| `sheikhs` | `name`, `bio`, `specialties[]` | — |
| `library_items` | `title`, `description`, `category`, `type`, `author` | `status = 'approved'` |
| `qa_questions` | `question`, `answer` | `status = 'published'` |
| `scientific_miracles` | `title`, `body`, `category` | `status = 'approved'` |
| `fawaid` | `text`, `author_name`, `title`, `source` | `status = 'approved'` |
| `verified_hadith_items` | `title`, `text`, `narrator`, `collection` | `status = 'published'` |
| `akp_stories` | `title`, `topic`, `summary`, `category` | `status = 'published'` |
| `fiqh_council_items` | `title`, `category`, `summary` | `status = 'published'` |
| `sharia_rulings` | `title`, `summary`, `body` | — |

### بنية قاعدة البيانات الموجودة للبحث

**من `arabic_search_upgrade_v1.sql` (مُطبَّق):**
- دالة `normalize_ar(input text)` في Postgres
- عمود `search_ar` (مولَّد تلقائياً) في: `lessons`, `qa_questions`, `fawaid`, `akp_stories`
- فهارس GIN/trgm على `search_ar` في تلك الجداول

**من `search_index_rag_v1.sql` (مُطبَّق):**
- جدول `search_index` (unified) مع `ts_body tsvector`
- جدول `research_queries` لتسجيل الاستعلامات

---

## 3. بيانات seed المحلية القابلة للبحث

| المجموعة | الملف | الأعمدة |
|----------|-------|---------|
| الفتاوى | `FATWA_SEED` | `question`, `answer`, `summary`, `category`, `keywords[]`, `mufti_name` |
| الأحكام | `RULINGS_SEED` | `title`, `summary`, `body`, `category`, `keywords[]` |
| الدورات السنوية | `ANNUAL_COURSES_SEED` | `title`, `summary`, `body`, `sheikh_names[]`, `mutoon[]`, `keywords[]` |
| المستجدات | `UPDATES_SEED` | `title`, `summary`, `body`, `update_type` |
| الدروس | `LESSONS_SEED` | `title`, `description`, `speaker_name`, `category`, `keywords[]` |
| الفوائد | `SEED_FAWAID` | `text`, `author_name`, `category` |
| الأسئلة | `SEED_QA` | `question`, `answer`, `reference` |
| الأذكار | بيانات محلية | `text`, `keywords[]`, `source`, `reference` |
| الأربعون النووية | `ARBAEEN_NAWAWI` | `title`, `text`, `explanation`, `source` |
| العلماء | `SCHOLARS` | `name`, `fullName`, `bio`, `specialty[]` |
| القصص الإسلامية | بيانات محلية | `title`, `era`, `category`, `slug` |
| قصص السور | بيانات محلية | `name`, `namingReason` |
| المناسبات الإسلامية | بيانات محلية | `name`, `summary` |

---

## 4. بحث القرآن

- **المصدر:** API خارجي حصري — `api.alquran.cloud/v1/search/:query/all/quran-uthmani`
- **التخزين المؤقت:** localStorage (7 أيام)
- **التطبيع:** لا يوجد في القرآن — النص يُعرض كما هو من API بتشكيله الكامل
- **المواقع:**
  - `quran-api.ts:searchQuran()` — دالة مشتركة
  - `QuranPage.tsx` — بحث مباشر عبر `api.alquran.cloud` في تبويب "بحث"
  - `local-search-ext.ts` — بحث في أسماء السور فقط (لا بحث في النصوص)

---

## 5. آلية البحث الذكي

- `intelligentSearch()` في `scholarly-intelligence-service.ts` تستدعي `/api/intelligent-search`
- هذه نقطة نهاية خلفية (Vercel serverless / API handler)
- المسار: `lib/api-handlers/intelligent-search.js`
- **المسار الأساسي:** SearchPage + GlobalSearchModal يستخدمان هذا كأولوية قصوى
- **المسار الاحتياطي:** `searchEverything` → RPC `search_platform` → دوال fallback فردية

---

## 6. ما هو موجود مقابل ما يحتاج إنشاء

### موجود بالفعل ✅
- `normalizeArabic()` في `arabic-search.ts` (تطبيع أساسي)
- `normalize_ar()` دالة Postgres في قاعدة البيانات
- أعمدة `search_ar` في `lessons`, `qa_questions`, `fawaid`, `akp_stories`
- فهارس GIN/trgm على `search_ar`
- `intelligentSearch()` API
- `GlobalSearchModal` (Ctrl+K)
- `SearchPage` شاملة

### يحتاج إنشاء/تحسين 🔨
- `src/shared/arabic-normalize.ts` — وحدة موحدة أكثر شمولاً (تشمل علامات الوقف القرآنية وإزالة الكشيدة)
- اختبارات وحدة التطبيع (`arabic-normalize.test.ts`)
- أعمدة `search_text` في الجداول غير المغطاة: `sheikhs`, `library_items`, `scientific_miracles`, `verified_hadith_items`, `fiqh_council_items`
- `quran_search_index` (view/materialized view) — للبحث في نصوص القرآن المخزنة محلياً
- نقطة نهاية `GET /api/search` موحدة
- سكريبت `scripts/build-search-index.ts`
- سكريبت `scripts/verify-search.ts`

---

## 7. ملاحظات هامة

1. **القرآن:** لا يُخزَّن محلياً في قاعدة البيانات — يأتي من AlQuran Cloud API فقط. `quran_search_index` يجب أن يكون view على `search_index` أو يعتمد على البيانات المؤقتة.

2. **الاعتماد:** يستخدم المشروع `status = 'approved'/'published'` بدلاً من `is_approved = true`. الحقل `is_approved` موجود فقط في seed الـ Islamic Stories المحلي. القاعدة 4 (is_approved + verified_by) مطبقة عبر فلتر status.

3. **لا Drizzle ORM:** المشروع يستخدم Supabase JS client مباشرةً. Migrations تُكتب بـ SQL وتُطبَّق عبر سكريبتات `.mjs`.

4. **التطبيع الموجود مقابل المطلوب:** `normalizeArabic()` الحالية تطبّع أساسياً لكنها تفتقد: علامات الوقف القرآنية (`ۖ-ۭ`)، و Unicode ranges المطلوبة بدقة. الوحدة الجديدة ستكمل هذا.

5. **`search_synonyms.ts`:** يُوسّع الاستعلام بالمرادفات — يجب الإبقاء عليه وإمكانية استخدامه مع الوحدة الجديدة.
