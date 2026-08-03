# Google Play Data Safety Draft

Important:
This is a draft. The publisher must verify the final answers in Play Console based on the actual app behavior, SDKs, analytics, crash reporting, ads, and server configuration.

## Does the app collect or share user data?

Potentially yes, depending on enabled features.

## Data types potentially involved

### Audio

Collected:
- Only during a recitation session.
- Used for app functionality: recitation review.

Shared:
- No by default.
- Yes only if the user enables the advanced server-based recitation engine and allows audio upload.

Purpose:
- App functionality.

Required or optional:
- Optional. The user can avoid server upload and use local/on-device fallback where available.

### App activity

Possible:
- Recitation session history.
- Accuracy summaries.
- Review progress.
- Goals and streaks.

Stored:
- Locally on device by default.

Shared:
- No, unless the app later adds account sync or cloud backup.

Purpose:
- App functionality.

### User-provided settings

Possible:
- ASR endpoint.
- API key.
- Reminder settings.
- Goal settings.

Stored:
- Locally on device.
- API key should be stored in secure storage when available.

Shared:
- No, except the API key may be sent to the configured ASR server as Authorization header if the advanced server is enabled.

## Security practices

- Audio upload should use HTTPS in production.
- API key should not be logged.
- Temporary audio files should be deleted after processing.
- Users should be informed before audio upload.

## Data deletion

Local data can be cleared by:
- Clearing app data from device settings.
- Future app settings should include clear history/reset options if not already available.

## Notes for final Play Console answers

Before submission, verify:
- Any analytics SDKs.
- Crash reporting SDKs.
- Advertising SDKs.
- Third-party libraries.
- Whether server logs store any user data.
- Whether audio is retained server-side.
