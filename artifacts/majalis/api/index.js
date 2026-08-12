import "./_deps.mjs";
import "../lib/rate-limit.mjs";
import { sendJson, isResponseClosed } from "../lib/api/_http.mjs";

let dispatchPromise;

async function getDispatch() {
  if (!dispatchPromise) {
    dispatchPromise = import("../lib/api-dispatch.mjs");
  }
  return dispatchPromise;
}

export default async function handler(req, res) {
  try {
    if (typeof res.waitUntil !== "function") {
      try {
        const vf = await import("@vercel/functions");
        if (typeof vf.waitUntil === "function") {
          res.waitUntil = (promise) => vf.waitUntil(promise);
        }
      } catch {
        /* @vercel/functions optional in local dev */
      }
    }

    const { dispatchApiRequest } = await getDispatch();
    return await dispatchApiRequest(req, res);
  } catch (error) {
    // تسجيل داخلي كامل (سجلّات الخادم فقط) — لا يُسرَّب شيء منه للعميل.
    console.error("API bootstrap failed", error);

    if (isResponseClosed(res)) {
      console.error(
        JSON.stringify({
          level: "warn",
          msg: "http.double_response_blocked",
          status: 500,
          phase: "bootstrap",
          ts: new Date().toISOString(),
        }),
      );
      return;
    }

    // ردّ عام بلا تفاصيل: error.message قد يكشف مسارات وأسماء وحدات وأسرار بيئة.
    sendJson(res, 500, { ok: false, message: "تعذر تشغيل واجهة API." });
  }
}
