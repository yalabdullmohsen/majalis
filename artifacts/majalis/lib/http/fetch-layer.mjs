/**
 * Production HTTP fetch layer — retry, exponential backoff, circuit breaker,
 * redirect handling, timeout protection, response cache, alternate User-Agent.
 */

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 500;
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_COOL_DOWN_MS = 5 * 60_000;
const CACHE_TTL_MS = 60_000;

const USER_AGENTS = [
  "MajlisIlmBot/2.0 (+https://majlisilm.com; Islamic scholarly aggregator)",
  "Mozilla/5.0 (compatible; MajlisIlmBot/2.0; +https://majlisilm.com)",
  "FeedFetcher-Google; (+http://www.google.com/feedfetcher.html)",
];

/** @type {Map<string, { failures: number, openedAt: number | null, lastError: string | null }>} */
const circuits = new Map();

/** @type {Map<string, { body: string, status: number, headers: Record<string,string>, expires: number }>} */
const responseCache = new Map();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function circuitKey(url, label) {
  try {
    return label || new URL(url).hostname;
  } catch {
    return String(url).slice(0, 120);
  }
}

function getCircuit(key) {
  if (!circuits.has(key)) {
    circuits.set(key, { failures: 0, openedAt: null, lastError: null });
  }
  return circuits.get(key);
}

function recordCircuitSuccess(key) {
  const c = getCircuit(key);
  c.failures = 0;
  c.openedAt = null;
  c.lastError = null;
}

function recordCircuitFailure(key, error) {
  const c = getCircuit(key);
  c.failures += 1;
  c.lastError = String(error?.message || error || "unknown").slice(0, 300);
  if (c.failures >= CIRCUIT_FAILURE_THRESHOLD && !c.openedAt) {
    c.openedAt = Date.now();
  }
}

function isCircuitOpen(key) {
  const c = getCircuit(key);
  if (!c.openedAt) return false;
  if (Date.now() - c.openedAt > CIRCUIT_COOL_DOWN_MS) {
    c.openedAt = null;
    c.failures = Math.floor(CIRCUIT_FAILURE_THRESHOLD / 2);
    return false;
  }
  return true;
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function isPermanentStatus(status) {
  return status === 404 || status === 410 || status === 401 || status === 403;
}

function pickUserAgent(attempt) {
  return USER_AGENTS[(attempt - 1) % USER_AGENTS.length];
}

function cacheGet(key) {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    responseCache.delete(key);
    return null;
  }
  return hit;
}

function cacheSet(key, entry, ttlMs = CACHE_TTL_MS) {
  responseCache.set(key, { ...entry, expires: Date.now() + ttlMs });
}

/**
 * @param {string} url
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {Record<string,string>} [options.headers]
 * @param {number} [options.timeoutMs]
 * @param {number} [options.maxRetries]
 * @param {number} [options.baseDelayMs]
 * @param {string} [options.label]
 * @param {boolean} [options.useCache]
 * @param {number} [options.cacheTtlMs]
 * @param {boolean} [options.followRedirects]
 * @param {number} [options.maxRedirects]
 */
export async function fetchResource(url, options = {}) {
  const {
    method = "GET",
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    label,
    useCache = method === "GET",
    cacheTtlMs = CACHE_TTL_MS,
    followRedirects = true,
    maxRedirects = 5,
  } = options;

  const key = circuitKey(url, label);
  if (isCircuitOpen(key)) {
    const err = new Error(`circuit_open:${key}:${getCircuit(key).lastError || "too_many_failures"}`);
    err.code = "CIRCUIT_OPEN";
    throw err;
  }

  const cacheKey = `${method}:${url}:${JSON.stringify(headers["If-None-Match"] || "")}`;
  if (useCache && method === "GET") {
    const cached = cacheGet(cacheKey);
    if (cached) {
      return {
        ok: cached.status >= 200 && cached.status < 300,
        status: cached.status,
        statusText: "OK",
        headers: new Map(Object.entries(cached.headers)),
        text: async () => cached.body,
        fromCache: true,
        url,
      };
    }
  }

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithRedirects(url, {
        method,
        headers: {
          Accept: "application/json, application/xml, text/xml, text/html, */*",
          "Accept-Language": "ar,en;q=0.8",
          "User-Agent": pickUserAgent(attempt),
          ...headers,
        },
        signal: AbortSignal.timeout(timeoutMs),
        followRedirects,
        maxRedirects,
      });

      if (isPermanentStatus(response.status)) {
        recordCircuitFailure(key, new Error(`permanent_${response.status}`));
        return response;
      }

      if (!response.ok && isRetryableStatus(response.status) && attempt < maxRetries) {
        const delay = baseDelayMs * 2 ** (attempt - 1);
        await sleep(delay);
        continue;
      }

      if (response.ok && useCache && method === "GET") {
        const body = await response.text();
        const headerObj = {};
        response.headers.forEach((v, k) => {
          headerObj[k] = v;
        });
        cacheSet(cacheKey, { body, status: response.status, headers: headerObj }, cacheTtlMs);
        recordCircuitSuccess(key);
        return {
          ok: true,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          text: async () => body,
          url: response.url || url,
        };
      }

      if (response.ok) recordCircuitSuccess(key);
      else if (isRetryableStatus(response.status)) recordCircuitFailure(key, new Error(`http_${response.status}`));
      return response;
    } catch (err) {
      lastError = err;
      recordCircuitFailure(key, err);
      if (attempt < maxRetries) {
        const delay = baseDelayMs * 2 ** (attempt - 1);
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError || new Error(`fetch_failed:${url}`);
}

async function fetchWithRedirects(url, { method, headers, signal, followRedirects, maxRedirects }) {
  let current = url;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await fetch(current, { method, headers, signal, redirect: "manual" });
    if (!followRedirects || res.status < 300 || res.status >= 400 || hop >= maxRedirects) {
      return Object.assign(res, { url: current });
    }
    const location = res.headers.get("location");
    if (!location) return Object.assign(res, { url: current });
    current = new URL(location, current).toString();
  }
  throw new Error("too_many_redirects");
}

export function getCircuitBreakerStats() {
  return [...circuits.entries()].map(([key, c]) => ({
    key,
    failures: c.failures,
    open: Boolean(c.openedAt && Date.now() - c.openedAt <= CIRCUIT_COOL_DOWN_MS),
    lastError: c.lastError,
    coolDownRemainingMs: c.openedAt
      ? Math.max(0, CIRCUIT_COOL_DOWN_MS - (Date.now() - c.openedAt))
      : 0,
  }));
}

export function resetCircuitBreaker(key) {
  circuits.delete(key);
}

export { DEFAULT_TIMEOUT_MS, DEFAULT_MAX_RETRIES, USER_AGENTS };
