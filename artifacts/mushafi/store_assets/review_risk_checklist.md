# Store Review Risk Checklist

## Privacy Risks

- [ ] Privacy policy URL is live.
- [ ] Audio upload behavior matches privacy disclosure.
- [ ] Data Safety / Privacy labels match actual SDKs.
- [ ] No hidden analytics or tracking SDKs.
- [ ] API keys are not visible.
- [ ] Screenshots do not show private data.

## Religious Content Risks

- [ ] No claim of religious authority.
- [ ] No claim of certified tajweed correction.
- [ ] No claim of perfect accuracy.
- [ ] Disclaimer is visible in app.
- [ ] Quran source page is available.
- [ ] Quran integrity check exists.

## Permission Risks

- [ ] Microphone purpose is clear.
- [ ] Notifications purpose is clear.
- [ ] Speech recognition purpose is clear if used.
- [ ] Permissions are requested in context.

## Technical Risks

- [ ] App works without server.
- [ ] App works without internet for local features.
- [ ] App handles denied microphone.
- [ ] App handles invalid endpoint.
- [ ] App handles missing Quran file with clear error.

## Permissions Observed (Android)

Present and reviewed for intended features:

- `INTERNET` — optional advanced ASR server
- `RECORD_AUDIO` — recitation sessions
- `POST_NOTIFICATIONS` — reminders
- `RECEIVE_BOOT_COMPLETED` — reschedule reminders
- `VIBRATE` — notification feedback
- `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` — timed reminders
- `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_MEDIA_PLAYBACK` — audio playback support

## SDK Review Note

No analytics, advertising, or tracking SDKs detected in dependencies at time of review.
Local on-device stats service only. Re-check before every store submission.
