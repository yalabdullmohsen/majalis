# App Review Notes — سُنّة (paste into App Store Connect)

**Version:** 1.0  
**Build:** 54 (remediation after rejection of Build 53)  
**Bundle ID:** com.yousef.majlisilm  

---

## Guideline 2.1 — Sign-in / Demonstration Mode

### Demo account (works offline of email confirmation)

| Field | Value |
|-------|-------|
| Email | `apple.review@ssunnah.com` |
| Password | `SunnahReview-2026!` |

**How to sign in (any of these):**

1. Open **تسجيل الدخول** (`/login`).
2. Enter the email and password above → Sign in.  
   **OR** tap **«وضع مراجعة App Store»** (App Store Review Mode) under the guest link — one tap, no network auth required.
3. You land on Home as a signed-in review user (local demonstration session). Logged-in surfaces (settings account, vault/progress affordances, etc.) become available. **No admin privileges.**

### Guest access (no account required)

Most of the product works without login: Quran Mushaf, adhkar, prayer times, Qibla, hadith, lessons browsing, fiqh, seerah. Tap **المتابعة كزائر** on the login screen or use the app from Home.

### Why the previous demo failed

The prior note pointed at `info@ssunnah.com` with a password “provided separately,” and production Supabase may require email confirmation. Build 54 adds a **local Demonstration Mode** that does not depend on email confirmation or network auth success.

---

## Guideline 2.5.4 — Background Audio

The app declares `UIBackgroundModes = audio` because **Quran tilawa continues while backgrounded or locked**.

### Exact verification path (please follow)

1. Launch **سُنّة**.
2. Open **المصحف** (Quran) — main Quran entry / route `/mushaf`.
3. Tap an ayah → start **تلاوة** (play) from the ayah actions or audio dock. Confirm sound plays in foreground.
4. Press **Home** (or switch apps) — **audio must keep playing ≥ 60 seconds**.
5. Open **Control Center** — **Now Playing** shows surah/ayah and reciter; pause/play work.
6. **Lock** the device — audio continues; Lock Screen transport controls work.
7. Unlock and return — position and ayah remain consistent.

There is **no** silent keep-alive. Background mode is only for real Quran/lesson playback via `AVAudioSession` `.playback` + Now Playing (`MajlisPlaybackAudioPlugin`).

Prayer reminders use notifications (`remote-notification`) and are separate from continuous background audio.

Device runbook (internal): `artifacts/majalis/docs/AUDIO_BACKGROUND_DEVICE_RUNBOOK.md`.

---

## App Overview (short)

Arabic RTL Islamic education: full Quran with audio, adhkar, prayer times, Qibla, hadith, fiqh, lessons. Optional account. No ads / no tracking SDKs.

---

## Permissions

- **Location When In Use:** Qibla only; not stored; manual city fallback if denied.
- **Motion:** Qibla compass heading.
- **Notifications:** Opt-in prayer/dhikr reminders.

---

## Test tips

- Arabic RTL UI.
- Prayer times compute locally (Adhan library).
- Network needed for streamed lessons / remote content; Mushaf tilawa needs reachable audio URLs (or cached ayahs).
