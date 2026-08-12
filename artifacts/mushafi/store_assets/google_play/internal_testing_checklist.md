# Google Play Internal Testing Checklist

## Before Upload

- [ ] Run `./scripts/release_check.sh`.
- [ ] Confirm Quran integrity check passes.
- [ ] Confirm `version` in pubspec.yaml is correct.
- [ ] Confirm Android package name is final (`com.mushafi.mushafi`).
- [ ] Confirm app icon is final.
- [ ] Confirm app label is final.
- [ ] Confirm privacy policy URL is publicly accessible.
- [ ] Confirm Data Safety draft reviewed.

## Build

```bash
flutter build appbundle --release
```

## Internal Testing

- [ ] Upload AAB to Internal testing.
- [ ] Add testers.
- [ ] Install from Google Play testing link.
- [ ] Test app startup.
- [ ] Test onboarding.
- [ ] Test Quran integrity screen.
- [ ] Test Tasmee3 session with microphone.
- [ ] Test microphone denied path.
- [ ] Test server disabled path.
- [ ] Test server enabled path if available.
- [ ] Test PDF creation.
- [ ] Test reminders.
- [ ] Test offline dashboard.
- [ ] Test privacy screens.
- [ ] Test release build crash-free startup.

## Google Play Declarations

- [ ] Data Safety completed.
- [ ] App Access completed.
- [ ] Ads declaration completed.
- [ ] Content rating completed.
- [ ] Target audience completed.
- [ ] Sensitive permissions reviewed.
- [ ] Privacy policy URL added.
