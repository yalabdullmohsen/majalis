# STORE 100% READINESS — سُنّة 1.0.0

**Pinned Phase-0 commit:** `ed5320b1f23c7b21d230c0698e86ce5cb8731ebc`  
**After PR-A on main:** `af09bc46488b1945352dc2b679f667020af74777`  
**Re-pin policy:** Store RC Archive/AAB must record the exact commit built; do not mix Phase-0 pin with later commits without a full rebuild.  
**Latest hardening PR-A:** #2081  
**Verdict:** **HOLD**

| Gate | Status | Evidence |
|---|---|---|
| iOS prayer notification WORKING | ☐ | No device evidence |
| Android prayer notification WORKING | ☐ | No device evidence |
| Verified sound playback on iOS | ☐ | system-default only; device unproven |
| Verified sound playback on Android | ☐ | system-default only; device unproven |
| No unresolved asset in iOS binary | ☐ | CAF adhan-* still in Xcode tree — OWNER exclude |
| No unresolved asset in Android binary | ☐ | Requires strip+sync on store build |
| License manifest complete | ☑ | `STORE_ASSET_MANIFEST.md` |
| Bundle ID approved | ☐ | OWNER decision |
| Signing approved | ☐ | OWNER secrets |
| iOS archive from STORE_SOURCE_COMMIT | ☐ | Not built |
| Android AAB from STORE_SOURCE_COMMIT | ☐ | Not built |
| TestFlight verification passed | ☐ | Not uploaded |
| Android testing verification passed | ☐ | Not uploaded |
| RLS/schema decision recorded | ☐ | Plan only |
| Admin MFA decision recorded | ☐ | Owner dashboard |
| Leaked-password decision recorded | ☐ | Owner dashboard / plan |
| No service role in client bundle | ☑ | Existing gates |
| CI green | ☑ | verify:ci on PR-A |
| Visual/Contrast/LHCI green | ☑ | Prior main + PR checks when green |
| Mushaf gates green | ☑ | verify:ci |
| Privacy/store metadata complete | ☐ | Checklists pending |
| Owner final approval recorded | ☐ | |

**Rule:** any unchecked P0 row ⇒ **HOLD** (no GO_WITH_RISK for license/signing/notifications).
