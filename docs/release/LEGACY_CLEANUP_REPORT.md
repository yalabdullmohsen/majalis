# SUNNAH STABILIZATION PR-7 — Legacy Cleanup Report

**تاريخ:** 2026-09-21  
**فرع:** `cursor/sunnah-stabilization-pr7-legacy-cleanup-e755`  
**أساس:** بعد دمج PR-1…PR-6 على `main`  
**قاعدة:** لا حذف بالاسم وحده — كل بند ببرهان استيراد/توجيه/SEO.

## ملخص تنفيذي

| التصنيف | العدد (هذه الموجة) | قرار الموجة |
|---|---:|---|
| **SAFE_REMOVE** (نُفّذ) | 5 | حذف CSS ميت + صفحة يتيمة |
| **SAFE_REMOVE** (مؤجّل) | 4+ | HomepageAdBar cluster — follow-up |
| **NEEDS_PORT** | 6 طبقات | هجرة تدريجية لا حذف جملة |
| **KEEP** | أساس الهوية + Admin + redirects | لا مساس في PR-7 |

---

## 1) CSS من `main.tsx` — هل مطلوب وقت التشغيل؟

مصدر الحقيقة: `artifacts/majalis/src/main.tsx` + بوابات `*-gate.test.ts`.

| طبقة | تحميل | حكم | برهان |
|---|---|---|---|
| `brand-v4.css` | sync حرج | **KEEP** | مستورد مباشرة؛ `tokens.css` يشتق منه |
| `brand-v4-components.css` | بعد `design-system` | **KEEP** / لاحقًا **NEEDS_PORT** | `loadNonCriticalCss` + بوابات no-global-dangerous |
| `brand-v4-contrast-fixes.css` | مؤجّل | **KEEP** | مستورد من `main.tsx` |
| `m2030/foundation.css` + `navigation.css` | مؤجّل | **KEEP** | مستورد من `main.tsx` |
| `m2030/interactions.css` + `pages.css` | مؤجّل | **KEEP** | مستورد من `main.tsx` |
| `m2030/home.css` | مع الرئيسية | **KEEP** | `HomeView.tsx` + `HomeHeroLcp.tsx` + بوابات LCP |
| `final-release.css` | بعد design-system | **KEEP** | عشرات البوابات تقرأه (nav/chrome/dark) |
| `sunnah-visual-language.css` (SVL) | مؤجّل | **KEEP** | `sunnah-visual-language-gate` يلزم الاستيراد |
| `visual-refresh-v1.css` | مؤجّل | **KEEP** | بوابة visual-refresh + PR-5 |
| `*-legacy.css` تحت `styles/pages/` | كسول مع الصفحات | **KEEP** الآن / **NEEDS_PORT** | ما زالت مستوردة (انظر §3) |

**خطة مرحلية (لا تُنفَّذ في هذا الـPR):**

1. تثبيت `--sunnah-*` / `--ss-*` كمصدر وحيد (PR-3 ✅).  
2. نقل قواعد chrome/nav من `final-release` إلى طبقات دلالية مسمّاة.  
3. تفكيك `brand-v4*` و`m2030/*` قاعدةً-قاعدة مع بوابة تباين قبل كل حذف.  
4. إسقاط `*-legacy.css` بعد نقل الأصناف المستخدمة فقط.

---

## 2) مسارات مكررة / قديمة

مصادر: `AppRoutes.tsx` · `vercel.json` · `docs/legacy-routes-map.md` · `audit:legacy-routes` (آخر تقرير: صفر حرج).

| بند | حكم |
|---|---|
| تحويلات `/more` `/explore` `/library` `/fiqh-council` `/rulings` `/quran` … | **KEEP** — redirects حيّة؛ لا 404 صامت |
| Admin `/admin*` | **KEEP** — PR-8+؛ ممنوع الحذف |
| صفحة `AboutUsPage.tsx` | **SAFE_REMOVE** ✅ — يتيمة؛ المسار الحي `AboutPage` عبر `/about` + redirects |
| منتج `/fiqh-council` | **KEEP redirects** إلى `/fiqh`؛ CSS الصفحة ميت → SAFE_REMOVE |

لا فجوات redirect حرجة وُجدت في هذه الجولة؛ أي رابط SEO قديم يبقى عبر `vercel.json` / SPA Redirect.

---

## 3) `styles/pages/*-legacy.css`

| ملف | مستورد من | حكم |
|---|---|---|
| `home-legacy.css` | `HomeBelowFold.tsx` (+ بوابة pagespeed: تحت الطية فقط) | **KEEP** / **NEEDS_PORT** |
| `lessons-legacy.css` | `LessonsView.tsx` (+ contrast gate) | **KEEP** / **NEEDS_PORT** |
| `search-legacy.css` | `SearchView.tsx` | **KEEP** / **NEEDS_PORT** |
| `misc-page-legacy.css` | `TopicQuiz` · `TasbihView` · `OptimizedSheikhImage` | **KEEP** / **NEEDS_PORT** |

ليست SAFE_REMOVE: الاستيراد حي. الهجرة = نقل أصناف مستخدمة ثم حذف الملف.

---

## 4) أعلام ميزات (Feature flags)

| مجموعة | افتراضي | حكم |
|---|---|---|
| `lessons-guide/flags.ts` | كلها OFF | **KEEP** — عقود PR لاحق؛ ليست legacy ميتة |
| `quran-journey/flags.ts` | كلها OFF | **KEEP** |
| `quran-data/flags.ts` | معاني/تجويد OFF | **KEEP** — حوكمة مصدر |
| `mushaf-v2/flags.ts` | طبقات v2 ON | **KEEP** |
| `knowledge-platform/flags.ts` | P0 ON / P1+ OFF | **KEEP** |

لا حذف أعلام في PR-7.

---

## 5) SAFE_REMOVE — مرتّب بالبرهان

### نُفّذ في هذا الـPR

| # | هدف | برهان |
|---|---|---|
| 1 | `styles/components/adhan-active-overlay.css` | `rg` لا استيراد؛ أصناف `.aao-*` = 0 في TS/TSX |
| 2 | `styles/pages/fiqh-admin.css` | لا استيراد؛ أصناف `.fiqh-admin-*` = 0 (ما عدا ذكر جرد Admin — حُدّث) |
| 3 | `styles/pages/fiqh-council.css` | لا استيراد؛ منتج المجلس ملغى + redirect؛ أصناف الصفحة غير مستخدمة في TS |
| 4 | `styles/pages/library.css` | لا استيراد؛ `/library` → `/search`؛ أصناف `.lib-card*` = 0 |
| 5 | `views/AboutUsPage.tsx` | صفر مستوردين؛ المسار `/about` → `AboutPage` فقط |

### مؤجّل (SAFE_REMOVE مثبت — خارج سقف ≤10 ملفات)

| هدف | برهان | ملاحظة |
|---|---|---|
| `components/home/HomepageAdBar.tsx` | غير مستورد؛ بوابات تمنع ظهوره في App | احذف مع CSS/config معًا |
| `styles/components/homepage-ad-bar.css` | يُحمَّل فقط من HomepageAdBar | |
| `config/homepage-ad.ts` | `@deprecated`؛ مستهلكه الوحيد HomepageAdBar | البديل: `header-ad.ts` |
| `lib/homepage-ad-dismiss.ts` + اختباره | مستهلكه الوحيد الشريط الميت | بعد حذف الشريط |

### ليس SAFE_REMOVE رغم الاسم

- أي ملف تحت `views/admin/**` أو مسارات `/admin` → **KEEP** حتى PR-10.  
- `brand-v4*` / `m2030*` / `final-release` / SVL → **KEEP** (مؤسَّسة وقت التشغيل).

---

## 6) NEEDS_PORT

| أصل | ماذا يُنقل | شرط الحذف لاحقًا |
|---|---|---|
| `final-release.css` (~73KB) | nav / safe-area / ticker / chrome | بوابة تباين + لا كسر bottom-nav |
| `brand-v4.css` + components/contrast | أزواج لون متبقية غير مغطاة بـ`--sunnah-*` | بعد صفر مراجع hex/الطبقات |
| `m2030/*` | أدوات رئيسية (`.hpv4-*` / hero) | بعد هجرة Home إلى SVL/DS فقط |
| `*-legacy.css` | أصناف ما زالت في JSX | بعد `rg` صفر للملف |
| قواعد `.fiqh-council-page` داخل `section-cards-theme.css` | كنس محددات ميتة | follow-up صغير |
| محتوى مفيد من مسودات مغلقة (#1977…) | يدوي انتقائي | PR-11 فقط إن لزم |

---

## 7) KEEP

- Admin legacy كامل + `docs/admin/LEGACY_ADMIN_INVENTORY.md` مسار الترحيل.  
- كل redirects في `vercel.json` / `AppRoutes` / `IA_REDIRECTS`.  
- طبقات الهوية الحالية في `main.tsx` (انظر §1).  
- أعلام OFF للعقود المستقبلية.  
- `quiz-bank/legacy-adapter` و`legacy-surah-redirect` و`prayer-notifications/legacy-cleanup` — أدوات ترحيل حيّة.

---

## 8) رقعة PR-7 الدنيا (≤10 ملفات) — هذه الموجة

1. حذف 4 CSS ميتة أعلاه.  
2. حذف `AboutUsPage.tsx`.  
3. هذا التقرير.  
4. تحديث `docs/REPO_INDEX.md` (قسم CSS).  
5. تحديث `docs/release/SUNNAH_STABILIZATION_REPORT.md`.  
6. تحديث سطر `fiqh-admin.css` في جرد Admin.  
7. توسيع `legacy-sections-ui-gate.test.ts` لمنع رجوع الملفات المحذوفة.

**خارج النطاق عمدًا:** حذف brand-v4/m2030/SVL/final-release · حذف Admin · تفعيل أعلام · تغيير عتبات CI.

---

## 9) تحقق

- مركّز: `legacy-sections-ui-gate` + `audit:legacy-routes` عند الحاجة.  
- إلزامي قبل الدفع: `pnpm run verify:preflight` ثم `pnpm run verify:ci`.
