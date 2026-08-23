/**
 * حدود تكلفة Instagram — تخطٍ عند الاستنفاد دون إسقاط التشغيلة.
 * INSTAGRAM_PROBE_DAILY_LIMIT=140
 * INSTAGRAM_FETCH_DAILY_LIMIT=40
 * INSTAGRAM_MONTHLY_LIMIT=4500
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUOTA_PATH = resolve(__dirname, "../../../public/data/sources/instagram-quota.json");

function numEnv(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function getInstagramQuotaLimits() {
  return {
    probeDaily: numEnv("INSTAGRAM_PROBE_DAILY_LIMIT", 140),
    fetchDaily: numEnv("INSTAGRAM_FETCH_DAILY_LIMIT", 40),
    monthly: numEnv("INSTAGRAM_MONTHLY_LIMIT", 4500),
  };
}

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

/** @returns {{ day: string, month: string, probe_count: number, fetch_count: number, month_count: number }} */
export function loadInstagramQuota() {
  const day = todayKey();
  const month = monthKey();
  if (!existsSync(QUOTA_PATH)) {
    return { day, month, probe_count: 0, fetch_count: 0, month_count: 0 };
  }
  try {
    const raw = JSON.parse(readFileSync(QUOTA_PATH, "utf8"));
    const sameDay = raw.day === day;
    const sameMonth = raw.month === month;
    return {
      day,
      month,
      probe_count: sameDay ? Number(raw.probe_count) || 0 : 0,
      fetch_count: sameDay ? Number(raw.fetch_count) || 0 : 0,
      month_count: sameMonth ? Number(raw.month_count) || 0 : 0,
    };
  } catch {
    return { day, month, probe_count: 0, fetch_count: 0, month_count: 0 };
  }
}

export function saveInstagramQuota(quota) {
  mkdirSync(dirname(QUOTA_PATH), { recursive: true });
  writeFileSync(QUOTA_PATH, `${JSON.stringify(quota, null, 2)}\n`);
}

/**
 * @param {{ probe_count: number, fetch_count: number, month_count: number }} quota
 * @param {'probe'|'fetch'} kind
 */
export function canConsumeQuota(quota, kind) {
  const limits = getInstagramQuotaLimits();
  if (quota.month_count >= limits.monthly) {
    return { ok: false, reason: "rate_limited", detail: "monthly_limit" };
  }
  if (kind === "probe" && quota.probe_count >= limits.probeDaily) {
    return { ok: false, reason: "rate_limited", detail: "probe_daily_limit" };
  }
  if (kind === "fetch" && quota.fetch_count >= limits.fetchDaily) {
    return { ok: false, reason: "rate_limited", detail: "fetch_daily_limit" };
  }
  return { ok: true, reason: null, detail: null };
}

/**
 * @param {{ probe_count: number, fetch_count: number, month_count: number }} quota
 * @param {'probe'|'fetch'} kind
 */
export function consumeQuota(quota, kind) {
  if (kind === "probe") quota.probe_count += 1;
  if (kind === "fetch") quota.fetch_count += 1;
  quota.month_count += 1;
  return quota;
}

export function isBackfillEnabled() {
  return String(process.env.INSTAGRAM_BACKFILL_ENABLED || "false").toLowerCase() === "true";
}

export function maxLatestPostsPerAccount() {
  return isBackfillEnabled() ? Math.max(1, numEnv("INSTAGRAM_BACKFILL_LIMIT", 5)) : 1;
}

export { QUOTA_PATH };
