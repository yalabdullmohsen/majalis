# SUNNAH VISUAL IDENTITY RESET — Visual QA

**Status:** complete (PR-10)  
**Constraint:** Visual only · no routes · no content · no mushaf text · no Admin v3 · no new Design System

## Acceptance (all must pass)

| Gate | Result |
|---|---|
| Color contrast (Playwright) | required on UI PRs |
| Verify build | required |
| ci-required | required |
| `test:sunnah-identity-reset-pr1` … `pr10` | required via `test:typography-readable` |
| Bundle / CSS budget | identity page CSS deferred (lazy) except PR-1 reset in `main` |
| No gate disable / snapshot weaken / WCAG reduce | enforced |

## PR train map

| PR | Focus | CSS / surface | Status |
|---|---|---|---|
| 1 | Typography + density + surfaces | `sunnah-identity-reset.css` + V2 tokens | **merged** |
| 2 | Header + search + daily strip | `top-chrome-layout.css` | **merged** |
| 3 | Cards / content rows | `sunnah-identity-cards.css` | **merged** |
| 4 | Home + Quran Hub | `sunnah-identity-home-hub.css` | **merged** |
| 5 | Sections + category grids | `sunnah-identity-sections.css` | **merged** |
| 6 | Detail + reading | `sunnah-identity-detail-reading.css` | **merged** |
| 7 | Drawer + Bottom Nav + floating | `sunnah-identity-chrome-nav.css` | **merged** |
| 8 | Forms + Tabs + Filters | `sunnah-identity-forms-filters.css` | **merged** |
| 9 | Dark Mode Luxury Night | `sunnah-identity-luxury-night.css` | **merged** |
| 10 | Responsive + A11y + Visual QA | `sunnah-identity-responsive-a11y.css` + this doc | **this** |

## Screen checklist (Identity densify)

| Surface | Light ivory | Dark night | Notes |
|---|---|---|---|
| Home / Hero A | ✅ | ✅ | PR-4 densify |
| Quran Hub | ✅ | ✅ | no mushaf reader |
| Sections / category grids | ✅ | ✅ | PR-5 |
| Topic / Lesson / Hadith / Article | ✅ | ✅ | PR-6 reading rhythm |
| Bottom nav + drawer + FAB | ✅ | ✅ | PR-7 |
| Filters / tabs / login | ✅ | ✅ | PR-8 |
| Luxury Night identity surfaces | — | ✅ | PR-9 under `data-v2-night` |
| Narrow ≤389 / tablet ≥768 / coarse pointer | ✅ | ✅ | PR-10 |

## Responsive matrix (PR-10)

| Viewport | Expectation |
|---|---|
| ≤389px | tighter grid gaps · safe-area inline padding · card title clamp |
| ≥768px | reading measure `max-inline-size: 40rem` · slightly larger grid gap |
| `pointer: coarse` | interactive identity targets ≥ `2.75rem` (44px) |
| Safe area | bottom nav padding · narrow inline safe-area |

## A11y notes (PR-10)

- Identity focus ring: `--v2-focus-ring` on cards / rows / FAB / scroll-top
- `prefers-reduced-motion: reduce` disables press scale + transitions on identity chrome
- Gold remains accent / focus — not body text
- Night muted/ink AA preserved from PR-9

## Out of scope (verified untouched)

| Surface | Why |
|---|---|
| Mushaf immersive (`/mushaf`) | frozen — text/layout out of Identity Reset |
| Admin v3 (`/admin*`) | out of scope |
| Routes / content / SEO / DB | out of scope |
| New Design System / fonts / libraries | forbidden |

## Local verify (agent)

```bash
pnpm --filter @workspace/majalis run test:sunnah-identity-reset-pr10
pnpm run verify:preflight
pnpm run verify:ci
```
