# قصص الأنبياء — PR-0 Baseline + جرد (بلا إصلاح منتج)

**تاريخ:** 2026-09-25  
**أساس:** `origin/main` @ `512db452f8fd662967a67aef1fbb60914dc8fa45`  
**نطاق هذا الـPR:** جرد Routes والمكونات والألوان + خط أساس — **بلا** إعادة تصميم ولا تغيير نص شرعي.

> لا تعلن `PROPHETS_STORIES_REBUILD_COMPLETE` من هذا الـPR.  
> Screenshots الجهاز: **NOT CAPTURED** في هذا الـPR (لا بيئة TestFlight/جهاز في مسار الجرد؛ مؤجّل لـPR-8). أدلة الكود أدناه مثبتة من المستودع.

---

## 1) الحالة

| حقل | قيمة |
|---|---|
| Program | PROPHETS_STORIES_REBUILD |
| Stage | PR-0 |
| Status | PARTIAL (جرد فقط) |
| Product UI changed | لا |
| Accepted claim | ممنوع حتى PR-8 + TestFlight |

---

## 2) Routes المفحوصة

| Path | Component | ملاحظات |
|---|---|---|
| `/prophets` | `ProphetStoriesPage` (lazy) | قائمة + تبويبات عرض |
| `/prophets/:slug` | نفس المكوّن | تفاصيل/قراءة النبي |
| `/prophets/tree` | `ProphetsFamilyTreePage` | خارج نطاق إعادة بناء القراءة (متابعة منفصلة) |
| `/prophet-stories` · `/prophets-stories` | Redirect → `/prophets` | توافق قديم |
| `/prophet-stories/:slug` · `/prophets-stories/:slug` | `ProphetStoriesPage` | توافق قديم |
| `/anbiya` | Redirect → `/prophets` | |
| Aliases | `ishaq`→`is-haq`, `alyasa`→`al-yasa`, `zakaria`→`zakariyya` | في `AppRoutes.tsx` |

**عدد الأنبياء المفهرسين:** 25 (عقد `prophets-final-routes`).

**Slugs:**  
`adam`, `idris`, `nuh`, `hud`, `salih`, `ibrahim`, `lut`, `ismail`, `is-haq`, `yaqub`, `yusuf`, `ayyub`, `shuayb`, `musa`, `harun`, `dhul-kifl`, `dawud`, `sulayman`, `ilyas`, `al-yasa`, `yunus`, `zakariyya`, `yahya`, `isa`, `muhammad`.

---

## 3) المكونات والملفات

| دور | مسار |
|---|---|
| الصفحة الواحدة (قائمة + تفصيل) | `artifacts/majalis/src/views/ProphetStoriesPage.tsx` (~1400 سطر) |
| CSS القسم | `artifacts/majalis/src/styles/pages/prophet-stories.css` (~3150 سطر) |
| بيانات قائمة الأنبياء | `artifacts/majalis/src/lib/prophets-data.ts` |
| نسب/شجرة | `artifacts/majalis/src/lib/prophets-lineage.ts` |
| مواضع مصحف | `artifacts/majalis/src/components/prophets/ProphetMushafMentions.tsx` + `prophet-mushaf-mentions.ts` |
| معرفة موسّعة JSON | `artifacts/majalis/public/data/knowledge/prophets/*.json` (25 ملفًا) |
| قصة DB (اختياري) | Supabase `prophet_stories` (`content`, `citations`, `is_approved`) |
| سرد صوتي | `speech-read-aloud` / `ai-narration` من داخل الصفحة |
| شجرة العائلة | `ProphetsFamilyTreePage.tsx` |
| إدارة (خارج المنتج العام) | `views/admin/ProphetStoriesSection.tsx` + `prophet-stories-admin.css` |
| كروم التطبيق | `App.tsx` + `immersive-chrome.ts` + `FloatingBackButton` + `BottomNavBar` + `ScrollToTop` |

**ملاحظة معمارية:** الاستكشاف والقراءة داخل **نفس** `ProphetStoriesPage` — لا فصل Overview / Reader بعد.

---

## 4) تبويبات ومقاطع المحتوى

### قائمة (`/prophets`)

`القائمة` · `الخط الزمني` · `أولو العزم` · `المعجزات` · `مقارنة` · `اختبر نفسك`

### تفصيل نبي (`/prophets/:slug`)

`نبذة` · `مواضع في القرآن` (شرطي) · `المعجزة` (شرطي) · `السور` · `الصفات` · `العبر` · `عرض موسّع` (معرفة) · `القصة` (DB) · `الاستشهادات` (DB)

---

## 5) Theme / Chrome الحالي

| سلوك | الدليل | أثر المشكلة |
|---|---|---|
| ليس Immersive | `isImmersiveChromePath` يستثني المصحف فقط | Header عام يبقى |
| Pinned chrome | `isPinnedChromePath("/prophets…") === true` | BottomNav **forceShow** — لا يُخفى أثناء القراءة |
| Compact header | `isCompactHeaderPath` يشمل الأنبياء | بلا ticker متحرك؛ الكروم ما زال ظاهرًا |
| `data-v2-stories=1` | `App.tsx` على مسارات الأنبياء/سيرة/أمم… | طبقة V2 stories |
| توكنات محلية `--ps-*` | أعلى `prophet-stories.css` | جزئيًا أخضر؛ ليلي يعتمد كحليًا |

**لا Reading Mode مركّز:** لا إخفاء Header/BottomNav أثناء القصة.

---

## 6) الألوان الزرقاء/الكحلية المؤكدة (إزالة لاحقة — PR-1+)

| قيمة / نمط | أين | ملاحظة |
|---|---|---|
| `#0b1a2e` / `#0B1A2E` | `prophet-stories.css` (≥16 موضعًا) | كحلي ليلي صلب على hero/detail/tabs |
| `--sunnah-night-bg, #0b1a2e` | fallback في نفس الملف | إن تغيّر التوكن الجذري يبقى الكحلي fallback |
| نص `#ffffff` / `#F3F5F4` على أسطح مختلطة | تفصيل lux | خطر بطاقة فاتحة + نص فاتح (بلاغ المستخدم) |
| تدرجات `color-mix(…, #0B1A2E)` | hero backgrounds | طبقات ليلية شبه موحّدة |

**لا Design System جديدة في المراحل اللاحقة** — المطلوب Semantic Tokens `--prophets-*` مربوطة بهوية سُنّة الخضراء الموجودة (`--mj-brand*`).

---

## 7) مشكلات نصية / تخطيط مؤكدة من الكود (+ صور المستخدم)

| مشكلة | دليل كود / سلوك |
|---|---|
| بطاقة تعريف ضخمة + نجوم | `.prophet-detail-lux__hero-star`, `.prophet-lux-card__star`, `IslamicStar` |
| بطاقات قائمة `min-height: 12.5rem` | بوابة `prophets-cards-readability` تثبّت هذا العقد حاليًا |
| تبويبات أفقية مزدحمة | `.prophets-lux-tabs` / `.prophets-lux-tab` |
| محتوى خلف BottomNav | CSS يحجز `padding-bottom: calc(var(--bottom-nav-height)…)` — الدليل أن الشريط يبقى في المسار |
| تداخل زخرفة/عنوان | عناوين `prophet-section-lux__title` + نجوم قسم |
| Shell واحد للقائمة والقراءة | فرع `routeSlug` داخل نفس الصفحة |
| Floating عام | `FloatingBackButton` + `ScrollToTop` من `App` (ليست مدمجة في الصفحة) |
| استماع داخل الصفحة | `.prophet-speech-btn` — منفصل عن Toolbar قراءة موحّد |

---

## 8) مصادر البيانات (بلا تعديل نص)

| مصدر | استخدام |
|---|---|
| `PROPHETS` في `prophets-data.ts` | قائمة، نبذة، سور، صفات، عبر |
| Supplements داخل الصفحة | معجزات/ذكر/كتاب |
| `public/data/knowledge/prophets/:slug.json` | عرض موسّع |
| Supabase `prophet_stories` | قصة طويلة + citations عند الاعتماد |
| `ProphetMushafMentions` | مواضع مصحف |

**قيد شرعي PR-0 وما بعده:** ممنوع تغيير نص القصة/الآيات/التخريج؛ أي ادعاء بلا مصدر → `NEEDS_SOURCE`.

---

## 9) اختبارات قائمة (لا تُضعف)

| بوابة | دور |
|---|---|
| `prophets-final-routes` | 25 slug + redirects + معرفة |
| `prophets-content-quality` | جودة محتوى |
| `prophets-cards-readability-gate` | عقد بطاقات (سيحتاج تحديثًا عند الضغط في PR-2) |
| `prophet-stories-on-dark-text` | نص على الداكن (سيحتاج إعادة عقد عند إزالة الكحلي) |
| `prophets-stories-mobile-layout-gate` | pinned chrome + استماع + محاذاة |
| `tests/14-prophets.spec.ts` | Playwright smoke |
| هذا الملف + `prophets-stories-rebuild-pr0-gate` | جرد PR-0 |

---

## 10) خطة PRs التالية (لا تنفَّذ هنا)

| PR | هدف |
|---|---|
| PR-1 | Semantic Tokens `--prophets-*` خضراء؛ إزالة `#0B1A2E` |
| PR-2 | قائمة + بطاقة تعريف + Topic cards |
| PR-3 | Story Reader مركّز + إخفاء Header/BottomNav |
| PR-4 | Typography + عناوين + فقرات + مصادر |
| PR-5 | Tabs + تنقل + حفظ موضع |
| PR-6 | Audio + إعدادات خط |
| PR-7 | Light/Dark/iPad/a11y |
| PR-8 | فحص 25 قصة + visual + TestFlight |

كل PR من أحدث `origin/main` بعد دمج السابقة.

---

## 11) Screenshots

| Viewport / Mode | حالة |
|---|---|
| iPhone صغير / Pro Max / iPad / Split / Web / Light / Dark / Large Text | **NOT CAPTURED** — لا جهاز/TestFlight في PR-0 الجرد |

المطلوب في PR-8: لقطات قبل/بعد لكل وضع.

---

## 12) معايير قبول هذا الـPR فقط

- [x] جرد Routes والمكونات  
- [x] توثيق الألوان الكحلية  
- [x] توثيق بقاء Header/BottomNav  
- [x] بوابة PR-0 تفشل إن حُذف الجرد  
- [ ] لا تغيير منتج  
- [ ] لا إعلان اكتمال البرنامج  
