# SUNNAH RELEASE UI BASELINE — PR-0

**Status:** `PARTIAL` (inventory + confirmed-defect deep audit complete; full visual matrix for all public pages **not** claimed)  
**Generated:** 2026-09-23  
**Base:** `origin/main` @ `158d2f21ecf006bddedf0f069379ae6572938f4f`  
**Branch:** `cursor/sunnah-release-ui-baseline`  
**Authority:** Code + production HTTP 200 screenshots — **not** prior COMPLETE reports.

> **Gate:** Do not start PR-1…PR-11 UI patches until this baseline is merged.  
> **Explicit non-claim:** `SUNNAH_RELEASE_UI_READY` is **not** declared.

---

## 1) Executive counts

| Metric | Value | Source |
|---|---:|---|
| AppRoutes entries | 377 | `src/AppRoutes.tsx` |
| Public routes | 340 | inventory JSON |
| Public **pages** (components) | 224 | inventory JSON |
| Public **redirects** | 116 | inventory JSON |
| Admin routes | 37 | inventory JSON |
| Release-focus tagged | 28 | inventory JSON |
| Baseline screenshots (prod) | 49 captured / 11 committed samples | `docs/release/baseline-screenshots/` + `/tmp/sunnah-release-baseline/` |
| Native `<select>` hits | 161 | source scan |
| `!important` hits | 4277 | CSS/TSX scan (mostly legacy layers) |
| `UtilityScreen` usages | 371 | scan |
| `LazySectionAccordionPage` sibling pages | ≥11 | shared broken details pattern |

Artifacts:

- `docs/release/sunnah-release-ui-route-inventory.json`
- `docs/release/sunnah-release-filter-inventory.json`
- `docs/release/baseline-screenshots/manifest.json`
- Prior (stale-aware): `docs/release/LEGACY_CLEANUP_REPORT.md`, `CURRENT_RELEASE_TRUTH.md`

---

## 2) Route inventory schema

Every public route in the JSON carries:

`route · kind(page|redirect) · component · redirectTo · module · public · releaseFocus?`

**Full field audit (loading / empty / error / offline / dark / a11y / tests / visual system) is marked `PENDING_PER_ROUTE` for the 224 pages.**  
PR-0 completes a **deep template** for confirmed problem routes (below) and a machine list for the rest. Per-route completion of all columns is **PR-9…PR-11** work — claiming it now would falsify readiness.

### Production reachability (smoke)

| Route | HTTP | Notes |
|---|---|---|
| `/` | 200 | home |
| `/quran-hub/numbers` | 200 | القرآن في أرقام |
| `/discover-islam/contact` | 200 | تواصل سري |
| `/arabic-language` | 200 | نحو/صرف/بلاغة |
| `/islamic-directory` | 200 | hub مساجد/جامعات |
| `/islamic-landmarks` | 200 | مساجد ومشاهد |
| `/mushaf` | 200 | مصحف |
| `/contact` | 200 | تواصل عام |
| `/fiqh` | 200 | فقه |
| `/search` | 200 | بحث |

---

## 3) Confirmed defects (from owner screenshots ↔ code)

### 3.1 القرآن في أرقام — `/quran-hub/numbers`

| Field | Finding |
|---|---|
| Component | `QuranNumbersPage` → `ui/QuranNumbersView.tsx` |
| Layout | `UtilityScreen` + custom `quran-hub-page__head` + `quran-numbers.css` — **not** unified AppPage contract |
| Filters | **Two competing tab rows:** `theme` (`QURAN_STAT_THEMES`) + `group` (`bunya/alfaz/mawdoo/suwar/ajaib`) + search |
| Search | Client-side tolerant match — works |
| URL sync | **None** for filters |
| Empty | Possible empty grid when theme∩group∩query empty — UX state weak |
| Details | `AppBottomSheet` for stat detail |
| Visual system | Mixed hub CSS + section-cards |
| Classification | **PORT** filters into single FilterSheet; **CONSOLIDATE** header into PageHeader |

### 3.2 تواصل سري مع داعية — `/discover-islam/contact`

| Field | Finding |
|---|---|
| Component | `DiscoverIslamContactPage.tsx` |
| Form | Native `<select className="adm-input">` ×3 + raw checkbox — **BROKEN_UX** vs Sunnah tokens |
| Privacy | Consent gate before submit — good; anonymous mode — good |
| Validation | Minimal (`required` + early return) — no modern error summary |
| iPad | Form in muted block — phone-like stretch risk |
| Classification | **PORT** → FormField/SelectField/CheckboxField/PrimaryButton (PR-3) |

Note: `/contact` is a different page (`ContactPage` mailto hub). Screenshot complaint maps to **DiscoverIslamContactPage**.

### 3.3 النحو والأبواب المشابهة — shared `LazySectionAccordionPage`

| Field | Finding |
|---|---|
| Shared component | `LazySectionAccordionPage` → `SectionAccordionLayout` → **`AppBottomSheet`** for topics |
| Confirmed routes | `/arabic-language`, `/durus-imaniyya`, `/durus-mutanawwia`, `/tazkiya-topics`, `/iman-topics`, `/fikr-waqia`, `/usra-mujtama`, `/mawsuaat`, `/maqasid-sharia`, `/dalail-nubuwwah`, `/sunnah-studies` (+ related) |
| Defect | Sheet/modal feels like a tiny page; large empty regions; close control dominates; content sits under bottom nav risk |
| Classification | **CONSOLIDATE** → ReadingPage full route / true full-screen sheet (PR-4) — **do not patch each page** |

### 3.4 المساجد والمشاهد

| Route | Reality |
|---|---|
| `/masajid`, `/mosques` | **Redirect** → `/islamic-directory` |
| `/islamic-directory` | Hub cards → universities / institutions / **islamic-landmarks** |
| `/islamic-landmarks` | Real list+map+`FilterBottomSheet`; data in `islamic-landmarks-data.ts` |
| Content risk | Types include `مشهد تاريخي` / `مقام`; virtues mixed with history in free text — **needs source rigor** (PR-5) |
| Classification | **KEEP** hub; **PORT** landmarks UI + **content audit** (no invented coordinates/virtues) |

### 3.5 المصحف — `/mushaf`

| Field | Finding |
|---|---|
| Component | `MushafReaderPage` → `NewMushafReader` |
| Chrome toggle | `onTapEmpty` ↔ `readerChromeVisible` — **exists in code** |
| Onboarding hint | **MISSING** — no first-run «اضغط وسط الصفحة…» |
| Gesture risk | Pager swipe + ayah hit + empty tap — needs contract tests (PR-7) |
| iPad width | On **this main tip** still `width: min(100%, 430px)` in `mushaf-madinah.css` — phone column |
| Open fix | PR [#2240](https://github.com/yalabdullmohsen/majalis/pull/2240) (not merged at baseline time) |
| Geometry | Signature bands; font max 24; page mapping unchanged — **must remain** |
| Classification | **KEEP** geometry; **ADD** discovery/onboarding; **FIX** iPad width via #2240 or PR-8 |

### 3.6 Floating / chrome

| Element | Finding |
|---|---|
| `ScrollToTop` | Mounted in `App.tsx` — floating; must enter FloatingLayerManager audit (PR-6) |
| Bottom nav | Global; immersive paths hide via `isImmersiveChromePath` |
| Mini player | Lazy; overlays mushaf carefully |
| Classification | **CONSOLIDATE** floating layers |

---

## 4) Legacy system classification (PR-0 refresh)

| System | Class | Action |
|---|---|---|
| `brand-v4*.css` | **KEEP** (runtime) / later **PORT** | No blanket delete |
| `m2030/*` | **KEEP** / **PORT** | Gradual |
| `final-release.css` | **KEEP** / **PORT** | Gradual |
| `*-legacy.css` pages | **KEEP** / **NEEDS_PORT** | Still imported |
| `UtilityScreen` (371) | **CONSOLIDATE** → AppPage | PR-1 |
| `LegalPageLayout` | **KEEP** for legal | Optional later unify |
| `LazySectionAccordionPage` + sheet details | **CONSOLIDATE** → ReadingPage | PR-4 |
| Native `<select>` (161) | **PORT** → SelectField | PR-3 |
| Direct hex / `!important` mass | **PORT** carefully | Never gate-weaken |
| Mushaf 430px shell | **FIX** | #2240 / PR-8 |
| Duplicate filter chip rows (numbers) | **CONSOLIDATE** | PR-2/PR-5 |
| Admin `adm-input` on public dawah form | **PORT** | PR-3 |
| Dead CSS from LEGACY_CLEANUP SAFE_REMOVE list | **SAFE_REMOVE** deferred items | PR-11 only with import proof |
| Quran text / mapping / line count | **BLOCKED** from cosmetic change | Forever |

---

## 5) Proposed shared contract (target — not implemented in PR-0)

Required for every public page after migration:

`AppPage · PageHeader · SearchAndFilterBar · FilterSheet · Empty/Error/Offline · ResponsiveDialog/Sheet · FormField/SelectField · FloatingLayerManager · ReadingPage`

**Existing partial building blocks (reuse, don’t duplicate):**

- `components/filters/FilterSheet.tsx`, `FilterBar.tsx`
- `components/layout/FilterBottomSheet.tsx`
- `components/design-system/PageHeaderV2.tsx`, `components/ui/mj.tsx` PageHeader
- `components/ui/AppBottomSheet.tsx`
- `UtilityScreen` (temporary shell until AppPage)

PR-1 must **promote one** AppPage/PageHeader — not add a parallel system on top of UtilityScreen forever.

---

## 6) Filter inventory (seed)

See `docs/release/sunnah-release-filter-inventory.json`.

Allowed states going forward: `WORKING · BROKEN · DUPLICATE · EMPTY_BY_DATA · UNSUPPORTED · REMOVE`.

PR-0 seed classifications for focus filters only; **full option-by-option testing is PR-2**.

---

## 7) Screenshot matrix (PR-0)

### Captured (production)

49 shots across routes × viewports × light/dark/large-text samples. Full list: `baseline-screenshots/manifest.json` and `/tmp/sunnah-release-baseline/`.

### Committed samples

| File | Covers |
|---|---|
| `quran-hub-numbers__iphone-14__light.png` | Chip/tab density on phone |
| `quran-hub-numbers__ipad-portrait__light.png` | iPad layout of numbers |
| `discover-islam-contact__*__light.png` | Native selects / form |
| `arabic-language__*__light.png` | Accordion hub |
| `islamic-landmarks__ipad-portrait__light.png` | Landmarks |
| `mushaf__iphone-14|ipad-portrait|ipad-landscape__light.png` | Mushaf width/chrome |
| `home__ipad-portrait__light.png` | Reference DS |

### Explicit gaps (Device Required / follow-up)

- Full **224 pages × 9 viewports × light/dark/RTL/large-text** — not done (would be thousands of images).
- Physical iOS/Android touch FPS.
- VoiceOver pass on device.
- Split View true multitasking (approximated by 507×1180).

---

## 8) PR program (locked order)

| PR | Scope | Depends |
|---|---|---|
| **0** | This baseline + inventories | — |
| 1 | AppPage + PageHeader + spacing/safe-area | 0 merged |
| 2 | Search + Filter system | 1 |
| 3 | Forms + privacy dawah | 1 |
| 4 | ReadingPage + accordion siblings | 1 |
| 5 | مساجد/مشاهد content+UI | 1–2 |
| 6 | FloatingLayerManager + nav | 1 |
| 7 | Mushaf tap contract + onboarding | 0 + mushaf width |
| 8 | Mushaf iPad + interaction regression | 7 |
| 9 | Remaining old pages | 1–6 |
| 10 | Dark/a11y/responsive QA | 9 |
| 11 | Legacy deletion + release audit | 10 |

**Rule:** one Ready PR at a time from latest `origin/main`; no UI work before PR-0 merge.

---

## 9) Quran integrity (baseline statement)

| Asset | Rule |
|---|---|
| Quran text / tashkeel | **DO NOT MODIFY** |
| Page mapping 604 | **DO NOT MODIFY** |
| Lines per page 15 | **DO NOT MODIFY** |
| Geometry signature | Preserve; no stretch/scale/letter-spacing hacks |
| Gates | Existing mushaf-* gates remain; add new for tap/onboarding/iPad |

---

## 10) Honest remaining risks (post PR-0)

1. **224 pages** still on mixed shells — visual debt is systemic, not one page.  
2. **iPad mushaf 430px** still on main until #2240 merges.  
3. **Landmarks content** may mix history and virtue language — needs scholarly pass.  
4. **critical-css gzip** over 60KiB observed locally on stale/fresh dist (Class B on tip) — release/perf follow-up.  
5. Full screenshot/a11y matrix incomplete — **Device Required**.

---

## 11) Owner Actions / Device Required

| Item | Type |
|---|---|
| Approve merge of PR-0 then sequential PRs | Owner |
| Merge or rebase mushaf iPad width #2240 | Owner/CI |
| Physical iPad Portrait/Landscape/Split gesture QA | Device Required |
| VoiceOver + Large Text on device | Device Required |
| Scholarly review of landmarks virtues/sources | Owner/content |

---

*End of PR-0 baseline. Next: merge this document, then open PR-1 only.*
