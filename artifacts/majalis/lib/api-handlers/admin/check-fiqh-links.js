import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { runFiqhLinkCheck } from "../../../lib/fiqh-link-checker.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  try {
    const result = await runFiqhLinkCheck();
    sendJson(res, 200, result);
  } catch (error) {
    console.error("[admin/check-fiqh-links] failed", error);
    sendJson(res, 500, { ok: false, message: "فشل فحص الروابط." });
  }
}
