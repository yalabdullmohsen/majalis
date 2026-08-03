# App Store Privacy Answers Draft

Important:
This is a draft. The publisher must verify final App Store Connect answers based on actual app behavior and third-party SDKs.

## Data Collection

### Audio Data

Collected:
- Only when the user starts a recitation session.

Linked to user:
- No, unless the app adds accounts or uploads audio with user identifiers.

Used for tracking:
- No.

Purpose:
- App functionality.

Uploaded:
- No by default.
- Possible only if advanced server recognition is enabled and the user allows audio upload.

### User Content

Possible:
- Recitation audio may be considered user content if uploaded to a server.

Purpose:
- App functionality.

### Usage Data

If the app stores local statistics:
- Session count.
- Accuracy summaries.
- Streaks.
- Goal progress.

This is local by default and not collected off-device unless analytics/cloud sync is added.

### Identifiers

If no analytics, ads, account system, or device IDs are used:
- Do not declare identifiers collected.

If crash reporting or analytics SDKs are added:
- Update this section.

## Tracking

The app should answer "No" to tracking if:
- It does not link user/device data with third-party data for advertising or measurement.
- It does not share user data with data brokers.
- It does not use advertising identifiers.

If any advertising/analytics SDK is added, re-evaluate.

## Privacy Policy URL

A public privacy policy URL is required for App Store submission.
Use `store_assets/legal/privacy_policy_web.md` as the basis for a hosted web page.

## SDK scan note (2026-08-04)

No analytics, advertising, or tracking SDKs detected in `pubspec.yaml` at time of review.
Local on-device stats only. Update App Privacy answers if SDKs are added later.
