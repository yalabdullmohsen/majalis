# App Review Notes — Majalis Al-Ilm (مجالس العلم)

**Version:** 1.0  
**Bundle ID:** com.majlisilm.app  
**Category:** Education / Reference  

---

## App Overview

Majalis Al-Ilm ("Islamic Knowledge Councils") is a comprehensive Arabic-language Islamic education platform. It provides:

- Full Quran browsing with audio streaming from multiple renowned reciters
- Adhkar (daily remembrances) with a counter, morning/evening dhikr
- Accurate prayer times calculator using the Adhan library (local computation)
- Qibla compass using device geolocation (one-time, not stored)
- Verified hadith database (sahih, da'if, mawdu') with scholarly grading
- Islamic jurisprudence (fiqh), fatwas, and scholarly rulings
- Lessons and annual courses from Islamic scholars
- Learning paths and flashcards for students of Islamic knowledge
- Prophet's biography (seerah), Companions' biographies, Islamic history

The app serves the Kuwaiti Islamic scholarly community and Arabic-speaking Muslims worldwide.

---

## Religious Content Sources

**Quranic Text:** Sourced from the Official Quran (Hafs narration). Displayed as-is, no AI modification.

**Hadith Content:** Sourced from authenticated hadith collections. Each hadith record includes:
- Chain classification (sahih/da'if/mawdu')
- `is_approved` and `verified_by` fields reviewed by human scholars before publication
- Source attribution (Sahih Bukhari, Muslim, Abu Dawud, etc.)

**Scholarly Content:** All lessons, fatwas, and jurisprudential content is uploaded by verified scholars (`scientific_reviewer` role) and approved via the admin review queue before being published.

**No religious content is AI-generated.** The AI assistant feature (`/assistant`) answers general queries but explicitly refers users to qualified scholars for personal fatwas. AI responses are not stored in the religious content database.

---

## Permissions

### 1. Location (When In Use)
- **Purpose:** Calculate Qibla direction and distance to Mecca
- **Usage:** One-time read on the Qibla page (`/qibla`) when user opens it
- **Storage:** Not stored anywhere — computed in-browser and discarded
- **Fallback:** If user denies, a manual city coordinate selector is available
- **Info.plist key:** `NSLocationWhenInUseUsageDescription`

### 2. Device Motion / Orientation
- **Purpose:** Rotate the Qibla compass according to device heading
- **Usage:** `DeviceOrientationEvent` API — only on Qibla page
- **iOS Permission:** Explicitly requested via `DeviceOrientationEvent.requestPermission()`
- **Info.plist key:** `NSMotionUsageDescription`

### 3. Notifications (Local)
- **Purpose:** Prayer time reminders and daily dhikr reminders
- **Usage:** User-opted local notifications scheduled via Capacitor LocalNotifications
- **Control:** Full user control in `/notification-settings` page and iOS Settings
- **Default:** Off — user must explicitly enable

---

## Account & Data

**Account system:** Optional. Most content is accessible without an account.

**Registration requires:** Email address only. Used for account management; not shared with third parties or used for advertising.

**Account deletion:** Available at `/account-deletion` — permanently deletes user account and associated data from Supabase.

**Local data (no account needed):**
- Preferences (dark mode, font size, language) — stored in device localStorage
- Recent pages visited — stored in device localStorage
- Adhkar / tasbih counters — stored in device localStorage

**No financial data, no health data, no contacts, no photos are collected.**

---

## Third-Party Services

| Service | Purpose | Data sent |
|---------|---------|-----------|
| Supabase | Database & Authentication | Email, user ID |
| Anthropic API | AI Assistant feature (`/assistant`) | User's chat messages (optional feature) |
| Upstash Redis | Rate limiting (server-side) | Anonymized request metadata |

**No advertising SDKs. No analytics SDKs. No tracking.**

---

## Demo Account (for Review)

If the reviewer needs to test logged-in features:

- **Email:** Majlisilm.app@gmail.com  
- **Password:** *(provided separately via App Review Notes field in App Store Connect)*

Logged-in features include: submitting content suggestions, saving learning progress, and accessing the personal vault.

*Note: Most content (Quran, adhkar, prayer times, hadith, lessons) is fully accessible without login.*

---

## Test Notes

1. The app requires an internet connection for lesson streaming and database content.
2. Prayer times are calculated locally using the `adhan` npm library — no server request needed.
3. The Qibla page requests location permission. On simulator, location can be set to "Kuwait City" (29.3759° N, 47.9774° E) for testing.
4. The AI assistant (`/assistant`) requires an active Anthropic API connection.
5. The app is in Arabic (RTL layout). All user-facing text is in Arabic.

---

## Known Limitations

- Icon assets are placeholder — final design assets will be provided before release.
- Android build is configured but this submission is iOS only.
