# Auth dashboard changes — REQUIRES_EXPLICIT_APPROVAL

These cannot be applied via SQL migrations from this repo. Operator must confirm in Supabase Dashboard for project `ngmvmlulzacrlicuagyp` after Staging proof.

| Setting | Action | Status |
|---|---|---|
| Leaked Password Protection (HaveIBeenPwned) | Enable | **PENDING APPROVAL** |
| Password policy (min length / complexity) | Review + tighten if weak | **PENDING APPROVAL** |
| Refresh token reuse / session lifetime | Review Auth → Sessions | **PENDING APPROVAL** |
| User enumeration (error messages on signup/login) | Prefer generic errors | **PENDING APPROVAL** |
| Redirect URLs allowlist | Restrict to production + known Preview | **PENDING APPROVAL** |
| MFA for admin accounts | Enforce TOTP for admin/owner | **PENDING APPROVAL** |

**Hard rule:** Admin privilege must come from `profiles` / `governance_user_roles` (and `is_admin()`), never from `user_metadata`.

**Extensions (`pg_trgm`, `vector`):** Move out of `public` only after dependency inventory + Staging EXPLAIN parity. Do not move blindly in Production.
