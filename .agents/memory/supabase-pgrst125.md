---
name: Supabase PGRST125 "Invalid path specified in request URL"
description: What it means when every Supabase request returns PGRST125, and how to diagnose
---

# PGRST125 "Invalid path specified in request URL"

When **every** Supabase REST/auth request returns
`{"code":"PGRST125","message":"Invalid path specified in request URL"}`
(including the public `/auth/v1/settings` endpoint and normal table queries),
the project's backend services (PostgREST + GoTrue) are **not serving** —
almost always because the **project is paused/inactive** (free tier pauses
after ~1 week idle) or was deleted/restored.

**Why it's not a code bug:** the Cloudflare edge gateway stays up even when
the project is paused — bare host returns the standard `401 "No API key found"`,
and CORS `OPTIONS` preflight returns `200`. Only *routed* requests (with a valid
apikey) hit the dead backend and get PGRST125.

## Fast diagnosis (no secrets printed)
1. Decode anon JWT payload → check `ref` matches the URL host ref, `role`, `exp`.
   Mismatched ref or expired key is the other common cause.
2. `GET {url}/auth/v1/settings` with apikey — on a LIVE project this returns
   200 JSON. PGRST125 here = backend down → project paused.
3. Bare host (no key) returning `401 "No API key found"` confirms the gateway
   itself is alive (rules out network/DNS).

**Fix:** user must restore/unpause the project in the Supabase dashboard
(or recreate it). Cannot be fixed from app code.

## Unrelated defensive fix worth keeping
Strip trailing slash from the URL before createClient:
`(env.URL||"").trim().replace(/\/+$/,"")` — a trailing slash produces
`//auth/v1/signup` which independently breaks requests.
