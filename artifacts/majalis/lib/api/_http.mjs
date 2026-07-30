/**
 * Safe HTTP response helpers — single response per request.
 * Defense-in-depth: never throw on double-send; no-op if already ended.
 */

export function isResponseClosed(res) {
  return Boolean(res?.headersSent || res?.writableEnded || res?.destroyed);
}

export function sendJson(res, status, payload, headers = {}) {
  if (isResponseClosed(res)) {
    console.error(
      JSON.stringify({
        level: "warn",
        msg: "http.double_response_blocked",
        status,
        ts: new Date().toISOString(),
      }),
    );
    return false;
  }

  try {
    for (const [k, v] of Object.entries(headers)) {
      if (v != null) res.setHeader(k, String(v));
    }
    if (typeof res.status === "function" && typeof res.json === "function") {
      res.status(status).json(payload);
      return true;
    }
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "http.send_failed",
        error: String(err?.message || err),
        ts: new Date().toISOString(),
      }),
    );
    return false;
  }
}

export function endEmpty(res, status = 204) {
  if (isResponseClosed(res)) return false;
  try {
    if (typeof res.status === "function" && typeof res.end === "function") {
      res.status(status).end();
      return true;
    }
    res.statusCode = status;
    res.end();
    return true;
  } catch {
    return false;
  }
}

/**
 * Apply a typed handler result. Handlers should prefer returning this shape
 * instead of writing to `res` themselves when migrated.
 *
 * @param {import('http').ServerResponse} res
 * @param {{ status: number, body?: unknown, headers?: Record<string,string> }} result
 */
export function applyHandlerResult(res, result) {
  if (!result || typeof result.status !== "number") {
    return sendJson(res, 500, { ok: false, error: "invalid_handler_result", message: "تعذر تنفيذ الطلب." });
  }
  if (result.body === undefined) {
    return endEmpty(res, result.status);
  }
  return sendJson(res, result.status, result.body, result.headers || {});
}
