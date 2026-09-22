# Identity Reset PR-2 — LHCI Start preview root cause

**PR:** [#2219](https://github.com/yalabdullmohsen/majalis/pull/2219)  
**Failing commit:** `b6f561b6e`  
**Fix commit:** `e74a0dba0` (+ docs `01a461074`)  
**Merged to main:** `5a280c104`  
**Failing CI run:** [35712958947](https://github.com/yalabdullmohsen/majalis/actions/runs/35712958947) (user-facing #7320 if applicable)  
**Passing CI after fix:** [35714536568](https://github.com/yalabdullmohsen/majalis/actions/runs/35714536568) (head `01a461074`)

## Original Start preview error

Job: **LHCI home (mobile)** → step **Start preview**

```
preview لم يصبح جاهزًا
➜  Local:   http://127.0.0.1:24216/
LHCI home outcome=skipped (failure = fail)
```

Vite preview **was running**. Health curl to `/` and `/version.json` could succeed, but the readiness probe greps only the **first 800 bytes** of HTML:

```yaml
body="$(curl -sf "http://127.0.0.1:24216/" | head -c 800 || true)"
grep -Eqi '<div id="root"|<div id="app"|ssunnah|سُنّة|majalis'
```

On `b6f561b6e`, static `<html data-home-chrome="1" …>` pushed the `majalis` marker from ~byte 775 (main) to ~796+, so truncation lost the match → 90s timeout → step exit 1.

## ROOT_CAUSE_CONFIRMED

Adding `data-home-chrome="1"` on the static `<html>` tag shifted the LHCI readiness marker (`majalis`) past the 800-byte probe window. Preview process was healthy; the **content probe** failed.

Hypothesis matched: not port conflict, not missing dist, not wrong BASE_PATH, not timeout-from-slow-startup.

## Why Verify build / ci-required failed

Path lane requires LHCI. When Start preview fails, LHCI is marked skipped → **LHCI must not skip when required** fails → aggregate **Verify build** and **ci-required** fail. Cascades, not independent product bugs.

## Fix (minimal)

1. Remove `data-home-chrome` from static `index.html` `<html>` tag.
2. Keep `App` setting `document.documentElement.dataset.homeChrome` at runtime.
3. Invert CSS: reserve ticker height by default on compact viewports; zero when `html[data-home-chrome="0"]`.
4. Gate: `sunnah-identity-reset-pr2-gate` asserts `majalis` index `< 800` and no `data-home-chrome` on the open html tag.

No LHCI disable, no threshold change, no timeout inflate, no path-lane change, no visual redesign of header/search/ticker.

## Files changed (fix)

- `artifacts/majalis/index.html`
- `artifacts/majalis/src/styles/critical-first-paint.css`
- `artifacts/majalis/src/styles/components/top-chrome-layout.css`
- `artifacts/majalis/src/styles/components/ipad-responsive-layout.css`
- `artifacts/majalis/src/lib/__tests__/sunnah-identity-reset-pr2-gate.test.ts`
- `docs/design/SUNNAH_VISUAL_IDENTITY_RESET.md`

## Results

| Check | Before (`b6f561b`) | After (`01a461074`) |
|---|---|---|
| Start preview | fail (probe) | success |
| LHCI home (mobile) | skipped→fail | success |
| Verify build | fail (cascade) | success |
| ci-required | fail (cascade) | success |
| `majalis` offset | ≥796 | 749 |

## Regression prevention

- PR-2 gate fails if `data-home-chrome` reappears on static `<html>` or `majalis` leaves the first 800 bytes.
- Do not put long attributes before the first occurrence of readiness markers in `index.html`.
