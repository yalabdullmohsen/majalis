/**
 * Egress SSRF protection for server-side fetches.
 * - allowlist hosts (optional)
 * - block localhost / private / link-local / metadata endpoints
 * - re-validate redirect targets
 */
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { structuredLog } from "../observability/structured-log.mjs";

const DEFAULT_ALLOWLIST = Object.freeze([
  "instagram.com",
  "www.instagram.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "twitter.com",
  "x.com",
  "www.twitter.com",
  "t.me",
  "telegram.me",
  "telegram.org",
  "facebook.com",
  "www.facebook.com",
  "fb.com",
  "majlisilm.com",
  "www.majlisilm.com",
]);

const BLOCKED_HOSTS = new Set([
  "metadata.google.internal",
  "metadata.google",
  "169.254.169.254",
  "metadata",
]);

function hostAllowed(hostname, allowlist) {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTS.has(h)) return false;
  if (!allowlist || allowlist.length === 0) return true;
  return allowlist.some((rule) => {
    const r = String(rule).toLowerCase();
    return h === r || h.endsWith(`.${r}`);
  });
}

export function isPrivateIp(ip) {
  const v = String(ip || "");
  if (!isIP(v)) return false;
  if (v === "127.0.0.1" || v === "::1" || v === "0.0.0.0") return true;
  if (v.startsWith("10.")) return true;
  if (v.startsWith("192.168.")) return true;
  if (v.startsWith("169.254.")) return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80:")) return true;
  const m = /^172\.(\d+)\./.exec(v);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  if (v.startsWith("100.")) {
    // 100.64.0.0/10 CGNAT
    const parts = v.split(".").map(Number);
    if (parts[1] >= 64 && parts[1] <= 127) return true;
  }
  return false;
}

export function isBlockedHostname(hostname) {
  const h = String(hostname || "").toLowerCase().replace(/\.$/, "");
  if (!h) return true;
  if (BLOCKED_HOSTS.has(h)) return true;
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local")) return true;
  if (h === "metadata.google.internal") return true;
  return false;
}

/**
 * Validate URL before fetch. Resolves DNS and rejects private answers.
 * @param {string} rawUrl
 * @param {{ allowlist?: string[] | null, requireAllowlist?: boolean }} [opts]
 */
export async function assertSafeUrl(rawUrl, opts = {}) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || ""));
  } catch {
    throw Object.assign(new Error("SSRF_BLOCKED: invalid URL"), { code: "ssrf_blocked" });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw Object.assign(new Error("SSRF_BLOCKED: protocol"), { code: "ssrf_blocked" });
  }
  const host = parsed.hostname;
  if (isBlockedHostname(host)) {
    throw Object.assign(new Error("SSRF_BLOCKED: hostname"), { code: "ssrf_blocked" });
  }
  const allowlist = opts.allowlist === null ? null : opts.allowlist || DEFAULT_ALLOWLIST;
  if (opts.requireAllowlist !== false && allowlist && !hostAllowed(host, allowlist)) {
    throw Object.assign(new Error("SSRF_BLOCKED: not on allowlist"), { code: "ssrf_blocked" });
  }
  if (isIP(host) && isPrivateIp(host)) {
    throw Object.assign(new Error("SSRF_BLOCKED: private IP literal"), { code: "ssrf_blocked" });
  }
  if (!isIP(host)) {
    let records;
    try {
      records = await lookup(host, { all: true, verbatim: true });
    } catch {
      throw Object.assign(new Error("SSRF_BLOCKED: DNS failed"), { code: "ssrf_blocked" });
    }
    for (const r of records) {
      if (isPrivateIp(r.address)) {
        throw Object.assign(new Error("SSRF_BLOCKED: resolves to private IP"), {
          code: "ssrf_blocked",
        });
      }
    }
  }
  return parsed;
}

/**
 * Fetch with manual redirect following and per-hop SSRF checks.
 */
export async function safeFetch(rawUrl, init = {}, opts = {}) {
  const maxRedirects = opts.maxRedirects ?? 3;
  let current = String(rawUrl);
  for (let i = 0; i <= maxRedirects; i++) {
    const parsed = await assertSafeUrl(current, opts);
    const res = await fetch(parsed.toString(), {
      ...init,
      redirect: "manual",
      signal: init.signal || AbortSignal.timeout(opts.timeoutMs || 15_000),
    });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) {
        throw Object.assign(new Error("SSRF_BLOCKED: redirect without location"), {
          code: "ssrf_blocked",
        });
      }
      const next = new URL(loc, parsed).toString();
      structuredLog("info", "ssrf.redirect", {
        from_host: parsed.hostname,
        status: res.status,
        metric: "ssrf_redirect",
      });
      current = next;
      continue;
    }
    return res;
  }
  throw Object.assign(new Error("SSRF_BLOCKED: too many redirects"), { code: "ssrf_blocked" });
}

export const SSRF_DEFAULT_ALLOWLIST = DEFAULT_ALLOWLIST;
