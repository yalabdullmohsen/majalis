/**
 * Release Train — shared constants & schedule contract.
 * Kuwait (AST) = UTC+3 year-round (no DST).
 */

export const KUWAIT_UTC_OFFSET_HOURS = 3;

/** Cron expressions (UTC) for 06:00 and 18:00 Kuwait. */
export const SCHEDULE_CRONS_UTC = Object.freeze(["0 3 * * *", "0 15 * * *"]);

export const MAX_PRS_PER_TRAIN = 8;
export const MAX_CUMULATIVE_FILES = 80;
export const MAX_FILES_LEVEL_C = 40;
export const MAX_FILES_LEVEL_B = 15;

export const READY_LABEL = "release-train-ready";

/** Domain labels — at least one required (plus READY_LABEL). */
export const DOMAIN_LABELS = Object.freeze([
  "safe:content",
  "safe:ui",
  "safe:test",
  "security-safe",
  "code-safe",
  "performance-safe",
  "maintenance-safe",
  "content-safe",
  "tests-safe",
  "ui-safe",
]);

/** Lower index = higher merge priority. */
export const DOMAIN_PRIORITY = Object.freeze([...DOMAIN_LABELS]);

export const LEVEL = Object.freeze({
  A: "A",
  B: "B",
  C: "C",
});

/** Paths / patterns that force Level C (blocked from train). */
export const LEVEL_C_PATH_PATTERNS = Object.freeze([
  /(^|\/)supabase\//i,
  /(^|\/)migrations?\//i,
  /\.sql$/i,
  /SECURITY\s+DEFINER/i,
  /(^|\/)ios\//i,
  /\.swift$/i,
  /\.xcodeproj(\/|$)/i,
  /\.xcworkspace(\/|$)/i,
  /capacitor\.config\.(ts|json)$/i,
  /Info\.plist$/i,
  /bundle.?id/i,
  /(^|\/)auth\//i,
  /rls[_-]?polic/i,
  /row.?level.?security/i,
  /^\.github\/workflows\//i,
  /^package\.json$/i,
  /^pnpm-lock\.yaml$/i,
  /(^|\/)vercel\.json$/i,
  /^artifacts\/majalis\/api\//i,
  /^artifacts\/majalis\/lib\/api-handlers\//i,
  /^artifacts\/majalis\/lib\/security\//i,
  /^artifacts\/majalis\/lib\/auth\//i,
  /^artifacts\/majalis\/lib\/jobs\//i,
  /^fastlane\//i,
]);

/** Content signals that suggest Level A when no Level-C paths. */
export const LEVEL_A_PATH_PATTERNS = Object.freeze([
  /\.json$/i,
  /\.md$/i,
  /\.jsonl$/i,
  /__tests__\//i,
  /\.test\.(ts|tsx|js|mjs)$/i,
  /\.spec\.(ts|tsx|js|mjs)$/i,
  /typo/i,
  /content/i,
  /seed/i,
]);

export const SMOKE_PATHS = Object.freeze([
  "/",
  "/mushaf",
  "/prayer-times",
  "/lessons",
  "/search",
  "/api/healthz",
  "/api/readyz",
]);

export const DEFAULT_PRODUCTION_BASE = "https://majlisilm.com";

export const REPORT_DIR = "artifacts/release-train/reports";

export function kuwaitHourFromUtc(date = new Date()) {
  return (date.getUTCHours() + KUWAIT_UTC_OFFSET_HOURS) % 24;
}

export function formatKuwaitReleaseTag(date = new Date()) {
  const kuwaitMs = date.getTime() + KUWAIT_UTC_OFFSET_HOURS * 3600_000;
  const d = new Date(kuwaitMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hour = String(d.getUTCHours()).padStart(2, "0");
  return `release(train): ${y}-${m}-${day} ${hour}:00 Kuwait`;
}

export function reportFilename(date = new Date()) {
  const kuwaitMs = date.getTime() + KUWAIT_UTC_OFFSET_HOURS * 3600_000;
  const d = new Date(kuwaitMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hour = String(d.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${day}-${hour}.md`;
}
