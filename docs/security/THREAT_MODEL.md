# THREAT MODEL — abbreviated (2026-07-29)

## Assets

- User accounts / sessions
- Service role / DB URL / Cron secret / AI keys
- Published scholarly content integrity
- Private user data (bookmarks, progress, chat)

## Top threats (current evidence)

| Threat | Likelihood | Impact | Control gap |
|---|---|---|---|
| Auto-merge of unreviewed code | High (workflow exists) | Critical | Disable auto-merge; CODEOWNERS; branch protection |
| RLS tables with no policies | High (claimed 50) | Critical | Policy matrix + tests |
| SECURITY DEFINER executable by anon | High (claimed) | Critical | REVOKE + invoker where possible |
| Runtime schema mutation | Medium | Critical | Remove DDL from cron/API |
| AI spend / credit storm | High (prod logs) | High | Durable circuit + fail-closed |
| Stale SW / wrong JS MIME on iOS | Medium | High | Cache headers + SW update |
| Cross-user data access | Unknown until tested | Critical | Role integration tests |

## Non-goals this sprint

- Deleting unused tables
- Changing Bundle ID / signing
- Production data deletion
