import "./_deps.mjs";
import "../lib/rate-limit.mjs";

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

    // ردّ عام بلا تفاصيل: error.message قد يكشف مسارات وأسماء وحدات وأسرار بيئة.
    const payload = { ok: false, message: "تعذر تشغيل واجهة API." };

    if (typeof res.status === "function" && typeof res.json === "function") {
      res.status(500).json(payload);
      return;
    }
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(payload));
  }
}
