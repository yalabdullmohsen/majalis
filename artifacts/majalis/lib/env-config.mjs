/**
 * Central environment configuration — single source of truth for all services.
 */

function pick(...keys) {
  for (const k of keys) {
    const v = String(process.env[k] || "").trim();
    if (v) return v;
  }
  return "";
}

export function getEnvConfig() {
  const supabaseUrl = pick("SUPABASE_URL", "VITE_SUPABASE_URL");
  const serviceRoleKey = pick("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = pick("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");
  const cronSecret = pick("CRON_SECRET", "VITE_CRON_SECRET");
  const adminSecret = pick("ADMIN_API_SECRET", "CRON_SECRET", "VITE_CRON_SECRET");
  const openaiKey = pick("OPENAI_API_KEY");
  const anthropicKey = pick("ANTHROPIC_API_KEY");

  return {
    supabaseUrl,
    serviceRoleKey,
    anonKey,
    cronSecret,
    adminSecret,
    openaiKey,
    anthropicKey,
    nodeEnv: process.env.NODE_ENV || "development",
  };
}

export function getEnvStatus() {
  const env = getEnvConfig();
  return {
    SUPABASE_URL: Boolean(env.supabaseUrl),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(env.serviceRoleKey),
    SUPABASE_ANON_KEY: Boolean(env.anonKey),
    CRON_SECRET: Boolean(env.cronSecret),
    OPENAI_API_KEY: Boolean(env.openaiKey),
    ANTHROPIC_API_KEY: Boolean(env.anthropicKey),
  };
}

export function validateCronEnv() {
  const env = getEnvConfig();
  const missing = [];
  if (!env.supabaseUrl) missing.push("SUPABASE_URL");
  if (!env.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.cronSecret && env.nodeEnv === "production") missing.push("CRON_SECRET");
  return { ok: missing.length === 0, missing, env: getEnvStatus() };
}

export function validateCronAuth(req) {
  if (req.headers["x-vercel-cron"] === "1") return true;
  const env = getEnvConfig();
  if (!env.cronSecret) return env.nodeEnv !== "production";
  const auth = String(req.headers.authorization || "").replace("Bearer ", "").trim();
  return auth === env.cronSecret;
}

export function validateAdminAuth(req) {
  if (req.headers["x-vercel-cron"] === "1") return true;
  const env = getEnvConfig();
  if (!env.adminSecret) return env.nodeEnv !== "production";
  const auth = String(req.headers.authorization || "").replace("Bearer ", "").trim();
  return auth === env.adminSecret;
}
