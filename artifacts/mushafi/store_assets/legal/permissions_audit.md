# Permissions Audit Notes

Date: 2026-08-04

## Android (`AndroidManifest.xml`)

| Permission | Why |
|---|---|
| INTERNET | Optional advanced ASR / configured server |
| RECORD_AUDIO | Recitation sessions |
| POST_NOTIFICATIONS | Local reminders |
| RECEIVE_BOOT_COMPLETED | Reschedule reminders after reboot |
| VIBRATE | Notification feedback |
| SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM | Timed reminder scheduling |
| FOREGROUND_SERVICE / FOREGROUND_SERVICE_MEDIA_PLAYBACK | Audio playback support |

No unused advertising/location/contacts permissions found.

## iOS (`Info.plist`)

| Key | Status |
|---|---|
| NSMicrophoneUsageDescription | Present and Arabic, context-specific |
| NSSpeechRecognitionUsageDescription | Present (on-device fallback) |
| NSUserNotificationUsageDescription | Present |

## Recommendation

Before production, confirm in Play Console that exact alarm / foreground service declarations match actual reminder and playback behavior.
