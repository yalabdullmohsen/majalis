import { sendJson } from "../_http.js";
import { validateCronAuth } from "../../lib/env-config.mjs";
import { runKnowledgeSync } from "../../lib/knowledge-sync.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, message: "غير مصرح." });
    return;
  }

  try {
    const maxItems = Number(req.query?.maxItems || req.body?.maxItems || 15);
    const skipPublish = req.query?.skipPublish === "1" || req.body?.skipPublish === true;
    const result = await runKnowledgeSync({ triggerType: "cron", maxItems, skipPublish });
    sendJson(res, 200, result);
  } catch (error) {
    console.error("[cron/knowledge-sync] failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "فشل محرك المعرفة.",
      at: new Date().toISOString(),
    });
  }
}
