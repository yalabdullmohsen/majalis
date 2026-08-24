/**
 * مسار Vercel مخصّص لـ /api/lessons/:id — يمنع fallback SPA عند 404
 * (عند التوجيه عبر api/index فقط، Vercel يعيد index.html عند 404).
 */
import "../_deps.mjs";
import lessonHandler from "../../lib/api-handlers/lesson-page.js";

export default async function handler(req, res) {
  const rawId = req.query?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || typeof id !== "string") {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, message: "معرّف الدرس مطلوب." }));
    return;
  }

  const encoded = encodeURIComponent(id);
  req.url = `/api/lessons/${encoded}`;
  req.headers = req.headers || {};
  req.headers["x-vercel-original-path"] = `/lessons/${encoded}`;

  return lessonHandler(req, res);
}
