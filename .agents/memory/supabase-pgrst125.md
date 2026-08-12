---
name: Supabase PGRST125 "Invalid path specified in request URL"
description: Real cause is usually a path baked into the URL env value; how to diagnose
---

# PGRST125 "Invalid path specified in request URL"

When **every** Supabase REST/auth request returns
`{"code":"PGRST125","message":"Invalid path specified in request URL"}`
(including the public `/auth/v1/settings` endpoint and normal table queries),
the requests are hitting a malformed path.

## Most common cause (confirmed in this project)
The `SUPABASE_URL` env/secret contained a **path**, e.g.
`https://xxx.supabase.co/rest/v1/` instead of the bare origin
`https://xxx.supabase.co`. supabase-js appends `/rest/v1` and `/auth/v1`
itself, so the baked-in path produced URLs like
`.../rest/v1//auth/v1/signup` → PGRST125 for *all* calls.

**Stripping only the trailing slash is NOT enough** — it leaves `/rest/v1`.
Extract the origin: `new URL(raw).origin` (fallback `.replace(/\/+$/,"")`).

## Fast diagnosis (no secrets printed)
1. `console.log(JSON.stringify(raw_url))` — reveals hidden path/trailing slash/whitespace.
   (The project URL is non-sensitive; the anon key must NOT be printed.)
2. Decode anon JWT payload → check `ref` matches URL host ref, `role`, `exp`.
3. Probe the **canonical bare origin** directly: `GET {origin}/auth/v1/settings`
   with apikey → 200 JSON on a healthy project. If that works but the app
   fails, the env URL is malformed, not the project.
4. Bare host (no key) returning `401 "No API key found"` = gateway alive.

**Why:** URL env values are easy to paste with a `/rest/v1/` suffix copied from
the Supabase dashboard's API page. Always normalize to origin in code so a
wrong env value can't break every request.
