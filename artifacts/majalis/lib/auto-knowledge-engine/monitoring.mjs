/**
 * Auto Knowledge Engine — logging utility
 */

export function akeLog(scope, data, level = "info") {
  const entry = { at: new Date().toISOString(), scope, level, ...data };
  if (level === "error") console.error(`[ake:${scope}]`, JSON.stringify(entry));
  else console.info(`[ake:${scope}]`, JSON.stringify(entry));
  return entry;
}

export async function auditLog(admin, payload) {
  if (!admin) return;
  try {
    await admin.from("ake_audit_log").insert({
      run_id: payload.runId || null,
      connector_id: payload.connectorId || null,
      action: payload.action,
      entity_type: payload.entityType || null,
      entity_id: payload.entityId || null,
      status: payload.status || "info",
      message: payload.message || null,
      details: payload.details || null,
    });
  } catch (err) {
    akeLog("audit", { error: err.message }, "error");
  }
}
