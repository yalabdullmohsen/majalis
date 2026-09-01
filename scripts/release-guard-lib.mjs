/**
 * مكتبة مشتركة لبوابات الإصدار — سُنّة / Ssunnah.com
 */
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const MAJALIS_ROOT = resolve(REPO_ROOT, "artifacts/majalis");
export const REPORTS_DIR = resolve(REPO_ROOT, "reports");

export const PRODUCTION_BASE = (
  process.env.SMOKE_BASE ||
  process.env.RELEASE_BASE ||
  "https://www.ssunnah.com"
).replace(/\/$/, "");

export const APEX_BASE = "https://ssunnah.com";

export const SENSITIVE_SITEMAP_PREFIXES = [
  "/admin",
  "/dashboard",
  "/internal",
  "/login",
  "/register",
  "/api",
  "/search",
  "/review",
  "/content-review",
];

export const FORBIDDEN_PUBLIC_BRAND = [/majlisilm/i, /المجلس\s*العلمي/i];

export function ensureReportsDir() {
  mkdirSync(REPORTS_DIR, { recursive: true });
}

export function readMajalis(rel) {
  return readFileSync(resolve(MAJALIS_ROOT, rel), "utf8");
}

export function majalisExists(rel) {
  return existsSync(resolve(MAJALIS_ROOT, rel));
}

export function writeJsonReport(name, payload) {
  ensureReportsDir();
  const path = resolve(REPORTS_DIR, name);
  writeFileSync(path, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return path;
}

export function runNode(cwd, scriptRel, label, extraArgs = [], { tsx = false } = {}) {
  const script = resolve(cwd, scriptRel);
  const args = tsx ? ["--import", "tsx", script, ...extraArgs] : [script, ...extraArgs];
  const r = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    label,
    ok: r.status === 0,
    status: r.status ?? 1,
    stdout: (r.stdout || "").trim(),
    stderr: (r.stderr || "").trim(),
  };
}

export function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    try {
      return new URL(m[1]).pathname.replace(/\/$/, "") || "/";
    } catch {
      return m[1];
    }
  });
}

export function isLegacyCacheLine(line) {
  return /LEGACY_CACHE|legacy|cleanup|isLegacyCacheKey|majlisilm-version|majalis-version/i.test(
    line,
  );
}

export function scanTextForForbiddenBrand(text, { allowLegacyCache = false } = {}) {
  const hits = [];
  for (const line of text.split("\n")) {
    if (allowLegacyCache && isLegacyCacheLine(line)) continue;
    if (/^\s*import\s/.test(line)) continue;
    if (/legacyOrigins|forbiddenBrand|SELF_SOURCE|LEGACY_CACHE/.test(line)) continue;
    for (const re of FORBIDDEN_PUBLIC_BRAND) {
      if (re.test(line)) hits.push(line.trim().slice(0, 120));
    }
  }
  return hits;
}

export async function fetchHttp(base, path, opts = {}) {
  const url = new URL(path, `${base}/`).toString();
  const res = await fetch(url, {
    redirect: opts.redirect ?? "follow",
    headers: { "user-agent": "ssunnah-release-guard/1.0", ...(opts.headers || {}) },
    signal: opts.signal,
  });
  const text = await res.text();
  return {
    url,
    status: res.status,
    ok: res.ok,
    text,
    headers: res.headers,
  };
}

export function isFullCommitHash(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/i.test(value);
}

export function shortSha() {
  try {
    const r = spawnSync("git", ["rev-parse", "--short=8", "HEAD"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    if (r.status === 0) return r.stdout.trim();
  } catch {
    /* ignore */
  }
  return "unknown";
}
