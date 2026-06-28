/**
 * Admin API — Instagram Graph API integration + Manual Assist.
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  getInstagramGraphStatus,
  testInstagramConnection,
  getInstagramGraphConfig,
  diagnoseInstagramToken,
  getInstagramDiagnostics,
} from "../../../lib/cms/instagram-graph-api.mjs";
import { processInstagramManualAssist } from "../../../lib/cms/instagram-manual-assist.mjs";
import { listTrustedSources, upsertTrustedSource, getTrustedSource } from "../../../lib/cms/trusted-sources.mjs";
import { logAutomationStep } from "../../../lib/cms/automation-step-logs.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "").trim();

  try {
    if (action === "status") {
      const status = getInstagramGraphStatus();
      const instagramSources = (await listTrustedSources({ activeOnly: false })).filter(
        (s) => s.source_type === "instagram" || s.platform === "instagram",
      );
      sendJson(res, 200, {
        ok: true,
        ...status,
        linkedSources: instagramSources.map((s) => ({
          id: s.id,
          name: s.name,
          url: s.url,
          handle: s.config?.handle,
          instagram_business_account_id: s.config?.instagram_business_account_id || null,
        })),
      });
      return;
    }

    if (action === "test-connection") {
      const result = await testInstagramConnection();
      await logAutomationStep({
        step: result.ok ? "auth_status" : "fetch_failed",
        status: result.ok ? "ok" : "error",
        detail: result.ok ? "test_connection_ok" : result.error,
      });
      sendJson(res, 200, { ok: result.ok, ...result });
      return;
    }

    if (action === "refresh-token") {
      const diagnostics = await getInstagramDiagnostics();
      await logAutomationStep({
        step: diagnostics.ok ? "auth_status" : "fetch_failed",
        status: diagnostics.ok ? "ok" : "warn",
        detail: diagnostics.failureReason || "token_diagnostics",
      });
      sendJson(res, 200, {
        ok: diagnostics.ok,
        configured: diagnostics.configured,
        token: diagnostics.token,
        failureReason: diagnostics.failureReason,
        remediation: diagnostics.remediation,
        pipelineImpact: diagnostics.pipelineImpact,
        message: diagnostics.ok
          ? "Token صالح — لا حاجة للتجديد الآن."
          : diagnostics.remediation?.steps?.[0] || "حدّث INSTAGRAM_GRAPH_ACCESS_TOKEN في Vercel Secrets.",
      });
      return;
    }

    if (action === "diagnostics") {
      const diagnostics = await getInstagramDiagnostics();
      sendJson(res, 200, { ok: true, ...diagnostics });
      return;
    }

    if (action === "link-source") {
      const source = await getTrustedSource(body.sourceId);
      if (!source) {
        sendJson(res, 404, { ok: false, error: "source_not_found" });
        return;
      }
      const result = await upsertTrustedSource({
        ...source,
        config: {
          ...(source.config || {}),
          instagram_business_account_id: body.instagramBusinessAccountId || source.config?.instagram_business_account_id,
          handle: body.handle || source.config?.handle,
        },
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "manual-assist") {
      const result = await processInstagramManualAssist({
        sourceId: body.sourceId,
        mode: body.mode,
        imageBase64: body.imageBase64,
        mimeType: body.mimeType,
        postUrl: body.postUrl,
        imageUrl: body.imageUrl,
        caption: body.caption,
        userId: auth.userId,
      });
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    sendJson(res, 400, {
      ok: false,
      error: "unknown_action",
      actions: ["status", "test-connection", "refresh-token", "diagnostics", "link-source", "manual-assist"],
    });
  } catch (err) {
    console.error("[admin/instagram-integration]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
