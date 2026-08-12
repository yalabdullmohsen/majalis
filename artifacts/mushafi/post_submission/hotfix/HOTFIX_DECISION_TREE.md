# Hotfix Decision Tree

## Step 1: Classify Issue

### S0 Critical

- App does not start.
- Quran file broken.
- Audio uploaded without consent.
- Crash on recitation start.

Action:

- Immediate hotfix.
- Pause rollout if possible.

### S1 High

- Microphone broken on many devices.
- Result screen crashes.
- Privacy disclosure mismatch.
- Store rejection for privacy.

Action:

- Hotfix within 24-48 hours.

### S2 Medium

- UI issue.
- PDF issue on some devices.
- Reminder issue.
- Confusing message.

Action:

- Include in next patch if not blocking.

### S3 Low

- Copy improvement.
- Minor layout polish.
- Documentation update.

Action:

- Backlog.

## Step 2: Decide

- [ ] Hotfix now.
- [ ] Patch later.
- [ ] Documentation only.
- [ ] No action.

## Step 3: Version

For first hotfix:

```yaml
version: 1.0.1+2
```

## Step 4: Checks

Before hotfix submission:

```bash
dart run scripts/check_quran_asset.dart
flutter analyze
flutter test
cd server/tasmee3_asr
python -m pytest tests -q
```

Then:

```bash
./scripts/release_check.sh
```

## Step 5: Constraints

- Do not add features.
- Do not modify Quran text.
- Do not enable audio upload / WebSocket / PCM by default.
- Keep speech_to_text fallback.
- Update CHANGELOG + SUBMISSION_STATUS + STORE_REJECTION_LOG.
