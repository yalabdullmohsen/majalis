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
    console.error("API bootstrap failed", error);
    if (typeof res.status === "function" && typeof res.json === "function") {
      res.status(500).json({
        ok: false,
        message: "تعذر تشغيل واجهة API.",
        error: error?.message || String(error),
      });
      return;
    }
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: false,
        message: "تعذر تشغيل واجهة API.",
        error: error?.message || String(error),
      }),
    );
  }
}
