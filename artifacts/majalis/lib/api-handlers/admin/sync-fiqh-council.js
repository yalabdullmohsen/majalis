import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";

/** مزامنة المجمع الفقهي متوقفة — المنتج أُزيل. */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;
  sendJson(res, 410, {
    ok: false,
    message: "أُزيلت مزامنة المجمع الفقهي من المنتج.",
  });
}
