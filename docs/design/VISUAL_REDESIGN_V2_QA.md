# Visual Redesign V2 — Visual QA

**Status:** complete · **Core train:** #2201 → #2208 · **Expansion:** #2209 → #2213 · **Final QA:** this  
**Constraint:** Visual only · no routes · no content · no mushaf text · no Admin v3

## Acceptance (all must pass)

| Gate | Result |
|---|---|
| Color contrast (Playwright) | required on UI PRs — hero ivory fix documented in `PR2202_CONTRAST_FAILURES.md` |
| Verify build | required |
| ci-required | required |
| visual-snapshot | required when path-lane says so |
| LHCI home | required when path-lane says so |
| Bundle / CSS budget | no raise — V2 page CSS deferred (lazy) |
| No gate disable / snapshot weaken / WCAG reduce | enforced |

## Opt-in map (core + expansion)

| Attr | Paths | CSS |
|---|---|---|
| `data-v2-app` | all public (excl. immersive mushaf · `/admin`) | `app-shell-v2.css` |
| `data-v2-dashboard` | `/` | `home-dashboard-v2.css` |
| `data-v2-quran-hub` | `/quran-hub` | `quran-hub-v2.css` |
| `data-v2-stories` | `/prophets*` · `/seerah*` | `stories-seerah-v2.css` |
| `data-v2-search` | `/search*` | `library-search-v2.css` |
| `data-v2-profile` | `/settings` · `/progress` | `profile-hub-v2.css` |
| `data-v2-nav` | global chrome | `profile-hub-v2.css` (bottom nav) |
| `data-v2-night` | when dark theme | `luxury-night-v2.css` |
| `data-v2-lessons` | `/lessons*` | `lessons-sections-v2.css` |
| `data-v2-sections` | `/sections*` | `lessons-sections-v2.css` |
| `data-v2-knowledge` | `/fiqh*` · `/hadith*` · `/tawhid*` · `/aqidah` · … | `knowledge-dashboards-v2.css` |
| `data-v2-worship` | `/adhkar*` · `/prayer-times` · `/prayer-ranks` · `/salah-guide` | `worship-history-v2.css` |
| `data-v2-glossary` | `/islamic-glossary` | `worship-history-v2.css` |
| `data-v2-history` | `/tarikh-islami*` | `worship-history-v2.css` |
| `data-v2-learn` | `/quiz*` | `learn-legal-v2.css` |
| `data-v2-legal` | `/about` · `/privacy*` · `/terms` · `/support` · `/contact` | `learn-legal-v2.css` |
| `data-v2-offline` | `/offline` | `learn-legal-v2.css` |

## Screen checklist

### Core (#2201–#2208)

| Screen | Light ivory | Dark night | Notes |
|---|---|---|---|
| Home Dashboard | ✅ | ✅ | LCP h1 «سُنّة» preserved |
| Quran Hub | ✅ | ✅ | mushaf text untouched |
| Prophets / Seerah | ✅ | ✅ | timeline emerald/gold |
| Search | ✅ | ✅ | `/library` → `/search` |
| Settings / Progress | ✅ | ✅ | profile hub |
| Bottom nav | ✅ | ✅ | 5 tabs unchanged |

### Expansion (#2209–#2213)

| Screen | Light ivory | Dark night | Notes |
|---|---|---|---|
| App shell (default) | ✅ | ✅ | soft-card → V2 bridge |
| Lessons / Sections | ✅ | ✅ | EmptyStateV2 · PageHeaderV2 |
| Fiqh / Hadith / Tawhid | ✅ | ✅ | Knowledge Dashboard · hero → Page Header V2 |
| Adhkar / Prayer / Salah guide | ✅ | ✅ | Guided Experience |
| Glossary / Tarikh | ✅ | ✅ | Timeline history |
| Quiz / Daily challenge | ✅ | ✅ | Game-like · logic untouched |
| About / Privacy / Terms / Support / Contact | ✅ | ✅ | LegalPageLayout V2 |
| Offline center | ✅ | ✅ | PageHeaderV2 · EmptyStateV2 |
| ErrorBoundary / Offline banner | ✅ | ✅ | via `data-v2-app` |

## Remaining legacy (intentional / out of scope)

| Surface | Why |
|---|---|
| Mushaf immersive (`/mushaf`) | out of scope — text/layout frozen |
| Admin v3 (`/admin*`) | out of scope |
| Deep topic subpages without dedicated opt-in | inherit `data-v2-app` shell bridge; follow-up polish if visual gaps remain |
| Mushaf bookmarks / native-only chrome | not part of public V2 expansion |

## A11y / contrast notes

- Body / small text: AA minimum (light + night muted `#b3c9bd`)
- Headings: prefer AAA; night titles use `--v2-color-night-emerald-text`
- Gold: decoration / focus rings — not primary body text
- Solid `background-color` on heroes for contrast gate

## Tokens (SoT)

| Token | Light | Night |
|---|---|---|
| Ivory page | `#F9F8F4` | → night-bg `#0A1612` |
| Ivory surface | `#FFFCF8` | → night-surface `#12261F` |
| Emerald | `--sunnah-emerald` | unchanged (CTA / active) |
| Gold | `#C9A82E` | `#C4A84A` |
| Ink / muted | ink / `#5E6E67` | `#EDF5F0` / `#B3C9BD` |

Literal splash SoT remains `#F7F3EB` in `theme.css`.

## Non-goals (verified untouched)

- Routes / product features redesign beyond V2 opt-in
- Mushaf ayah text / tashkeel / page engineering
- Admin v3 · DB · SEO contracts · search indexing
- Gate thresholds / snapshot baselines weakened
- New UI libraries / fonts / token palette beyond V2

## Local verify (agent)

```bash
pnpm --filter @workspace/majalis run test:visual-redesign-v2-tokens
pnpm run verify:preflight
pnpm run verify:ci
```
