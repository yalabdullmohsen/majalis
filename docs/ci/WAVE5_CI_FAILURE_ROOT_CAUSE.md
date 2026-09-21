# Wave 5 CI Failure — Root Cause

**Run:** [CI #7277](https://github.com/yalabdullmohsen/majalis/actions/runs/35624737153)  
**PR:** [#2196](https://github.com/yalabdullmohsen/majalis/pull/2196) · branch `cursor/remediation-wave5-admin-v3-shell`  
**Date:** 2026-09-21  
**Status after analysis:** Root cause confirmed · historical content fix landed in follow-up commit · recurrence guard added

---

## Root Cause

Wave 5 added Admin v3 routes (including `/admin/v3`) into the SEO route registry. `pnpm build` runs `generate:seo` then **`generate:seo-nav-labels`**, which **rewrote** the tracked file:

`artifacts/majalis/src/lib/seo-nav-labels.json`

The regenerated labels (new `/admin/v3` entry) were **not committed** on the first Wave 5 push. After build, `git diff --exit-code` failed → job **build** failed.

| Role | Path |
|---|---|
| Source of Truth | `artifacts/majalis/src/lib/seo-routes.json` |
| Generator | `artifacts/majalis/scripts/generate-seo-nav-labels.mjs` |
| Generated (tracked) | `artifacts/majalis/src/lib/seo-nav-labels.json` |
| Consumer | `artifacts/majalis/src/lib/seo-nav-labels.ts` |

**Mismatch type:** stale generated artifact vs Source of Truth — not non-determinism (same generator always produces the same JSON for the same `seo-routes.json`).

---

## Impact

| Check | Result on #7277 | Why |
|---|---|---|
| classify-path-lane | ✅ success | Lane classified correctly |
| static-checks | ✅ success | Did not yet include seo-nav-labels `--check` |
| repo-gates | ✅ success | Unaffected |
| **build** | ❌ failure | `git diff --exit-code` on `seo-nav-labels.json` |
| visual-snapshot | ⏭️ skipped | `needs: build` + `needs.build.result == success` |
| color-contrast | ⏭️ skipped | same cascade |
| lhci-home | ⏭️ skipped | same cascade |
| Verify build | ❌ failure | depends on build (+ visual/color/lhci when required) |
| **ci-required** | ❌ failure | required build failed; required visual/color/lhci skipped |

### Path-lane (not wrong)

From ci-required env on #7277:

- `NEED_BUILD=true`
- `NEED_VISUAL=true`
- `NEED_COLOR=true`

Path-lane **correctly** required visual/color/LHCI because Wave 5 touched public surfaces (`AppRoutes`, admin CSS/shell). Those jobs were **not** excluded by lane; they were **blocked by failed build**. Skipped ≠ optional when `need_*=true`.

Admin files did change chrome/routes enough to set `need_visual` / `need_color_contrast`; that is expected, not a lane bug.

---

## Exact failing files / workflow

- **Workflow:** `.github/workflows/ci.yml` · job `build` · step `git diff --exit-code (build must not dirty tree)`
- **Dirty file:** `artifacts/majalis/src/lib/seo-nav-labels.json` (added label for `/admin/v3`)
- **Downstream:** job `ci-required` / `Verify build`

---

## Correct fix

1. **Content (already on main via Wave 5 follow-up):** regenerate and commit `seo-nav-labels.json` (`7933a5110` — «تثبيت seo-nav-labels لمسار /admin/v3»). CI #7278 succeeded.
2. **Prevention (this change):**
   - Add `--check` to `generate-seo-nav-labels.mjs` (compare, no write).
   - Build runs **`check:seo-nav-labels`** instead of rewriting the tracked file.
   - Wire `--check` into `Generated artifacts --check` (static-checks + `verify:ci` / `verify:pr`).

Drift fails early with a clear command; build no longer mutates tracked labels.

---

## Incorrect fixes to avoid

- Disabling / skipping `git diff --exit-code`
- Removing or weakening the dirty-tree gate
- `continue-on-error` / `|| true` on build
- Committing without regenerating from `seo-routes.json`
- Treating skipped visual/color/lhci as “lane wrongly required” when `NEED_*=true` and build failed
- Re-architecting Admin v3 / Design System / content to “fix” CI

---

## Verification expectations

After the prevention guard:

- `pnpm run check:seo-nav-labels` exits 0 when committed labels match SoT
- `pnpm build` does not modify `seo-nav-labels.json`
- `git diff --exit-code` stays clean after build
- If SoT advances without regenerating labels, **static-checks / generated --check** fail before expensive build

---

## Related

- Historical success after regenerate: CI #7278 on same PR  
- Pattern peers: `generate-quran-pages-manifest.mjs --check`, `generate-content-counts.ts --check`
