/**
 * Post-deployment smoke / health verification.
 */
import { DEFAULT_PRODUCTION_BASE, SMOKE_PATHS } from "./constants.mjs";

/**
 * @param {string} baseUrl
 * @param {string} path
 * @param {{ fetchImpl?: typeof fetch, timeoutMs?: number }} [opts]
 */
export async function checkEndpoint(baseUrl, path, opts = {}) {
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? 25_000;
  const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const started = Date.now();
  try {
    const res = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "text/html,application/json,*/*" },
    });
    const status = res.status;
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      bodyText = "";
    }
    const okHttp = status >= 200 && status < 400;
    let jsonOk = true;
    if (path.includes("healthz") || path.includes("readyz")) {
      try {
        const j = JSON.parse(bodyText);
        if (path.includes("healthz")) jsonOk = j?.ok === true;
        if (path.includes("readyz")) jsonOk = j?.status === "ok" || j?.status === "ready";
      } catch {
        jsonOk = false;
      }
    }
    // Dynamic asset hint for HTML shells
    let assetsOk = true;
    if (okHttp && /text\/html/i.test(res.headers?.get?.("content-type") || "") && bodyText.includes("<html")) {
      assetsOk = /\/assets\/|\.js|\.css/.test(bodyText);
    }
    const ok = okHttp && jsonOk && assetsOk && status < 500;
    return {
      path,
      url,
      status,
      ok,
      ms: Date.now() - started,
      detail: ok ? "ok" : !okHttp ? `http_${status}` : !jsonOk ? "json_not_ready" : "assets_missing",
    };
  } catch (err) {
    return {
      path,
      url,
      status: 0,
      ok: false,
      ms: Date.now() - started,
      detail: `error:${err?.name || "fetch"}:${err?.message || err}`,
    };
  }
}

/**
 * @param {{ baseUrl?: string, paths?: string[], fetchImpl?: typeof fetch }} [opts]
 */
export async function runSmokeChecks(opts = {}) {
  const baseUrl = opts.baseUrl || process.env.RELEASE_TRAIN_BASE_URL || DEFAULT_PRODUCTION_BASE;
  const paths = opts.paths || SMOKE_PATHS;
  const results = [];
  for (const path of paths) {
    results.push(await checkEndpoint(baseUrl, path, { fetchImpl: opts.fetchImpl }));
  }
  const failed = results.filter((r) => !r.ok);
  return {
    ok: failed.length === 0,
    baseUrl,
    results,
    failed,
  };
}

/**
 * Decide whether rollback should fire.
 * @param {{ ok: boolean, failed?: Array<{ status: number, detail: string }> }} smoke
 * @param {{ force?: boolean }} [opts]
 */
export function shouldTriggerRollback(smoke, opts = {}) {
  if (opts.force) return { rollback: true, reason: "forced" };
  if (!smoke || smoke.ok) return { rollback: false, reason: "not_needed" };
  const hard = (smoke.failed || []).some(
    (f) => f.status >= 500 || f.status === 0 || /json_not_ready|assets_missing|error:/.test(f.detail || ""),
  );
  if (hard) return { rollback: true, reason: "post_deploy_failure" };
  return { rollback: true, reason: "smoke_failed" };
}
