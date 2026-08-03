# Post-Submission Tracking

Materials for tracking Google Play / App Store review after upload.

## Immediate action when a store responds

1. Paste the reviewer message into `STORE_REJECTION_LOG.md`.
2. Update `SUBMISSION_STATUS.md` (`WAITING FOR REVIEW` / `Rejected` / `Approved`).
3. Classify severity via `hotfix/HOTFIX_DECISION_TREE.md`.
4. If rejected, pick a template from `rejection_responses/`.
5. Apply minimal fix only if needed; bump build; run release checks.
6. Resubmit and log the action.

## Folders

- `google_play/` — Play Console tracker
- `app_store/` — App Store Connect / TestFlight tracker
- `rejection_responses/` — reply templates
- `hotfix/` — decision tree + v1.0.1 notes
- `launch/` — launch announcement drafts
