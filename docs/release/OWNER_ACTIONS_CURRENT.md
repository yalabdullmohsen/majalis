# OWNER ACTIONS CURRENT — سُنّة

**Updated:** 2026-09-21 (Remediation PR-1)  
**Rule:** Agents must **not** execute these. Record only.

| action | why | evidence | exact system | consequence if not done | safe rollback |
|---|---|---|---|---|---|
| Approve Bundle ID for store builds | Binary identity must match Apple/Google accounts | `STORE_100_PERCENT_READINESS.md` unchecked | Apple Developer / Play Console | Cannot ship store binary | Keep current non-store IDs |
| Provide signing certificates / profiles | Required for Archive/AAB | same | Xcode / Play App Signing | No TestFlight/AAB | Do not embed secrets in repo |
| App Store Connect / Play credentials for upload | Human-operated upload | same | ASC / Play Console | No store submission | Revoke tokens if leaked |
| Decide CAF / adhan asset exclusion for store binary | Unresolved redistribution risk for non-CC0 packs | `STORE_ASSET_MANIFEST.md` · `LICENSE_RISKS.md` | Store RC build pipeline | HOLD remains | Revert to system-default sounds |
| Written QPC / QUL redistribution permission | Fonts in binary need clearance | `LICENSE_RISKS.md` · `docs/LICENSES.md` | KFGQPC/QUL license desk | Must ship without disputed fonts or stay HOLD | Strip fonts from store flavor |
| Written Hisn Muslim edition permission or replace corpus | Edition rights | `LICENSE_RISKS.md` | Rights holder | Remove/replace Hisn-derived packing | Feature-flag off |
| everyayah / mp3quran offline policy | ToS unsigned for bundling | `LICENSE_RISKS.md` | Provider ToS | Keep live streaming only | Kill-switch audio |
| Approve or permanently reject madinah adhan rights | `rights_uncertain` | `prayer-audio-rights-registry.ts` | Legal/owner | Remains hidden from production UI | Keep `approvedForProduction: false` |
| Approve or keep rejected qatami adhan | Celebrity/name risk | same | Legal/owner | Remains blocked | Keep rejected |
| Apply hosted SQL migrations (staging→prod) with backup | Schema/runtime jobs | `docs/REQUIRES_EXPLICIT_APPROVAL.md` | Supabase SQL Editor / approved CLI | Some `/api/readyz` paths may 503 | Use documented `*_ROLLBACK.sql` |
| Enable Auth MFA for admin accounts | Admin security | same | Supabase Auth dashboard | Elevated account risk | Disable MFA only via dashboard |
| Enable leaked-password protection | Auth hardening | same | Supabase Auth dashboard | Weaker password policy | Toggle off in dashboard |
| Confirm Vercel production secrets set | Assistant/API server needs | Vercel project settings | Vercel | Feature degradation, not silent license bypass | Rotate/remove secrets |
| Pin Store RC commit for Archive/AAB | Tip `3ba020f2` ≠ automatic store pin | This truth file + store readiness | Release process | Wrong binary shipped | Rebuild from recorded pin only |
| Device matrix sign-off (prayer + mushaf) | Cannot be simulated fully | Device runbooks (later waves) | Physical devices | DEVICE_REQUIRED rows stay open | Re-test after fixes |
| Final App Store GO / WITHDRAW | Legal+product authority | Store readiness | Owner | No submission | Withdraw build in ASC |

## Not owner-blocked (agents may continue)

- Truth/docs sync  
- License **guards** and manifests (without flipping uncertain→approved)  
- Hiding `source_missing` from public UI  
- Publication guards for DRAFT/NEEDS_SOURCE  
- Admin v3 build behind `/admin`  
- Deep-link fixes, performance within budgets  
- Device **runbooks** and CI contract tests  

## Contact path

Owner executes dashboard/CLI steps; agent updates evidence checkboxes only after owner provides confirmation artifact (screenshot, ticket id, or signed note).
