# STORE 100% READINESS — سُنّة 1.0.0

**Verdict:** **HOLD**  
**Truth sync:** 2026-09-21 · `docs/release/CURRENT_PROJECT_STATUS.md`  
**Live web tip (`origin/main` / production):** `5e99cd7c` — **not** an automatic Store RC pin.  
**Historical web tip (STALE):** `3ba020f2` (pre store-guard #2191)  
**Pinned Phase-0 commit (historical):** `ed5320b1f23c7b21d230c0698e86ce5cb8731ebc`  
**After PR-A on main (historical):** `af09bc46488b1945352dc2b679f667020af74777`  
**Re-pin policy:** Store RC Archive/AAB must record the exact commit built; do not mix Phase-0 pin, PR-A pin, or web tip without a full rebuild + owner pin.  
**Latest hardening PR-A:** #2081 · **Store asset guards:** #2191  
**Owner actions:** `docs/release/OWNER_ACTIONS_CURRENT.md`

| Gate | Status | Evidence |
|---|---|---|
| iOS prayer notification WORKING | ☐ | No device evidence — DEVICE_REQUIRED |
| Android prayer notification WORKING | ☐ | No device evidence — DEVICE_REQUIRED |
| Verified sound playback on iOS | ☐ | Catalog includes CC0 `field`/`field-full` + shorts; **device unproven** |
| Verified sound playback on Android | ☐ | same — DEVICE_REQUIRED |
| No unresolved asset in iOS binary | ☐ | CAF adhan-* still in Xcode tree — OWNER exclude / license |
| No unresolved asset in Android binary | ☐ | Requires strip+sync on store build |
| License manifest complete | ☑ | `STORE_ASSET_MANIFEST.md` (must stay in sync with rights registry) |
| Bundle ID approved | ☐ | OWNER decision |
| Signing approved | ☐ | OWNER secrets |
| iOS archive from STORE_SOURCE_COMMIT | ☐ | Not built — pin ≠ web tip until owner pins |
| Android AAB from STORE_SOURCE_COMMIT | ☐ | Not built |
| TestFlight verification passed | ☐ | Not uploaded |
| Android testing verification passed | ☐ | Not uploaded |
| RLS/schema decision recorded | ☐ | Plan only |
| Admin MFA decision recorded | ☐ | Owner dashboard |
| Leaked-password decision recorded | ☐ | Owner dashboard / plan |
| No service role in client bundle | ☑ | Existing gates |
| CI green (web tip) | ☑ | tip `5e99cd7c` on main + production at Wave-1 sync; re-verify after each wave |
| Visual/Contrast/LHCI green | ☑ | Prior main + PR checks when green |
| Mushaf gates green | ☑ | verify:ci path; some package UI scripts still no-op — Remediation PR-9 |
| Privacy/store metadata complete | ☐ | Checklists pending |
| Owner final approval recorded | ☐ | |

**Rule:** any unchecked P0 row ⇒ **HOLD** (no GO_WITH_RISK for license/signing/notifications).  
**Non-claim:** Shipping CC0 field styles on web ≠ store binary clearance.
