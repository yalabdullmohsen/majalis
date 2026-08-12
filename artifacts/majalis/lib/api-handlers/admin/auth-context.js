import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess, canImportContent } from "../../../lib/admin-auth.mjs";
import { resolveUserEmail, isBootstrapOwnerEmail } from "../../../lib/owner-config.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  sendJson(res, 200, {
    ok: true,
    email: auth.email || resolveUserEmail(auth.user),
    resolvedRole: auth.effectiveRole || auth.role,
    governanceRole: auth.governanceRole,
    isAdmin: auth.isAdmin === true,
    isOwner: auth.isOwner === true,
    unrestricted: auth.unrestricted === true,
    bootstrapOwner: isBootstrapOwnerEmail(auth.email || resolveUserEmail(auth.user)),
    canImport: canImportContent(auth),
    method: auth.method,
    userId: auth.userId,
  });
}
