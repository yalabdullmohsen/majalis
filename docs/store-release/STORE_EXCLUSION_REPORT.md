# Store Exclusion Report — سُنّة 1.0.0

**Historical STORE_SOURCE_COMMIT:** see `STORE_SOURCE_COMMIT.txt`  
**Truth:** `docs/release/CURRENT_PROJECT_STATUS.md` · live web tip may differ from store pin  
**Updated:** 2026-09-21 (Full Remediation Wave 2)  
**Inventory:** `reports/store-license-inventory.json`

## Purpose

Prove that `MISSING_EVIDENCE` / unresolved adhan media / QPC fonts are not shipped inside Store Release Candidate binaries. UI hiding is **insufficient**.

## Excluded from store dist (webDir → cap sync)

Globs in `excluded-asset-globs.json` under `artifacts/majalis`:

- `public/sounds/adhan/*.{mp3,m4a}`
- `public/audio/adhan/*.{mp3,m4a}` — **includes** CC0 `field` / `field-full` until OWNER allowlists them for store
- `public/fonts/qpc-v2/**` — QPC redistribution **BLOCKED_LICENSE** until written OWNER OK

**Tool:** `node scripts/store-strip-unresolved-assets.mjs`  
Runs against `artifacts/majalis/dist` and deletes matching unresolved media **and** `dist/fonts/qpc-v2`.

**Gate:** `pnpm run verify:store-assets` (also wired into `pnpm run verify:ci` repo-gates)  
After store strip: `STORE_CHECK_DIST=1 pnpm run verify:store-assets`  
**Production UI gate:** `pnpm --filter @workspace/majalis run test:prayer-audio-rights` (includes `store-release-assets-gate`)

## Public-tree hard bans (Wave 2)

Must not exist as media under `public/audio/adhan` or `public/sounds/adhan`:

- `*qatami*`
- `*adhan-madinah*`
- `madinah-general.*`
- `nasser-al-qatami*`

Legacy `madinah-general.m4a` **removed** in Wave 2. Redirect map in `adhan-offline-assets.ts` may still rewrite old URLs to Makkah pack.

## Native iOS resources (still in git — OWNER ACTION)

These files exist in the Xcode project tree and **will enter an Archive unless removed from Copy Bundle Resources** for the store target:

- `ios/App/App/Sounds/adhan-*.caf` (includes CC0 shorts — still require OWNER allowlist for store)
- `ios/App/App/Sounds/prayer_{aqsa,egypt,makkah}.caf`
- `ios/App/App/adhan-seq-makkah-*.caf` / short adhan CAF copies in App root

**Status:** Documented for store as exclude-or-allowlist.  
**Store build:** MANUAL_OWNER_ACTION — exclude from store scheme / target membership before Archive, then re-run gate on the `.app` payload if tooling available.  
**Also:** run `node artifacts/majalis/scripts/native-strip-qpc-fonts.mjs` after `cap sync` for store candidates.

Provisional short tones (`prayer-alert.caf`, rings, `prayer_default.caf`, …) remain listed as provisional; preferred store behavior is **OS default sound** with no custom CAF until OWNER_APPROVED.

## Android

Unresolved files reach Android only if present under synced `assets/public` from dist. Stripping dist before `cap sync android` is mandatory for store candidates (adhan media + QPC fonts).

## Streaming sources

Not copied into binary when used as URL-only. Gate checks that store selectable catalog does not point at local missing files. Hisn edition rights remain OWNER_ACTION (text corpus — not stripped by this media tool).

## Verification commands

```bash
pnpm run verify:store-assets
pnpm --filter @workspace/majalis run test:prayer-audio-rights
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
node scripts/store-strip-unresolved-assets.mjs
STORE_CHECK_DIST=1 pnpm run verify:store-assets
```
