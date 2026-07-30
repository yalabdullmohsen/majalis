/**
 * Safe client-facing errors — never echo raw err.message / stack / SQL.
 * Full detail is logged server-side only.
 */

export function logServerError(code, err, extra = {}) {
  const message = err instanceof Error ? err.message : String(err ?? "");
  console.error(
    JSON.stringify({
      level: "error",
      msg: "handler_error",
      code,
      error: message.slice(0, 500),
      ...extra,
      ts: new Date().toISOString(),
    }),
  );
}

/**
 * @param {unknown} err
 * @param {{ code?: string }} [opts]
 */
export function clientErrorBody(err, opts = {}) {
  const code = opts.code || "internal_error";
  logServerError(code, err);
  return {
    ok: false,
    error: code,
    userMessage: "تعذّر إكمال الطلب. حاول لاحقًا.",
    userMessageAr: "تعذّر إكمال الطلب. حاول لاحقًا.",
  };
}

/**
 * @param {import('http').ServerResponse} res
 * @param {(res: any, status: number, body: any) => void} sendJson
 * @param {unknown} err
 * @param {{ status?: number, code?: string }} [opts]
 */
export function sendSafeError(res, sendJson, err, opts = {}) {
  const status = opts.status || 500;
  sendJson(res, status, clientErrorBody(err, { code: opts.code || "internal_error" }));
}
