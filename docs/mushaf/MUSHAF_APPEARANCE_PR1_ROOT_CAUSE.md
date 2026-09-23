# Mushaf Appearance PR-1 — Root Cause Evidence

**Status:** `ROOT_CAUSE_CONFIRMED` (Playwright + code path, 2026-09-23)  
**Branch scope:** Provider + persistence + hydration only (no token migration, no marker, no tap contract).

## Classification (markers / GOLD)

| Hypothesis | Verdict | Evidence |
|---|---|---|
| `STATE_NOT_UPDATED` | **Rejected** for live `/mushaf` | Click `mushaf-accent-gold` → Provider `theme=GOLD`, `localStorage=GOLD`, `data-mushaf-accent=gold` |
| `PROVIDER_NOT_PROPAGATED` | **Rejected** | `NewMushafReader` binds `data-mushaf-accent={accentAttr}` from `useMushafAppearance()` |
| `CONSUMER_NOT_USING_PROVIDER` (markers) | **Rejected** for `.nm-ayah-mark` | Markers use `--mushaf-verse-marker-fill` → remaps under `[data-mushaf-accent=gold]` |
| `CSS_SPECIFICITY_OVERRIDE` (markers) | **Rejected** | Force `data-mushaf-accent=gold` → computed `backgroundColor #c9a82e` on all visible marks |
| `OPENING_PAGE_OVERRIDE` | **Rejected** for accent | Opening marks use `--mushaf-marker-background`; follow same attr |
| `PERSISTENCE_FAILURE` | **Rejected** after save | Reload with `GOLD` in storage → accent stays gold, marks stay `#c9a82e` |
| `CACHE_FAILURE` | **Open (Class B)** | Native/TestFlight cache not verified in this PR; web tip path works |
| `MULTIPLE_PROVIDERS` | **Confirmed latent** | `VerifiedMushafReader` had local `setAccentThemeLocal` that could skip save; archived path; unified in PR-1 |
| `STALE_MEMOIZATION` | **Rejected** | CSS variables inherit; no React re-render required for mark color |
| `OTHER_CONFIRMED` | **Confirmed** | (1) No pre-React boot for accent → emerald FOUC risk. (2) Empty-tap rarely opens chrome (`data-chrome` stays `0`) because `.nm-word` covers most of the page and edge zones page-turn — appearance control hard to reach (PR-5). (3) `--mm-ui-accent:#135034` hardcoded in madinah CSS — sheets/chrome stay green after GOLD (PR-2 token migration). |

## Before / After (Playwright, page 5, tip build)

| Step | Settings | Provider/DOM | Consumer mark computed | `--mushaf-accent-fill` |
|---|---|---|---|---|
| Default | — | `emerald` / storage null | `#0e7a6b` | `#0e7a6b` |
| After GOLD click (chrome forced) | `aria-checked=true` on gold | `gold` / `GOLD` | gold (`#c9a82e` / highlight) | `#c9a82e` |
| After reload | — | `gold` / `GOLD` | `#c9a82e` | `#c9a82e` |
| Force attr only | — | attr `gold` | `#c9a82e` (all marks) | `#c9a82e` |

## PR-1 fixes

1. **Boot hydration:** `index.html` `mj-theme-boot` sets `html[data-mushaf-accent]` from `ssunnah-mushaf-accent-theme-v1` before CSS/React.
2. **Provider sync apply:** `readInitialTheme()` calls `applyMushafAccentTheme` during `useState` init (not only `useEffect`).
3. **Single write path (archive reader):** `VerifiedMushafReader` fallback setter always goes through `QuranSettingsRepository.setAccentTheme` + `applyAccentTheme`.

## Explicit non-goals (later PRs)

- Token migration / remove `#135034` overrides → PR-2  
- Unified marker visual polish → PR-3  
- Opening optical balance → PR-4  
- Tap/swipe/chrome contract → PR-5  
- Index/settings sheets → PR-6  
- Mini player / FloatingLayer → PR-7  
- iPad layout → PR-8  
- Device matrix / TestFlight → PR-9  
- Page number visibility polish (component already shared `nm-page__footer-num` on p1–p2; visible in probe) → follow opening PR

## Page number note (investigation only)

Visible-page probe: page 1 footer `١`, page 2 footer `٢`, `inView: true`, same `MushafPage` footer control. Missing-number reports are **not** “component not mounted”; suspect coverage/contrast/safe-area — deferred.
