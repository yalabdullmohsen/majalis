# Sunnah Launch Candidate Report

**Date:** 2026-09-17  
**Branch:** `cursor/sunnah-launch-candidate`  
**Knowledge baseline:** `docs/project-knowledge/**` @ `975505911116f6190e2d09fc97ced3dbbb02e37d`  
**Prior RC:** `d23b6131a` on main  

Scope: proven bugs / UX / data / launch only. No features, redesign, mushaf data, CI architecture, or bundle budget changes.

---

## Prayer notification reality matrix

| Path | Status | Evidence |
|---|---|---|
| Preference master toggle (`masterEnabled` ↔ `alertsEnabled`) | **working** | PrayerAlertSettingsCard sync + Preferences API |
| Schedule build (native coordinator) | **working** (code) | `coordinatePrayerNotifications` + scheduler; requires valid times |
| Web LocalNotifications delivery | **broken** (by design) | Coordinator returns `web_context` / skipped on non-native |
| Native LocalNotifications delivery | **unknown** | Needs real device; KB forbids claiming green without device test |
| Permission request / denied handling | **working** (code) | PrayerAlertSettingsCard + system settings deep-link |
| Ringtone / voice selection UI | **working** | `listSelectableAdhanVoices` only |
| Pending / unlicensed adhan as active choice | **fixed** | Normalize prefs clamps to selectable voices only |
| Adhan playback of unlicensed pending packs | **broken** / blocked | Pending voices not selectable; LICENSE_RISKS |
| In-app web timers while tab open | **working** (partial) | adhan-scheduler; not OS notifications |
| Push API (Expo) for prayer times | **broken** (not used for prayer) | KB: api-server push ≠ prayer scheduler |

UI now surfaces `deliveryContextAr` so users see web vs native reality.

---

## LICENSE_RISKS classification (no new files)

| Asset | Class |
|---|---|
| QCF_BSML omitted (SVG ornament) | **Licensed / documented workaround** |
| Madinah page images | **Missing evidence** (disabled intentionally) |
| Audio tafsir catalog empty | **Missing evidence** (disabled intentionally) |
| QPC V2 store redistribution | **Needs owner decision** |
| `public/sounds/adhan` packs | **Needs owner decision** |
| everyayah / mp3quran packaging | **Needs owner decision** |
| ~173 library books | **Needs owner decision** |
| Hisn al-Muslim edition | **Needs owner decision** |
| mohsalvi/adhan-audio attribution | **Needs owner decision** |
| Live Quran.com / AlQuran Cloud fetch + attribution | **Licensed** (partial / streaming terms) |
| npm GPL/AGPL pure | **Licensed** (CI `test:licenses` gate) |

---

## Content governance

- Search cards: draft / pending / needs_review hidden; fiqh-council hrefs blocked.
- Related rail: admin / fiqh-council filtered.
- Pending rulings remain unpublished (inventory pattern).
- Draft ≠ Published for public search surfaces.

---

## Launch recommendation

- **Web launch candidate: GO** after green CI + contrast/visual + production smoke.
- **Store 1.0.0: HOLD** until owner LICENSE decisions + device prayer delivery proof.
