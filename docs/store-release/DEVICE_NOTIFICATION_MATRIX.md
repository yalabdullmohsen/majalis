# Device Notification Matrix — سُنّة Store 1.0.0

**STORE_SOURCE_COMMIT (Phase 0 pin):** `ed5320b1f23c7b21d230c0698e86ce5cb8731ebc`  
**Status:** **HOLD** — no physical device evidence attached in this environment.  
**Evidence folder:** `docs/store-release/DEVICE_EVIDENCE/` (empty until owner uploads).

Simulator / unit tests / web are **not** proof of OS LocalNotification delivery.

## Required platforms

| Platform | Device model | OS | App version/build | Source commit | Matrix status |
|---|---|---|---|---|---|
| iOS | *OWNER_FILL* | *OWNER_FILL* | *OWNER_FILL* | *must match store build* | **BLOCKED** (no device run) |
| Android | *OWNER_FILL* | *OWNER_FILL* | *OWNER_FILL* | *must match store build* | **BLOCKED** (no device run) |

## Case template (copy per row)

| ID | Case | Expected | Actual | Permission | Evidence file | Result | Notes |
|---|---|---|---|---|---|---|---|
| A1 | Permission notDetermined → prompt | Prompt shown | | | | | |
| A2 | granted | Can schedule | | | | | |
| A3 | denied | Deep-link to settings | | | | | |
| A4 | denied permanently | Settings only | | | | | |
| B1 | Enable prayer alerts | Prefs saved + pending > 0 on native | | | | | |
| B2 | Change prefs | Force reschedule | | | | | |
| C1 | App foreground | Alert/banner per platform | | | | | |
| C2 | App background | OS notification | | | | | |
| C3 | App killed | OS notification | | | | | |
| C4 | Timezone change | Reschedule | | | | | |
| C5 | New day | Reschedule | | | | | |
| D1–D5 | Fajr…Isha | Fire near scheduled time | | | | | |
| E1 | system-default sound | OS sound / no crash | | | | | |
| E2 | Preview | Matches selected | | | | | |
| E3 | Open notification | No double audio | | | | | |

Fill Result with only: `WORKING` | `BROKEN` | `NOT_APPLICABLE`.

## Dev harness (non-production)

See `artifacts/majalis/src/lib/prayer-notifications/store-device-harness.ts`  
- Namespace: `majalis-store-device-test`  
- Gated: `import.meta.env.DEV` + explicit opt-in flag  
- Schedules a near-future test notification; cancels after  
- Does **not** change prayer calculation method  
- Must not ship enabled in production builds

## Decision rule

Store GO requires every P0 row on **both** iOS and Android = WORKING with evidence filenames under `DEVICE_EVIDENCE/`.
