# Device Runbook — Background Quran Audio (Guideline 2.5.4)

**Path:** A (keep `UIBackgroundModes = audio`)  
**Feature:** Continuous Quran tilawa via Mushaf reader + `AudioEngine`  
**Devices:** iPhone + **iPad Air 11-inch (or equivalent)** — real device required (not Simulator alone)

## Preconditions

1. Install the **new** TestFlight / Archive build that includes:
   - `MajlisPlaybackAudioPlugin` Now Playing + background reassert
   - `AudioEngine` awaiting `AVAudioSession` before `play()`
2. Network available (or offline ayah cache if testing offline).
3. Volume up; Do Not Disturb off for Control Center visibility.

## Happy path (Apple reviewer path)

1. Open **سُنّة**.
2. Tap **المصحف** (or navigate to `/mushaf`).
3. Tap an ayah → open ayah actions → **تشغيل التلاوة** (or open the audio dock / play control).
4. Confirm audio starts in-app.
5. Press **Home** (or swipe up) → leave app in background.
6. **Pass:** Tilawa continues for **≥ 60 seconds**.
7. Open **Control Center** → **Pass:** Now Playing shows surah/ayah + reciter; pause/play works.
8. **Lock** the device → **Pass:** audio continues; Lock Screen shows Now Playing; pause/play/next/prev work.
9. Unlock and return to the app → **Pass:** same surah/ayah and playing/paused state preserved.
10. Let the ayah end → **Pass:** next ayah starts (gapless path) without killing background session.

## Interruptions & routes

11. While playing in background: take a phone call or trigger a Siri interruption → after call, resume if iOS sends `shouldResume`.
12. Connect/disconnect Bluetooth headphones → unplug should pause (expected); reconnect and tap play.
13. Switch audio route (speaker ↔ headphones) → session remains `.playback`.

## Offline (optional)

14. With previously cached ayah audio, enable Airplane Mode → play → background → confirm continuation if assets are local.

## Failure criteria (do **not** ship)

- Audio stops immediately on Home or Lock.
- No Now Playing / Control Center entry while audio is playing.
- Silent audio loop, empty MP3, or keep-alive timer with no real tilawa.
- Review Notes missing the steps above.

## Archive verification (mandatory before upload)

```bash
# After Xcode Archive → Show in Finder → Reveal .app inside .xcarchive
plutil -p "Path/To/Sunnah.app/Info.plist" | grep -A5 UIBackgroundModes
# Expect: audio + remote-notification
```

Do **not** rely on the source `Info.plist` alone — inspect the archived `.app`.

## Sign-off

| Check | Device | Build | Tester | Result |
|-------|--------|-------|--------|--------|
| Home ≥60s | iPad | | | |
| Lock + Now Playing | iPad | | | |
| Control Center | iPad | | | |
| Archive contains `audio` | — | | | |
