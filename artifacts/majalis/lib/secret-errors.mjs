/**
 * Clear API responses when required secrets are missing — never opaque 500s.
 */
import { getEnvStatus } from "./env-config.mjs";

export function getMissingSecrets(keys) {
  const env = getEnvStatus();
  return keys.filter((k) => !env[k]);
}

export function buildMissingSecretPayload(missing, context = "") {
  const primary = missing[0] || "UNKNOWN_SECRET";
  return {
    ok: false,
    error: "missing_secret",
    code: `Missing ${primary}`,
    message: `Missing ${missing.join(", ")}${context ? ` — ${context}` : ""}`,
    missing,
    fix: "Add the secret in Vercel → Settings → Environment Variables (Production), then redeploy.",
    verify: "Open /admin/platform/health — the secret should show as configured.",
  };
}

export function requireSecrets(keys, context) {
  const missing = getMissingSecrets(keys);
  if (missing.length === 0) return null;
  return buildMissingSecretPayload(missing, context);
}

export function requireServiceRole(context) {
  return requireSecrets(["SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_URL"], context);
}

export function requireDatabaseUrl(context) {
  const env = getEnvStatus();
  const hasDb =
    env.DATABASE_URL ||
    env.POSTGRES_URL ||
    env.POSTGRES_PASSWORD ||
    env.SUPABASE_ACCESS_TOKEN;
  if (hasDb) return null;
  return buildMissingSecretPayload(["DATABASE_URL"], context || "Required for SQL migrations");
}
