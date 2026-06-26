import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { runContentImportRows, runContentImportFromString } from "../../../lib/content-import/engine.mjs";
import { CONTENT_TYPES } from "../../../lib/content-import/registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "../../..");

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const body = req.body || {};
  const type = String(body.type || req.query?.type || "").trim();
  const dryRun = body.dryRun === true || req.query?.dryRun === "1";

  if (!type) {
    sendJson(res, 400, {
      ok: false,
      error: "missing_type",
      types: CONTENT_TYPES,
    });
    return;
  }

  try {
    let report;
    if (Array.isArray(body.rows)) {
      report = await runContentImportRows({
        rootDir: APP_ROOT,
        type,
        rows: body.rows,
        dryRun,
        source: body.filename || "admin-upload",
      });
    } else if (typeof body.content === "string" && body.content.trim()) {
      report = await runContentImportFromString({
        rootDir: APP_ROOT,
        type,
        content: body.content,
        filename: body.filename || "upload.json",
        dryRun,
      });
    } else {
      sendJson(res, 400, { ok: false, error: "missing_rows_or_content" });
      return;
    }

    sendJson(res, report.ok ? 200 : 422, { ok: report.ok, report });
  } catch (err) {
    console.error("[admin/content-import]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
