/**
 * Central environment configuration — single source of truth for all services.
 */

import { timingSafeEqual } from "node:crypto";

function pick(...keys) {
  for (const k of keys) {
    const v = String(process.env[k] || "").trim();
    if (v) return v;
  }
  return "";
}

function buildDatabaseUrlFromParts() {
  const password = pick("SUPABASE_DB_PASSWORD", "POSTGRES_PASSWORD", "DB_PASSWORD");
  const supabaseUrl = pick("SUPABASE_URL", "VITE_SUPABASE_URL");
  if (!password || !supabaseUrl) return "";
  try {
    const ref = new URL(supabaseUrl).hostname.split(".")[0];
    const region = pick("SUPABASE_REGION") || "us-east-1";
    return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
  } catch {
    return "";
  }
}

function safeEqual(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function getEnvConfig() {
  const supabaseUrl = pick("SUPABASE_URL", "VITE_SUPABASE_URL");
  const serviceRoleKey = pick("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = pick("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");
  const cronSecret = pick("CRON_SECRET", "VITE_CRON_SECRET");
  const adminSecret = pick("ADMIN_API_SECRET", "CRON_SECRET", "VITE_CRON_SECRET");
  const openaiKey = pick("OPENAI_API_KEY");
  const anthropicKey = pick("ANTHROPIC_API_KEY");
  const databaseUrl = pick(
    "DATABASE_URL",
    "SUPABASE_DB_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
  ) || buildDatabaseUrlFromParts();

  return {
    supabaseUrl,
    serviceRoleKey,
    anonKey,
    cronSecret,
    adminSecret,
    openaiKey,
    anthropicKey,
    databaseUrl,
    nodeEnv: process.env.NODE_ENV || "development",
    vercelEnv: process.env.VERCEL_ENV || "",
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
    DATABASE_URL: Boolean(env.databaseUrl),
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

/**
 * Extract cron secret from request headers.
 * Supports: Authorization Bearer, x-cron-secret, x-cron-auth
 */
export function extractCronSecretFromRequest(req) {
  const authHeader = String(req.headers?.authorization || req.headers?.Authorization || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return String(
    req.headers?.["x-cron-secret"] ||
    req.headers?.["x-cron-auth"] ||
    "",
  ).trim();
}

export function validateCronAuth(req) {
  // Vercel Cron — always trusted when header present
  if (req.headers?.["x-vercel-cron"] === "1") return true;

  const env = getEnvConfig();
  const configured = env.cronSecret;

  // Dev/local: allow unauthenticated when no secret configured
  if (!configured) {
    return env.nodeEnv !== "production";
  }

  const provided = extractCronSecretFromRequest(req);
  if (!provided) return false;

  return safeEqual(provided, configured);
}

export function validateAdminAuth(req) {
  if (req.headers?.["x-vercel-cron"] === "1") return true;

  const env = getEnvConfig();
  const configured = env.adminSecret;

  if (!configured) {
    return env.nodeEnv !== "production";
  }

  const provided = extractCronSecretFromRequest(req);
  if (!provided) return false;

  return safeEqual(provided, configured);
}
