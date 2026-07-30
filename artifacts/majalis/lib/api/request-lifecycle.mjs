/**
 * Request lifecycle — AbortSignal + single-flight response for API dispatch.
 */

import { sendJson, isResponseClosed } from "./_http.mjs";
import { randomUUID } from "node:crypto";

export function createRequestContext(req, res, { timeoutMs = 25_000 } = {}) {
  const requestId = String(req.headers?.["x-request-id"] || randomUUID());
  const traceId = String(req.headers?.["x-trace-id"] || requestId);
  res.setHeader?.("x-request-id", requestId);
  res.setHeader?.("x-trace-id", traceId);

  const controller = new AbortController();
  let settled = false;

  const onClose = () => {
    if (!settled) controller.abort();
  };
  req.on?.("close", onClose);
  req.on?.("aborted", onClose);

  const timer = setTimeout(() => {
    if (settled || isResponseClosed(res)) return;
    controller.abort();
    sendJson(res, 504, {
      ok: false,
      error: "handler_timeout",
      message: "تعذر إكمال الطلب في الوقت المحدد.",
      requestId,
      traceId,
      fallback: true,
    });
    settled = true;
  }, timeoutMs);

  return {
    requestId,
    traceId,
    signal: controller.signal,
    markSettled() {
      settled = true;
      clearTimeout(timer);
    },
    dispose() {
      clearTimeout(timer);
      req.off?.("close", onClose);
      req.off?.("aborted", onClose);
    },
  };
}
