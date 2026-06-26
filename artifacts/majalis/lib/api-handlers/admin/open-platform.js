import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import {
  createApiKey,
  revokeApiKey,
  listApiKeys,
  registerWebhook,
  listWebhooks,
  getAuditLogs,
  getUsageStats,
  generateOpenPlatformReport,
  buildReleasePlan,
  generateOpenApiSpec,
  generateDocsHtml,
  listResources,
  cacheStats,
  clearCache,
} from "../../../lib/open-platform/index.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";
  const admin = getSupabaseAdmin();

  try {
    if (action === "dashboard") {
      const [keys, usage, resources] = await Promise.all([
        listApiKeys(admin, "admin"),
        getUsageStats(admin, null, 30),
        Promise.resolve(listResources()),
      ]);
      sendJson(res, 200, {
        ok: true,
        keys,
        usage,
        resources: resources.data,
        cache: cacheStats(),
      });
      return;
    }

    if (action === "create-key") {
      const { name, scopes, tier } = req.body || {};
      const result = await createApiKey(admin, { name: name || "API Key", scopes, tier, owner_id: "admin" });
      sendJson(res, 200, result);
      return;
    }

    if (action === "revoke-key") {
      const keyId = req.body?.key_id || req.query?.key_id;
      const result = await revokeApiKey(admin, keyId);
      sendJson(res, 200, result);
      return;
    }

    if (action === "keys") {
      const keys = await listApiKeys(admin, "admin");
      sendJson(res, 200, { ok: true, keys });
      return;
    }

    if (action === "usage") {
      const keyId = req.query?.key_id;
      const days = Number(req.query?.days || 30);
      const usage = await getUsageStats(admin, keyId, days);
      sendJson(res, 200, { ok: true, usage });
      return;
    }

    if (action === "logs") {
      const logs = await getAuditLogs(admin, { keyId: req.query?.key_id, limit: Number(req.query?.limit || 50) });
      sendJson(res, 200, { ok: true, logs });
      return;
    }

    if (action === "create-webhook") {
      const { url, events, name } = req.body || {};
      const result = await registerWebhook(admin, { url, events, name, owner_id: "admin" });
      sendJson(res, 200, result);
      return;
    }

    if (action === "webhooks") {
      const webhooks = await listWebhooks(admin, "admin");
      sendJson(res, 200, { ok: true, webhooks });
      return;
    }

    if (action === "docs") {
      const version = req.query?.version || "v1";
      const format = req.query?.format || "json";
      if (format === "html") {
        sendJson(res, 200, { ok: true, html: generateDocsHtml(version) });
        return;
      }
      sendJson(res, 200, { ok: true, spec: generateOpenApiSpec(version) });
      return;
    }

    if (action === "report") {
      const report = await generateOpenPlatformReport(admin);
      sendJson(res, 200, { ok: true, report });
      return;
    }

    if (action === "plan") {
      sendJson(res, 200, { ok: true, plan: buildReleasePlan() });
      return;
    }

    if (action === "clear-cache") {
      clearCache(req.query?.prefix);
      sendJson(res, 200, { ok: true, cache: cacheStats() });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
