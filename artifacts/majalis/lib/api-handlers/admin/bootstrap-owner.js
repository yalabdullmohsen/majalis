import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { promoteOwnerByEmail } from "../../../lib/owner-promotion.mjs";
import { isBootstrapOwnerEmail } from "../../../lib/owner-config.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  if (!auth.unrestricted && auth.role !== "super_admin") {
    sendJson(res, 403, { ok: false, error: "forbidden", message: "Only platform owners can run owner bootstrap." });
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, { ok: false, error: "supabase_admin_not_configured" });
    return;
  }

  const email = String(req.body?.email || req.query?.email || "").trim();
  if (!email || !isBootstrapOwnerEmail(email)) {
    sendJson(res, 400, { ok: false, error: "invalid_bootstrap_email" });
    return;
  }

  try {
    const result = await promoteOwnerByEmail(admin, email, { assignedBy: auth.userId || "admin-api" });
    sendJson(res, result.ok ? 200 : 422, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || String(error) });
  }
}
