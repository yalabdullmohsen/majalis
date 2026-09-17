# Deployment Decision — docs vs behavior

**Conflict:** `DEPLOYMENT.md` describes production/manual paths; `vercel.json` + workflows + AGENTS describe **main → automatic production**.

## Options

| Option | Behavior | Auto-merge | Rollback | Release approval |
|---|---|---|---|---|
| A | main → automatic production (current machine behavior for majalis) | Fast | Revert commit / redeploy previous | Implicit via merge gates |
| B | main → preview; `production` branch → manual live | Slower | Promote/demote branch | Explicit promote |

**Agent posture:** do **not** change Production Branch without owner approval.  
**Store builds** may proceed from a pinned commit regardless.  
**Status:** **OWNER_ACTION** OWN-08.
