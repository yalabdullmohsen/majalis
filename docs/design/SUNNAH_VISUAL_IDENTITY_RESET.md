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
| 2 | Global header + search + daily strip | **in progress** |
| 3 | Cards and content rows | queued |
| 4 | Home and Quran Hub | queued |
| 5 | Sections and category grids | queued |
| 6 | Detail and reading pages | queued |
| 7 | Drawer + Bottom Navigation + floating | queued |
| 8 | Forms + Tabs + Filters | queued |
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
- `--search-height: 0` · ticker height reserved only when `html[data-home-chrome="1"]`

## Out of scope (all PRs)

Mushaf reader · Quran text · Admin v3 · DB · Routes · SEO · indexing · permissions · publishing
