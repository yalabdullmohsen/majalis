/**
 * Security controls for Content Ops fetch / publish path (P0).
 */

const DEFAULT_ALLOWLIST = Object.freeze([
  "sunnah.app",
  "www.awqaf.gov.kw",
  "awqaf.gov.kw",
  "www.ku.edu.kw",
  "ku.edu.kw",
  "alquran.cloud",
  "sunnah.com",
  "www.sunnah.com",
]);

const BLOCKED_SCHEMES = new Set(["file:", "ftp:", "data:", "javascript:"]);
const EXECUTABLE_EXT = /\.(exe|dll|bat|cmd|sh|ps1|msi|dmg|apk|jar|wasm)$/i;
const MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024; // 5 MiB soft cap for ops fetches

/**
 * SSRF / open-redirect / allowlist checks for outbound URL fetch.
 */
export function validateFetchUrl(urlString, { allowlist = DEFAULT_ALLOWLIST } = {}) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (BLOCKED_SCHEMES.has(url.protocol)) {
    return { ok: false, reason: "blocked_scheme", protocol: url.protocol };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "unsupported_protocol", protocol: url.protocol };
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local") ||
    isPrivateIp(host)
  ) {
    return { ok: false, reason: "ssrf_blocked_host", host };
  }

  if (!allowlist.some((d) => host === d || host.endsWith(`.${d}`))) {
    return { ok: false, reason: "host_not_in_allowlist", host };
  }

  if (EXECUTABLE_EXT.test(url.pathname)) {
    return { ok: false, reason: "executable_download_blocked" };
  }

  return { ok: true, url: url.toString(), host };
}

function isPrivateIp(host) {
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  return false;
}

/**
 * Strip dangerous HTML for editorial sanitization (not for Quran/hadith).
 */
export function sanitizeEditorialHtml(input) {
  if (input == null) return "";
  let s = String(input);
  s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/javascript:/gi, "");
  s = s.replace(/<\/?(iframe|object|embed|link|meta)[^>]*>/gi, "");
  return s;
}

/**
 * Redact secrets from logs / reports.
 */
export function redactSecrets(value) {
  if (value == null) return value;
  if (typeof value === "string") {
    return value
      .replace(/(Bearer\s+)[A-Za-z0-9._\-+=/]+/gi, "$1[REDACTED]")
      .replace(/(api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s]+/gi, "$1=[REDACTED]")
      .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED_JWT]");
  }
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (/token|secret|password|apikey|api_key|authorization/i.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redactSecrets(v);
      }
    }
    return out;
  }
  return value;
}

export function getMaxDownloadBytes() {
  return MAX_DOWNLOAD_BYTES;
}

export function getDefaultAllowlist() {
  return [...DEFAULT_ALLOWLIST];
}

/**
 * Pipeline must not hold user-data write scopes.
 */
export function assertServiceScope(scopes = []) {
  const forbidden = ["user_write", "user_delete", "auth_admin", "billing"];
  const hits = scopes.filter((s) => forbidden.includes(s));
  if (hits.length) {
    return { ok: false, reason: "forbidden_user_scopes", hits };
  }
  return { ok: true };
}
