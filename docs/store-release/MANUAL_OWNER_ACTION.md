# MANUAL_OWNER_ACTION — Store 1.0.0

**STORE_SOURCE_COMMIT:** `ed5320b1f23c7b21d230c0698e86ce5cb8731ebc`  
**Status:** Store remains **HOLD** until items below close with evidence.

| ID | Action | Why agent cannot close | Evidence needed |
|---|---|---|---|
| OWN-01 | Approve or permanently exclude QPC store redistribution | Legal | Written QUL/KFGQPC / counsel note |
| OWN-02 | Approve specific adhan CAF/MP3 files **or** confirm exclusion from Xcode/Android resources | Legal + signing machine | Signed list + Archive inspection |
| OWN-03 | Run device matrix on physical iPhone + Android | No device in this environment | `DEVICE_NOTIFICATION_MATRIX.md` rows WORKING |
| OWN-04 | Supabase: backup → approve → apply security SQL / RLS | `REQUIRES_EXPLICIT_APPROVAL` | Checklist signed |
| OWN-05 | Supabase Auth: MFA for admins + leaked-password (plan-dependent) | Dashboard only | Screenshots + date |
| OWN-06 | Confirm Bundle ID `com.yousef.majlisilm` vs rename | Creates new store app if changed | `STORE_IDENTITY_DECISION.md` signed |
| OWN-07 | Provide signing certs/profiles on CI secrets (never in git) | Secrets | CI green Archive/AAB |
| OWN-08 | Decide deployment policy A vs B | Docs conflict | `DEPLOYMENT_DECISION.md` signed |
| OWN-09 | Final store submission click | Owner only | App Store / Play consoles |

Do **not** mark Store GO while any OWN-01…OWN-03 / OWN-06 / OWN-07 is open.
