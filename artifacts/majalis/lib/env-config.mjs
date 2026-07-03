/**
 * Production Hardening — Cron auth with HMAC, timestamp, replay protection, rotation.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function pick(...keys) {
  for (const k of keys) {
    const v = String(process.env[k] || "").trim();
    if (v) return v;
  }
  return "";
}

function buildDatabaseUrlFromParts() {
  const host = pick("POSTGRES_HOST", "PGHOST");
  let user = pick("POSTGRES_USER", "PGUSER") || "postgres";
  const password = pick("POSTGRES_PASSWORD", "PGPASSWORD", "SUPABASE_DB_PASSWORD", "DB_PASSWORD");
  const database = pick("POSTGRES_DATABASE", "PGDATABASE") || "postgres";
  const port = pick("POSTGRES_PORT", "PGPORT") || "6543";

  if (host && password) {
    if (!user.includes(".")) {
      const supabaseUrl = pick("SUPABASE_URL", "VITE_SUPABASE_URL");
      if (supabaseUrl) {
        try {
          user = `postgres.${new URL(supabaseUrl).hostname.split(".")[0]}`;
        } catch {
          /* keep user */
        }
      }
    }
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }
  return "";
}

export function syncDatabaseUrlEnv() {
  const url = pick(
    "DATABASE_URL",
    "SUPABASE_DB_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
  ) || buildDatabaseUrlFromParts();
  return url;
}

function safeEqual(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

const REPLAY_WINDOW_MS = 5 * 60 * 1000;
const seenCronNonces = new Map();
const cronRateBuckets = new Map();

function cronRateLimit(key, windowMs = 60_000, max = 120) {
  const now = Date.now();
  const entry = cronRateBuckets.get(key);
  if (!entry || now >= entry.resetAt) {
    cronRateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

function purgeOldNonces() {
  const cutoff = Date.now() - REPLAY_WINDOW_MS * 2;
  for (const [k, ts] of seenCronNonces) {
    if (ts < cutoff) seenCronNonces.delete(k);
  }
}

function getCronSecrets() {
  const primary = pick("CRON_SECRET", ...(process.env.NODE_ENV === "production" ? [] : ["VITE_CRON_SECRET"]));
  const previous = pick("CRON_SECRET_PREVIOUS");
  return [primary, previous].filter(Boolean);
}

export function getEnvConfig() {
  syncDatabaseUrlEnv();
  const supabaseUrl = pick("SUPABASE_URL", "VITE_SUPABASE_URL");
  const serviceRoleKey = pick("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = pick("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  const cronSecret = pick("CRON_SECRET", ...(isProd ? [] : ["VITE_CRON_SECRET"]));
  const cronSecretPrevious = pick("CRON_SECRET_PREVIOUS");
  const adminSecret = pick("ADMIN_API_SECRET", "CRON_SECRET", ...(isProd ? [] : ["VITE_CRON_SECRET"]));
  const openaiKey = pick("OPENAI_API_KEY");
  const anthropicKey = pick("ANTHROPIC_API_KEY");
  const databaseUrl = pick(
    "DATABASE_URL",
    "SUPABASE_DB_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
  ) || buildDatabaseUrlFromParts();
  const cronAllowedIps = pick("CRON_ALLOWED_IPS").split(",").map((s) => s.trim()).filter(Boolean);
  const telegramBotToken = pick("TELEGRAM_BOT_TOKEN");
  const telegramWebhookSecret = pick("TELEGRAM_WEBHOOK_SECRET");

  return {
    supabaseUrl,
    serviceRoleKey,
    anonKey,
    cronSecret,
    cronSecretPrevious,
    adminSecret,
    openaiKey,
    anthropicKey,
    databaseUrl,
    cronAllowedIps,
    telegramBotToken,
    telegramWebhookSecret,
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
    CRON_SECRET_PREVIOUS: Boolean(env.cronSecretPrevious),
    OPENAI_API_KEY: Boolean(env.openaiKey),
    ANTHROPIC_API_KEY: Boolean(env.anthropicKey),
    DATABASE_URL: Boolean(env.databaseUrl),
    UPSTASH_REDIS_REST_URL: Boolean(pick("UPSTASH_REDIS_REST_URL", "KV_REST_API_URL")),
    UPSTASH_REDIS_REST_TOKEN: Boolean(pick("UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN")),
    POSTGRES_URL: Boolean(pick("POSTGRES_URL")),
    POSTGRES_PASSWORD: Boolean(pick("POSTGRES_PASSWORD", "SUPABASE_DB_PASSWORD")),
    SUPABASE_ACCESS_TOKEN: Boolean(pick("SUPABASE_ACCESS_TOKEN", "SUPABASE_MANAGEMENT_TOKEN")),
    INSTAGRAM_GRAPH_ACCESS_TOKEN: Boolean(pick("INSTAGRAM_GRAPH_ACCESS_TOKEN")),
    INSTAGRAM_BUSINESS_ACCOUNT_ID: Boolean(pick("INSTAGRAM_BUSINESS_ACCOUNT_ID")),
    TELEGRAM_BOT_TOKEN: Boolean(pick("TELEGRAM_BOT_TOKEN")),
    TELEGRAM_WEBHOOK_SECRET: Boolean(pick("TELEGRAM_WEBHOOK_SECRET")),
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

function verifyHmacSignature(req, secrets) {
  const timestamp = String(req.headers?.["x-cron-timestamp"] || "").trim();
  const signature = String(req.headers?.["x-cron-signature"] || "").trim();
  const nonce = String(req.headers?.["x-cron-nonce"] || timestamp).trim();
  if (!timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() - ts) > REPLAY_WINDOW_MS) return false;

  purgeOldNonces();
  if (seenCronNonces.has(nonce)) return false;

  const path = String(req.url || req.path || "/api/cron").split("?")[0];
  const payload = `${timestamp}.${nonce}.${path}`;

  for (const secret of secrets) {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    if (safeEqual(signature, expected)) {
      seenCronNonces.set(nonce, Date.now());
      return true;
    }
  }
  return false;
}

function verifyIpAllowlist(req, allowedIps) {
  if (!allowedIps?.length) return true;
  const forwarded = String(req.headers?.["x-forwarded-for"] || "").split(",")[0]?.trim();
  const realIp = String(req.headers?.["x-real-ip"] || forwarded || "").trim();
  return allowedIps.includes(realIp);
}

export function validateCronAuth(req) {
  const env = getEnvConfig();
  const secrets = getCronSecrets();

  if (env.cronAllowedIps.length && !verifyIpAllowlist(req, env.cronAllowedIps)) {
    return false;
  }

  const ip = String(req.headers?.["x-forwarded-for"] || "local").split(",")[0]?.trim();
  if (!cronRateLimit(`cron:${ip}`)) return false;

  if (verifyHmacSignature(req, secrets)) return true;

  const isVercelCron = req.headers?.["x-vercel-cron"] === "1";
  if (isVercelCron && secrets.length > 0) {
    const provided = extractCronSecretFromRequest(req);
    if (provided && secrets.some((s) => safeEqual(provided, s))) return true;
    if (env.nodeEnv !== "production") return true;
    return false;
  }
  if (isVercelCron && !secrets.length && env.nodeEnv !== "production") return true;

  if (!secrets.length) {
    return env.nodeEnv !== "production";
  }

  const provided = extractCronSecretFromRequest(req);
  if (!provided) return false;
  return secrets.some((s) => safeEqual(provided, s));
}

export function validateAdminAuth(req) {
  if (req.headers?.["x-vercel-cron"] === "1") {
    const secrets = getCronSecrets();
    const provided = extractCronSecretFromRequest(req);
    if (provided && secrets.some((s) => safeEqual(provided, s))) return true;
  }

  const env = getEnvConfig();
  const configured = env.adminSecret;

  if (!configured) {
    return env.nodeEnv !== "production";
  }

  const provided = extractCronSecretFromRequest(req);
  if (!provided) return false;

  return safeEqual(provided, configured);
}

export function signCronRequest(path, secret) {
  const timestamp = String(Date.now());
  const nonce = `${timestamp}-${Math.random().toString(36).slice(2, 10)}`;
  const payload = `${timestamp}.${nonce}.${path}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return {
    "x-cron-timestamp": timestamp,
    "x-cron-nonce": nonce,
    "x-cron-signature": signature,
  };
}
