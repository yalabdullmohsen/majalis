import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { runFiqhCouncilSync } from "../../../lib/fiqh-council-sync.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const sourceSlugs = body.sourceSlugs || null;
    const result = await runFiqhCouncilSync({ triggerType: "manual", sourceSlugs });
    sendJson(res, 200, result);
  } catch (error) {
    console.error("[admin/sync-fiqh-council] failed", error);
    sendJson(res, 500, { ok: false, message: "فشلت المزامنة." });
  }
}
