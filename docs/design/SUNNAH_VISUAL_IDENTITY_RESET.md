# SUNNAH VISUAL IDENTITY RESET

**Started:** 2026-09-22  
**Brand:** سُنّة  
**Constraint:** Visual only · no routes · no content · no mushaf text · no Admin v3 · no new Design System

## Problem

V2/V3 حسّنتا التناسق، لكن الواجهة ما زالت تشبه ويب مكبرًا: كثافة ضعيفة، بطاقات ضخمة، تكرار بحث/حديث، خط زخرفي في Chrome، Focus أزرق، عناصر عائمة.

## Source of truth (shared — no 4th DS)

| Layer | File |
|---|---|
| Literal colors | `app/styles/theme.css` |
| V2 + Identity Reset tokens | `styles/visual-redesign-v2-tokens.css` |
| Identity Reset application (PR-1+) | `styles/sunnah-identity-reset.css` |
| TS aliases | `lib/ssunnah-theme.ts` (`V2_TYPE` / `V2_FONT` / `V2_DENSITY` / `V2_SURFACE`) |
| Header chrome paths | `lib/ticker-quiet-paths.ts` + `NavBar.tsx` |

## PR train

| PR | Focus | Status |
|---|---|---|
| 1 | Typography + density + surface tokens | **merged** |
| 2 | Global header + search + daily strip | **merged** |
| 3 | Cards and content rows | **merged** |
| 4 | Home and Quran Hub | **merged** |
| 5 | Sections and category grids | **merged** |
| 6 | Detail and reading pages | **merged** |
| 7 | Drawer + Bottom Navigation + floating | **merged** |
| 8 | Forms + Tabs + Filters | **in progress** |
| 9 | Dark Mode Luxury Night | queued |
| 10 | Responsive + Accessibility + Visual QA | queued |

Rule: start each PR from latest `main`. Do not start next until previous is merged.

## PR-1 deliverables

- `--v2-font-display` / `--v2-font-ui` / `--v2-font-latin`
- Type scale: display · page · section · card · body · supporting · metadata · caption
- Density: `compact` | `standard` | `comfortable` via `html[data-density]`
- Surfaces: canvas / raised / muted / functional / gold accent (~70/20/8/2)
- Softer shadows · identity focus ring
- Remove Aref Ruqaa from drawer chrome button
- Default `data-density="standard"` with `data-v2-app`

## PR-2 deliverables

- Compact mobile header actions (icon search · smaller toggles)
- Full header search row removed — home uses `HomeUniversalSearch`; internal pages use header search icon
- Header ticker (daily strip) on **home only** (`shouldShowHeaderTicker` / `data-home-chrome`)
- Chrome fallback without stacked search row
- `--search-height: 0` · ticker height reserved by default on compact viewports; zeroed when `html[data-home-chrome="0"]` (set by App; not on static `<html>` — keeps LHCI readiness marker within 800 bytes)

## PR-3 deliverables

- `CompactNavigationCard` · `ContentRow` · `DetailSection` · `QuoteSurface` · `StatusNotice`
- `FeatureCard` densified via identity CSS (existing component)
- `sunnah-identity-cards.css` · exports from design-system
- Hub/section soft cards: `min-height: 0` · 2-line clamp under `data-v2-app`

## PR-4 deliverables

- Home Hero A: one valuable continue (`hw3-chip--lead`) · compact meta · primary CTA
- Quran Hub: smaller title · compact `quran-open-mushaf` · denser feature grid
- `sunnah-identity-home-hub.css` (no mushaf reader changes)

## PR-5 deliverables

- Sections lobby densify under `data-v2-app` + `data-v2-sections` (override Expansion B `min-height: 6.5rem`)
- Tighter `hub-card-grid` / `section-lobby__grid` gaps · 2-line clamps · smaller icons
- Category grids: fiqh · QA · rulings · hadith · discover (`sunnah-identity-sections.css`)
- Loaded with `SectionLobby` + hub pages (not `main.tsx` — يحافظ على ميزانية CSS الحرج)

## PR-6 deliverables

- TopicPage hero/tabs/body densify under `data-v2-app`
- Reading rhythm: `--lh-reading: 1.75` · tighter `--read-para-gap` / card pads / measure `36rem`
- Lesson detail · hadith-by-id · article detail surfaces (`sunnah-identity-detail-reading.css`)
- Loaded with TopicPage + LessonDetailView + HadithByIdView + DiscoverIslamArticleDetailPage (not `main.tsx`)

## PR-7 deliverables

- Bottom Nav: softer shadow · no active icon lift/gold ring · `letter-spacing: 0` · identity focus
- Side drawer: denser rows/icons · UI font on titles · quieter panel shadow
- Floating back bar + assistant FAB: compact size · `--v2-shadow-soft`
- `sunnah-identity-chrome-nav.css` loaded with BottomNavBar + SideNavDrawer + FloatingBack + Assistant FAB (not `main.tsx`)

## PR-8 deliverables

- Filter chips / segmented: denser height · UI type · identity active + focus ring
- Filter bar search field densify under `data-v2-app`
- Tabs (`role=tab` / topic / tahara): compact · no decorative letter-spacing
- Login/auth form controls: control height · identity focus (`sunnah-identity-forms-filters.css`)
- Loaded with FilterChip + FilterBar + SegmentedFilter + LoginView (not `main.tsx`)

## Out of scope (all PRs)

Mushaf reader · Quran text · Admin v3 · DB · Routes · SEO · indexing · permissions · publishing
