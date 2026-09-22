# Identity Reset PR-6 — Color Contrast root cause

**PR:** [#2225](https://github.com/yalabdullmohsen/majalis/pull/2225)  
**Failing commit:** `8d75c9907`  
**Fix commit:** `5b1762e11`  
**Merged to main (squash):** `287840a82`  
**Failing CI run:** [#7333](https://github.com/yalabdullmohsen/majalis/actions/runs/35728587969) (`35728587969`)  
**Passing CI after fix:** [#7334](https://github.com/yalabdullmohsen/majalis/actions/runs/35730426418) (head `5b1762e11`)

## Original Color contrast gate error

Job: **Color contrast (Playwright)** → step **Color contrast gate**  
Command: `pnpm --filter @workspace/majalis run test:color-contrast-gate` → `node scripts/verify-color-contrast-gate.mjs`

```
❌ بوابة انحدار تباين الألوان رسبت — 1/505 تأكيدًا فشل:

| المسار | المحدّد | لون النص | لون الخلفية | المقاس | المطلوب | السبب |
|---|---|---|---|---|---|---|
| /tafsir [dark] | `.topic-page__eyebrow` | rgb(18, 63, 46) #123F2E | ~rgb(20,37,31) #14251F | 1.35:1 | 4.5:1 | LOW_CONTRAST text="القرآن الكريم · أشرف العلوم موضوعًا" |

Screenshot: `test-results/contrast-gate/fail-1790081190057.png`
(artifact: color-contrast-failures)
```

On-brand contrast gate on the same job: **success** (`ONBRAND_OUTCOME: success`).

## Failure inventory

| Field | Value |
|---|---|
| route | `/tafsir` |
| viewport | gate default (Playwright contrast suite) |
| theme | **dark** |
| selector | `.topic-page__eyebrow` |
| component | TopicPage hero eyebrow / safe-hero badge |
| visible text | `القرآن الكريم · أشرف العلوم موضوعًا` |
| foreground | `#123F2E` (soft-hero emerald ink) |
| background | `#14251F` (night surface under hero) |
| opacity | 1 (no parent fade evidenced) |
| font size | caption / small → AA **4.5:1** required |
| font weight | normal (eyebrow chip) |
| contrast before | **1.35:1** |
| required | **4.5:1** |
| screenshot | `fail-1790081190057.png` |

## Why Verify build / ci-required failed

Path lane required color-contrast. Color contrast job failed → aggregate **Verify build** and **ci-required** failed with “Blocked by Color contrast only”. Cascades, not independent product bugs.

LHCI home, visual-snapshot, build, repo-gates, static-checks, On-brand: **success** on the same failing SHA.

## ROOT_CAUSE_CONFIRMED

**Hypothesis 5 (confirmed):** Dark Mode used muted/deep emerald foreground (`#123F2E` from soft-hero) on a night surface (`#14251F`).

Identity Reset PR-6 densified TopicPage under `data-v2-app` but did not override soft-hero’s dark eyebrow/`safe-hero__badge` color. Soft-hero forces `#123f2e` with specificity/`!important`, so night ink never applied → near-black-green on near-black-green.

Not gold-on-ivory · not opacity · not light-mode muted · not badge same-hue pair · not disabled state.

## Fix (minimal, token-aligned)

File: `artifacts/majalis/src/styles/sunnah-identity-detail-reading.css`

Dark + `data-v2-app` overrides for `.topic-page__eyebrow` and `.topic-page__hero .safe-hero__badge`:

- **color:** `#eef7f2` (night ink / high-contrast on night surfaces) with `!important` **only** to beat soft-hero
- **background:** `color-mix(in srgb, #ffffff 16%, var(--v2-color-night-surface, #12261f))`
- Cap: ≤2 `!important` in this file (asserted by `sunnah-identity-reset-pr6-gate`)

Estimated contrast after (computational check):

| Pair | Ratio |
|---|---|
| `#eef7f2` on chip mix (~`#384943`) | ~**8.7:1** |
| `#eef7f2` on `#12261f` / `#14251F` | ~**14.5:1** |

Both ≥ 4.5:1 AA for small text.

## Regression protection

- `test:sunnah-identity-reset-pr6` asserts dark eyebrow selectors + `#eef7f2` and forbids expanding `!important` beyond 2.
- Gate also requires this document to exist (anti-amnesia).

## CI results after fix

| Check | Result |
|---|---|
| Color contrast | success (#7334) |
| On-brand contrast | success |
| LHCI home (mobile) | success |
| visual-snapshot | success |
| Verify build | success |
| ci-required | success |

No gate disabled · no WCAG threshold lowered · no mushaf / Admin v3 changes · no snapshot weaken.
