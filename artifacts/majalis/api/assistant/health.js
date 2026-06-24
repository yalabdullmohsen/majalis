import { sendJson } from "../_http.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, message: "Method not allowed" });
    return;
  }

  const hasKey = Boolean((process.env.ANTHROPIC_API_KEY || "").trim());

  sendJson(res, 200, {
    hasKey,
    runtime: "server",
    ok: true,
  });
}
