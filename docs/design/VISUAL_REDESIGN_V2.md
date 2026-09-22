# Visual Redesign V2 — Premium Islamic Dashboard

**Started:** 2026-09-21  
**Brand:** سُنّة (experience inspired by reference — no logo/image copy)  
**Constraint:** Visual only · no routes · no content · no mushaf text · no Admin v3

## Philosophy

Calm · premium · modern Islamic · Dashboard + Cards · generous space · rounded premium icons · micro-motion only.

## Palette

| Token | Role | CSS |
|---|---|---|
| Deep Emerald | Primary / welcome cards / CTA | `--v2-color-emerald` → `--sunnah-emerald` |
| Warm Ivory | Page / dashboard | `--v2-color-ivory` = `#F9F8F4` (opt-in `data-v2-dashboard`) · splash SoT `#F7F3EB` |
| Quran Gold | Accent (mushaf-aligned) | `--v2-color-gold` = `#C9A82E` |
| Rich Ink | Body text | `--v2-color-ink` |
| Deep Emerald Night | Dark mode surfaces | `--v2-color-night-*` |

## Source of truth

| Layer | File |
|---|---|
| Literal colors | `app/styles/theme.css` |
| V2 semantic | `styles/visual-redesign-v2-tokens.css` |
| TS aliases | `lib/ssunnah-theme.ts` (`V2_COLOR` / `V2_RADIUS`) |
| Card primitive | `components/design-system/SunnahCardV2.tsx` |

## PR train

| PR | Focus | Status |
|---|---|---|
| 1 | Design Tokens + SunnahCard V2 | **merged** (#2201) |
| 2 | Dashboard Homepage | **merged** (#2202) |
| 3 | Quran Hub | **merged** (#2203) |
| 4 | Stories & Seerah | **merged** (#2204) |
| 5 | Library & Search | **merged** (#2205) |
| 6 | Profile Hub + bottom nav (5 tabs) | **merged** (#2206) |
| 7 | Dark Mode Luxury Night polish | **merged** (#2207) |
| 8 | Visual QA | **merged** (#2208) |

## Expansion train (V2 default for remaining app)

| PR | Focus | Status |
|---|---|---|
| A | App Shell V2 default + PageHeader/EmptyState | **merged** (#2209) |
| B | Lessons + Sections | **merged** (#2210) |
| C | Fiqh / Hadith / Aqidah knowledge dashboards | **this** |
| D | Prayer / Adhkar / Glossary / History | queued |
| E | Quiz / Challenges / Settings-Legal / Error states | queued |
| F | Final QA + OUTPUT | queued |

## Expansion PR-A — App Shell default

- `html[data-v2-app="1"]` على كل المسارات العامة (يُستثنى المصحف الغمري و`/admin`)
- جسر بصري: `soft-card` / `hub-card` / `mj-card` → مظهر SunnahCard V2
- `PageHeaderV2` · `EmptyStateV2`
- CSS مؤجّل: `styles/pages/app-shell-v2.css` (لا يدخل ميزانية CSS الحرج)
- لا إعادة تصميم الشاشات المكتملة في #2201–#2208

## Expansion PR-B — Lessons + Sections

- `html[data-v2-lessons="1"]` على `/lessons*`
- `html[data-v2-sections="1"]` على `/sections`
- دروس: فلاتر/بطاقات موحّدة · EmptyStateV2
- أقسام: PageHeaderV2 · بلاطات Rounded Premium
- CSS: `styles/pages/lessons-sections-v2.css`

## Expansion PR-C — Knowledge Dashboards (Fiqh / Hadith / Aqidah)

- `html[data-v2-knowledge="1"]` على `/fiqh*` · `/hadith*` · `/tawhid*` · `/aqidah` · `/fiqh-qawaid` · `/hadith-science`
- SectionHero → مظهر Page Header V2 (عاجي · حبر · بلا هيرو داكن)
- بطاقات فقه/حديث/توحيد → SunnahCard V2 look · Rounded Premium icons
- EmptyStateV2 في فراغ الفقه والحديث
- CSS: `styles/pages/knowledge-dashboards-v2.css` (مؤجّل من App + استيراد الصفحات)

## PR-2 Dashboard Homepage

- `html[data-v2-dashboard="1"]` على مسار `/`
- بطاقة ترحيب زمردية (هيرو LCP محفوظ: h1 «سُنّة»)
- `HomeQuickAccessV2` — أيقونات Rounded Premium
- بوابات → `SunnahCardV2`
- أسطح عاجية · بلا Card-in-Card في متابعة الرحلة
- CSS: `styles/pages/home-dashboard-v2.css`

## PR-3 Quran Hub

- `html[data-v2-quran-hub="1"]` على `/quran-hub`
- بطاقة استمرار قراءة زمردية كبيرة (بلا عمود جانبي)
- بطاقات اللوبي أكبر · عاجية · أيقونات Rounded Premium
- المصحف: ذهب أدوات القراءة موحّد مع `--v2-color-gold` فقط (لا نص)
- CSS: `styles/pages/quran-hub-v2.css`

## PR-4 Stories & Seerah

- `html[data-v2-stories="1"]` على `/prophets` و `/seerah`
- بطاقات أنبياء أكبر · عاجية · بلا سكة جانبية
- السيرة: Timeline حديث (نقاط زمرد/ذهب + لوحة مرحلة كبيرة)
- CSS: `styles/pages/stories-seerah-v2.css`

## PR-5 Library & Search

- `/library` → `/search` (عقد المنتج القائم)
- `html[data-v2-search="1"]` على `/search`
- Search First: شريط بحث بارز · تصنيفات مرتبة · بطاقات نتائج أنيقة
- CSS: `styles/pages/library-search-v2.css`

## PR-6 Profile Hub + Bottom Nav

- `html[data-v2-profile="1"]` على `/settings` و `/progress`
- بطاقة حساب عاجية · أفاتار Rounded Premium زمردي · صفوف إعدادات أنيقة
- مركز التقدّم: بطاقات متابعة + أزرار زمردية
- `html[data-v2-nav="1"]` — تلميع الشريط السفلي (5 تبويبات كما هي، بلا تغيير مسارات)
- CSS: `styles/pages/profile-hub-v2.css`

## PR-7 Dark Mode Luxury Night

- `html[data-v2-night="1"]` عند `data-theme=dark` / `.dark`
- Deep Emerald Night: أسطح/بطاقات/أيقونات/أوصاف AA · ذهب للزخرفة فقط
- `--v2-color-night-muted` أوضح · `--v2-color-night-emerald-text` للعناوين
- سد فجوة Quran Hub الليلية · مواءمة الشريط السفلي
- CSS: `styles/pages/luxury-night-v2.css` (مؤجّل: إقلاع داكن في `main` · تبديل السمة في `App`)

## PR-8 Visual QA

- قائمة قبول الشاشات + opt-in map + ملاحظات a11y/contrast
- إثبات اكتمال القطار (PR-1…PR-7) دون إعادة تصميم
- Doc: `docs/design/VISUAL_REDESIGN_V2_QA.md`

## Gate

`src/lib/__tests__/visual-redesign-v2-tokens-gate.test.ts`  
QA checklist: `docs/design/VISUAL_REDESIGN_V2_QA.md`
