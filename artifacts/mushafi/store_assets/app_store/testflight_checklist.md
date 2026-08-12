# App Store TestFlight Checklist

## Before Archive

- [ ] Run `./scripts/release_check.sh`.
- [ ] Confirm Quran integrity check passes.
- [ ] Confirm iOS Bundle ID is final (`com.mushafi.mushafi`).
- [ ] Confirm version and build number are correct (`1.0.0+1`).
- [ ] Confirm App Store privacy answers reviewed.
- [ ] Confirm privacy policy URL is public.
- [ ] Confirm Info.plist permission strings are clear.
- [ ] Confirm microphone permission text is accurate.
- [ ] Confirm speech recognition permission text is accurate if used.

## Build

```bash
flutter build ios --release
```

Then archive using Xcode if required.

## TestFlight Testing

- [ ] Upload build to TestFlight.
- [ ] Add internal testers.
- [ ] Install on iPhone real device.
- [ ] Test onboarding.
- [ ] Test microphone permission.
- [ ] Test denied microphone path.
- [ ] Test recitation session.
- [ ] Test result screen.
- [ ] Test PDF sharing.
- [ ] Test reminders.
- [ ] Test privacy screens.
- [ ] Test offline behavior.
- [ ] Test fallback when server is disabled.
- [ ] Test crash-free startup.

## App Review

- [ ] App Review Notes added.
- [ ] Demo steps included.
- [ ] Privacy policy URL added.
- [ ] App privacy labels completed.
- [ ] No misleading claims.
