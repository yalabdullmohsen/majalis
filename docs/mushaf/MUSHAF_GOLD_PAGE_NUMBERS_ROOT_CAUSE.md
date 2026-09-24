# Mushaf GOLD + Page Numbers 1–2 — Root Cause (2026-09-24)

## Page numbers 1 & 2

| Hypothesis | Verdict | Evidence |
|---|---|---|
| `COMPONENT_NOT_RENDERED` | Rejected | Footer + `nm-page__footer-num` always in `MushafPage` |
| `PAGE_NUMBER_NOT_PASSED` | Rejected | `footerPage = displayPageNumber ?? layout.pageNumber` |
| `FOOTER_NOT_INCLUDED` | Rejected (mounted) | Footer was inside OpeningSpread |
| **`CLIPPED_BY_OVERFLOW`** | **Confirmed** | `.nm-page` is a 3-row grid (header \| body \| footer). `MushafOpeningSpreadLayout` wrapped **all three**, so one grid child sat in the 36px header track; footer was pushed/clipped under `overflow:hidden`. Page 3+ has no wrapper → number visible. |
| `CSS_HIDDEN` | Rejected | Opening footer-num has explicit display/color |
| `COVERED_BY_OVERLAY` | Possible secondary | Arrows/scrubber share footer band; primary was layout |

**Fix:** OpeningSpread wraps **stage only**. Header + `MushafPageNumber` remain direct grid children of `.nm-page`.

**Browser proof (2026-09-24, vite preview):** pages 1/2/3/100/604 render digits ١/٢/٣/١٠٠/٦٠٤; `stageOnlyOpening=true` for p1–p2.

## GOLD theme

| Hypothesis | Verdict | Evidence |
|---|---|---|
| `STATE_NOT_UPDATED` / `PROVIDER_NOT_PROPAGATED` | Rejected on tip | Provider + `data-mushaf-accent` path proven; storage persists `GOLD` after reload |
| **`CSS_SPECIFICITY_OVERRIDE`** | **Confirmed (chrome)** | `.mm-viewport { --mm-ui-accent:#135034 }` overrode accent after GOLD (NewMushafReader uses `nm-root mm-viewport`). |
| `TESTFLIGHT_STALE_BUILD` | Open | Require Cap sync + TestFlight build containing this commit; iOS build number must advance. |
| Markers tokens | OK on tip | `.nm-ayah-mark` computed `#c9a82e` under GOLD; `--mm-ui-accent` = `#c9a82e` |

**Fix:** `--mushaf-page-number` / `--mm-ui-accent` bind to `--mushaf-accent-fill`; `.nm-root.mm-viewport` beats madinah single-class rule. Cache version → `sms-2026-09-24-gold-page-numbers`.

## Quran safety

No QPC / page-mapping / letter-spacing / scale / ayah text edits.
