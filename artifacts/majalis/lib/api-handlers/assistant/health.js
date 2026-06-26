import { sendJson } from "../../api/_http.mjs";
import { isProduction } from "../../api/_security.mjs";

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

  const configured = Boolean((process.env.ANTHROPIC_API_KEY || "").trim());

  sendJson(res, 200, {
    ok: true,
    available: configured,
    ...(isProduction() ? {} : { runtime: "server" }),
  });
}
