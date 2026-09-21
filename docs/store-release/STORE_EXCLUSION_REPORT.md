# Store Exclusion Report — سُنّة 1.0.0

**Historical STORE_SOURCE_COMMIT:** see `STORE_SOURCE_COMMIT.txt`  
**Truth:** `docs/release/CURRENT_RELEASE_TRUTH.md` · live web tip may differ from store pin  
**Updated:** 2026-09-21 (Remediation PR-2)

## Purpose

Prove that `MISSING_EVIDENCE` / unresolved adhan media are not shipped inside Store Release Candidate binaries. UI hiding is **insufficient**.

## Excluded from store dist (webDir → cap sync)

Globs in `excluded-asset-globs.json` under `artifacts/majalis`:

- `public/sounds/adhan/*.{mp3,m4a}`
- `public/audio/adhan/*.{mp3,m4a}` — **includes** CC0 `field` / `field-full` until OWNER allowlists them for store

**Tool:** `node scripts/store-strip-unresolved-assets.mjs`  
Runs against `artifacts/majalis/dist` and deletes matching unresolved media.

**Gate:** `pnpm run verify:store-assets`  
After store strip: `STORE_CHECK_DIST=1 pnpm run verify:store-assets`  
**Production UI gate:** `pnpm --filter @workspace/majalis run test:prayer-audio-rights` (includes `store-release-assets-gate`)

## Native iOS resources (still in git — OWNER ACTION)

These files exist in the Xcode project tree and **will enter an Archive unless removed from Copy Bundle Resources** for the store target:

- `ios/App/App/Sounds/adhan-*.caf` (includes CC0 shorts — still require OWNER allowlist for store)
- `ios/App/App/Sounds/prayer_{aqsa,egypt,makkah}.caf`
- `ios/App/App/adhan-seq-makkah-*.caf` / short adhan CAF copies in App root

**Status:** Documented for store as exclude-or-allowlist.  
**Store build:** MANUAL_OWNER_ACTION — exclude from store scheme / target membership before Archive, then re-run gate on the `.app` payload if tooling available.

Provisional short tones (`prayer-alert.caf`, rings, `prayer_default.caf`, …) remain listed as provisional; preferred store behavior is **OS default sound** with no custom CAF until OWNER_APPROVED.

## Android

Unresolved files reach Android only if present under synced `assets/public` from dist. Stripping dist before `cap sync android` is mandatory for store candidates.

## Streaming sources

Not copied into binary when used as URL-only. Gate checks that store selectable catalog does not point at local missing files.

## Verification commands

```bash
pnpm run verify:store-assets
pnpm --filter @workspace/majalis run test:prayer-audio-rights
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
node scripts/store-strip-unresolved-assets.mjs
STORE_CHECK_DIST=1 pnpm run verify:store-assets
```
