import { sendJson } from "../_http.js";
import { runFullKnowledgeSync } from "../../lib/auto-knowledge-sync.mjs";

function verifyCronAuth(req) {
  if (req.headers["x-vercel-cron"] === "1") return true;
  const secret = String(process.env.CRON_SECRET || "").trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = String(req.headers.authorization || "").replace("Bearer ", "").trim();
  return auth === secret;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }
  if (!verifyCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }
  try {
    const result = await runFullKnowledgeSync({ triggerType: "cron", checkLinks: false });
    sendJson(res, result.ok ? 200 : 500, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
