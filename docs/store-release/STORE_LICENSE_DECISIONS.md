# Store License Decisions — سُنّة 1.0.0

**STORE_SOURCE_COMMIT:** `ed5320b1f23c7b21d230c0698e86ce5cb8731ebc`  
**Date:** 2026-09-17  
**Authority:** Owner decisions required for anything not product-owned or OS-default.

| Decision ID | Asset class | Agent recommendation (non-binding) | Owner must choose | Blocks store GO? |
|---|---|---|---|---|
| LIC-01 | QPC V2 in-app redistribution | Keep fonts for reader only after written QUL/KFGQPC OK | Approve written license **or** HOLD store | **Yes** |
| LIC-02 | Local adhan packs (`public/sounds`, `public/audio`, iOS CAF adhan-*) | **Exclude** from Store binary; use OS default | Approve specific files with evidence **or** confirm exclusion | **Yes** until excluded in signed builds |
| LIC-03 | mohsalvi CDN stream | Stream-only, style labels only, no famous-name claims | Accept stream policy **or** disable stream | Soft (if bundled = hard) |
| LIC-04 | everyayah / mp3quran | Stream-only + attribution; no MP3 package in app | Accept **or** disable murattal remote | Soft if stream-only enforced |
| LIC-05 | Library books | Ship verified-source only | Provide publisher list / exclude unknowns | **Yes** for Play/App content rights if unknowns shown |
| LIC-06 | Hisn al-Muslim | Keep only with edition permission | Approve edition **or** replace texts | **Yes** if texts ship |
| LIC-07 | Madinah images / audio tafsir | Remain excluded | No change | No (already excluded) |

## Written evidence required (paths)

Place owner-approved PDFs/emails under (do not commit secrets):

`docs/store-release/license-evidence/` (gitkeep only until owner adds files)

Each evidence file must name: asset id, date, grantor, scope (store redistribute vs stream).

## Current automatic posture (this PR)

- Selectable adhan UI → **system-default** only (`verified_for_production`).
- Pending / style-only voices remain in data for future owner unlock, **not selectable**.
- `verify:store-assets` fails if excluded globs appear under `artifacts/majalis/dist` after a store strip check.
- Signed iOS/Android archives still require owner confirmation that adhan CAF resources were removed from Copy Bundle Resources — see `STORE_EXCLUSION_REPORT.md`.
