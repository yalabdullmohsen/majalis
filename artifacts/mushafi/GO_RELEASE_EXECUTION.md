# GO Release Execution

## Version

`1.0.0+1`

## Release Candidate

RC1

## Execution Date

2026-08-04

## Release Owner

Cursor Release Manager (automated execution on `cursor/mushafi-flutter-app`)

## Release Status

Choose one:

- [x] Preparing
- [ ] Internal Testing
- [ ] TestFlight
- [ ] Store Review
- [ ] Released
- [ ] Paused
- [ ] Rolled Back

## Final Release Rules

- لا تضف ميزات جديدة.
- لا تغيّر ملف القرآن.
- لا تفعل رفع الصوت للخادم افتراضيا.
- لا تفعل WebSocket افتراضيا.
- لا تفعل Native PCM افتراضيا.
- لا تغيّر نصوص الخصوصية بدون تحديث المتاجر.
- لا تضف SDK جديد بدون تحديث Data Safety و App Privacy.
- إصلاحات حرجة فقط مسموحة.

## Final Checks

- [x] Quran asset check passed.
- [x] flutter pub get passed.
- [x] flutter analyze passed.
- [x] flutter test passed.
- [x] backend pytest passed.
- [x] quick_check passed.
- [x] release_check passed.

Notes:

```text
All automated gates passed on 2026-08-04.
flutter test: 65 passed.
pytest: 7 passed.
```

## Version Confirmation

- [x] pubspec.yaml version = 1.0.0+1
- [x] CHANGELOG.md contains 1.0.0+1
- [x] Store release notes / metadata match 1.0.0+1 (`store_assets/app_metadata.md`)

## Safe Defaults

- [x] Audio upload disabled by default.
- [x] HTTP endpoint empty by default.
- [x] WebSocket endpoint empty by default.
- [x] WebSocket disabled by default.
- [x] Native PCM disabled by default.
- [x] Debug diagnostics disabled by default.
- [x] App works without ASR server. *(defaults → speech_to_text fallback)*

## Android APK Build

Command:

```bash
flutter build apk --release
```

Result:

- [ ] Success
- [x] Failed

Output:

`build/app/outputs/flutter-apk/app-release.apk` — **not produced**

Notes:

```text
No Android SDK / ANDROID_HOME on this machine.
Install Android SDK, set ANDROID_HOME, then rebuild.
```

## Android App Bundle Build

Command:

```bash
flutter build appbundle --release
```

Result:

- [ ] Success
- [x] Failed

Output:

`build/app/outputs/bundle/release/app-release.aab` — **not produced**

Notes:

```text
Blocked by missing Android SDK (same as APK).
```

## iOS Build

Command:

```bash
flutter build ios --release
```

Result:

- [ ] Success
- [ ] Failed
- [x] Not available on this machine

Notes:

```text
Xcode present, but CocoaPods not installed / not in valid state.
Install CocoaPods, run pod install, then archive via Xcode.
Does not block Android-first release once Android SDK is available.
```

## Android Smoke Test

- [ ] App opens.
- [ ] Onboarding works.
- [ ] Dashboard works.
- [ ] Quran integrity screen works.
- [ ] Tasmee3 screen works.
- [ ] Microphone denied path works.
- [ ] Microphone allowed path works.
- [ ] Short recitation session works.
- [ ] Result screen works.
- [ ] PDF works.
- [ ] Support screen works.
- [ ] Diagnostics copy works.
- [ ] Reset local data works.
- [ ] Offline startup works.
- [ ] Audio upload remains disabled by default.

Device:

```text
Not run — no release APK available in this environment.
```

Notes:

```text
Complete smoke after APK/AAB is built on a machine with Android SDK.
Use SMOKE_TEST_CHECKLIST.md and RC_TEST_PLAN.md.
```

## Google Play Internal Testing Upload

Required files:

- AAB:
  `build/app/outputs/bundle/release/app-release.aab`

Checklist:

- [ ] App bundle uploaded.
- [ ] Internal testing track selected.
- [ ] Testers added.
- [ ] Release notes added.
- [ ] Data Safety draft reviewed.
- [ ] Permissions reviewed.
- [ ] Privacy policy URL added.
- [ ] App access completed.
- [ ] Content rating completed.
- [ ] Target audience completed.
- [ ] Internal testing release submitted.

Release notes:

```text
Initial release of Mushafi for Quran recitation review.
Approximate technical feedback for memorization practice.
Audio upload disabled by default. Quran text is bundled, not AI-generated.
```

Testing link:

```text
TODO — after Internal testing release is published.
```

## App Store TestFlight Upload

Checklist:

- [ ] iOS archive created.
- [ ] Build uploaded to App Store Connect.
- [ ] Internal testers added.
- [ ] App Review Notes added.
- [ ] Privacy policy URL added.
- [ ] App Privacy answers reviewed.
- [ ] Microphone usage string reviewed.
- [ ] Speech recognition usage string reviewed if used.
- [ ] TestFlight build submitted.

Build number:

```text
1 (from 1.0.0+1) — not uploaded yet.
```

TestFlight notes:

```text
Initial TestFlight build for Mushafi Quran recitation review.
```

Status: **Not available** until CocoaPods + codesign + archive succeed.

## Privacy Policy URL

URL:

```text
TODO: Add hosted privacy URL
Source draft: store_assets/legal/privacy_policy_web.md
```

- [ ] URL opens without login.
- [ ] URL matches app behavior.
- [ ] URL mentions microphone.
- [ ] URL mentions optional audio upload.
- [ ] URL mentions local storage.
- [ ] URL mentions Quran text is not AI-generated.
- [ ] URL mentions religious disclaimer.

Notes:

```text
Do not upload to stores until a public Privacy Policy URL is hosted.
Draft content is ready in store_assets/legal/privacy_policy_web.md.
```

## Google Play Data Safety

- [x] Audio data reviewed. *(draft)*
- [x] Local app activity reviewed. *(draft)*
- [x] User settings reviewed. *(draft)*
- [x] API key handling reviewed. *(draft)*
- [x] Third-party SDKs reviewed.
- [x] No analytics/ads SDKs unless declared. *(none detected)*
- [x] Audio upload optional and disclosed. *(draft)*
- [x] Data deletion explanation reviewed. *(draft)*

Notes:

```text
Reviewed store_assets/google_play/data_safety_draft.md against app behavior.
Console form not yet submitted (blocked on AAB + Privacy URL).
```

## App Store Privacy

- [x] Audio data reviewed. *(draft)*
- [x] User content reviewed. *(draft)*
- [x] Usage data reviewed. *(draft)*
- [x] Identifiers reviewed. *(draft)*
- [x] Tracking answer reviewed. *(draft)*
- [x] Third-party SDKs reviewed.
- [ ] Privacy policy URL added. *(needs hosted URL)*
- [x] Answers match actual app behavior. *(draft)*

Notes:

```text
Reviewed store_assets/app_store/privacy_answers_draft.md.
Final App Store Connect answers pending hosted Privacy URL + TestFlight.
```

## Third-party SDK Privacy Review

Detected SDKs:

```text
No firebase / analytics / crashlytics / ads / admob / facebook /
amplitude / mixpanel / sentry / bugsnag packages found in pubspec.

Relevant functional packages only (examples):
speech_to_text, record, just_audio, flutter_local_notifications,
pdf/printing, share_plus, flutter_secure_storage, package_info_plus.
```

- [x] No ads SDK detected.
- [x] No analytics SDK detected.
- [x] No crash reporting SDK detected.
- [x] If detected, privacy forms updated. *(N/A — none detected)*

## Claims Review

- [x] No absolute accuracy claims.
- [x] No religious ruling claims.
- [x] No certified tajweed claims.
- [x] Approximate feedback wording used.
- [x] Technical aid wording used.

Notes:

```text
Repo search found disclaimer/negation contexts only for marketing-sensitive
phrases. review_notes_final.md prepared for App Review.
```

## Blockers to GO

1. Android SDK missing → no APK/AAB.
2. CocoaPods missing → no iOS release/archive.
3. Privacy Policy URL not hosted publicly.
4. Device smoke test not executed.
5. Play Internal / TestFlight uploads not performed.

## Decision

- [ ] GO
- [x] NO-GO

Reason:

```text
Automated engineering gates are green and launch materials are prepared,
but release binaries, hosted Privacy URL, and internal-track uploads are
incomplete. Resume GO after Android SDK build + smoke + Privacy URL, then
upload AAB to Play Internal testing (Android-first).
```
