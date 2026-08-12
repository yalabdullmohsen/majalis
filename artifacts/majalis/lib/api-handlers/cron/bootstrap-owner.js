import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { promoteAllBootstrapOwners, promoteOwnerByEmail } from "../../../lib/owner-promotion.mjs";
import { BOOTSTRAP_OWNER_EMAILS } from "../../../lib/owner-config.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "unauthorized" });
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, {
      ok: false,
      error: "supabase_admin_not_configured",
      message: "SUPABASE_SERVICE_ROLE_KEY required to promote owners.",
    });
    return;
  }

  const email = String(req.query?.email || req.body?.email || "").trim();
  const action = String(req.query?.action || req.body?.action || "promote-all").trim();

  try {
    if (action === "list") {
      sendJson(res, 200, { ok: true, bootstrapOwners: [...BOOTSTRAP_OWNER_EMAILS] });
      return;
    }

    const result = email
      ? await promoteOwnerByEmail(admin, email)
      : await promoteAllBootstrapOwners(admin);

    sendJson(res, result.ok ? 200 : 422, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || String(error) });
  }
}
