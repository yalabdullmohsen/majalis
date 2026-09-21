# Visual Redesign V2 — Visual QA (PR-8)

**Status:** complete · **Train:** #2201 → #2207 · **QA PR:** this  
**Constraint:** Visual only · no routes · no content · no mushaf text · no Admin v3

## Acceptance (all must pass)

| Gate | Result |
|---|---|
| Color contrast (Playwright) | required on UI PRs — hero ivory fix documented in `PR2202_CONTRAST_FAILURES.md` |
| Verify build | required |
| ci-required | required |
| visual-snapshot | required when path-lane says so |
| LHCI home | required when path-lane says so |
| No gate disable / snapshot weaken / WCAG reduce | enforced |

## Opt-in map

| Attr | Paths | CSS |
|---|---|---|
| `data-v2-dashboard` | `/` | `home-dashboard-v2.css` |
| `data-v2-quran-hub` | `/quran-hub` | `quran-hub-v2.css` |
| `data-v2-stories` | `/prophets*` · `/seerah*` | `stories-seerah-v2.css` |
| `data-v2-search` | `/search*` | `library-search-v2.css` |
| `data-v2-profile` | `/settings` · `/progress` | `profile-hub-v2.css` |
| `data-v2-nav` | global chrome | `profile-hub-v2.css` (bottom nav) |
| `data-v2-night` | when dark theme | `luxury-night-v2.css` |

## Screen checklist

| Screen | Light ivory | Dark night | Notes |
|---|---|---|---|
| Home Dashboard | ✅ emerald hero (solid bg) · quick access · SunnahCardV2 | ✅ night surfaces | LCP h1 «سُنّة» preserved |
| Quran Hub | ✅ continue-read card · lobby cards | ✅ night fill (PR-7) | mushaf text untouched; gold tools only |
| Prophets | ✅ larger ivory cards | ✅ night cards | no side rail |
| Seerah | ✅ timeline emerald/gold | ✅ night panels | |
| Search / Library | ✅ Search First bar · result cards | ✅ night | `/library` → `/search` (existing) |
| Settings Profile | ✅ account card · rows | ✅ night + emerald titles | |
| Progress | ✅ continue card · lists | ✅ night | |
| Bottom nav (5 tabs) | ✅ ivory surface · emerald active | ✅ night surface | tabs/routes unchanged |

## A11y / contrast notes

- Body / small text: AA minimum (light + night muted `#b3c9bd`)
- Headings: prefer AAA; night titles use `--v2-color-night-emerald-text` where emerald-deep would fail
- Gold: decoration / focus rings — not primary body text on ivory/night
- Welcome CTA on white: `--v2-color-emerald` (not remapped deep)

## Tokens (SoT)

| Token | Light | Night |
|---|---|---|
| Ivory page | `#F9F8F4` | → night-bg `#0A1612` |
| Ivory surface | `#FFFCF8` | → night-surface `#12261F` |
| Emerald | `--sunnah-emerald` | unchanged (CTA / active) |
| Gold | `#C9A82E` | `#C4A84A` |
| Ink / muted | ink / `#5E6E67` | `#EDF5F0` / `#B3C9BD` |

Literal splash SoT remains `#F7F3EB` in `theme.css` (not overridden by V2 ivory opt-in).

## Non-goals (verified untouched)

- Routes / product features / Dashboard structure redesign beyond V2 opt-in
- Mushaf ayah text / tashkeel
- Admin v3
- Gate thresholds / snapshot baselines weakened

## Local verify (agent)

```bash
pnpm --filter @workspace/majalis run test:visual-redesign-v2-tokens
pnpm run verify:preflight
pnpm run verify:ci
```
