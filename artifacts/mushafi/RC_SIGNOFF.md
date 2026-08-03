# Release Candidate Sign-off

## Version

`1.0.0+1`

## Sign-off Checklist

### Engineering

- [x] flutter analyze passed.
- [x] flutter test passed.
- [x] backend pytest passed.
- [x] release_check passed.
- [x] No known crash path.
- [x] No blocking TODO/FIXME.
- [x] fallback speech_to_text remains available.

### Quran Content

- [x] Quran asset check passed.
- [x] Quran source reviewed.
- [x] Quran text is not AI-generated.
- [x] Quran text is not modified by runtime logic.
- [x] Quran limitations page exists.

### Privacy

- [x] Audio upload disabled by default.
- [x] User consent required for server upload.
- [x] Privacy policy exists.
- [x] Diagnostics redacts API key.
- [x] Diagnostics contains no audio.
- [x] Diagnostics contains no Quran text.

### Product

- [ ] Onboarding reviewed.
- [ ] Dashboard reviewed.
- [ ] Tasmee3 screen reviewed.
- [ ] Results screen reviewed.
- [ ] Support screen reviewed.
- [ ] About screen reviewed.
- [x] Store metadata reviewed. *(draft materials present and claims-safe)*

### Release Manager

Name: Cursor Release Manager
Date: 2026-08-04
Decision:
- [ ] Approved for internal testing
- [ ] Approved for store submission
- [x] Rejected, fixes required

Notes:

```text
Engineering and draft store materials are ready. Rejected for upload because:
- Android APK/AAB could not be built (Android SDK missing).
- iOS release/archive unavailable (CocoaPods missing).
- Privacy Policy URL not hosted publicly.
- Device smoke tests not completed.

Next: install Android SDK → build AAB/APK → smoke → host Privacy URL →
upload Play Internal testing → then re-sign as Approved for internal testing.
```
