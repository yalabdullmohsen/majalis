/**
 * Reasoning pipeline audit — every step is persisted when the DB is available.
 */

export const PIPELINE_STEPS = [
  "question",
  "intent_detection",
  "knowledge_retrieval",
  "evidence_ranking",
  "conflict_resolution",
  "citation_builder",
  "final_answer",
];

export function createPipelineTrace(query, sessionId = null) {
  return {
    query,
    session_id: sessionId,
    started_at: new Date().toISOString(),
    steps: [],
  };
}

export function addPipelineStep(trace, step) {
  const stepName = step.step_name || step.name;
  const order = PIPELINE_STEPS.indexOf(stepName) + 1 || trace.steps.length + 1;
  const row = {
    step_name: stepName,
    step_order: order,
    status: step.status || "completed",
    input_summary: step.input_summary || null,
    output_summary: step.output_summary || null,
    confidence_score: step.confidence_score ?? null,
    evidence_refs: step.evidence_refs || [],
    audit_metadata: step.audit_metadata || {},
    latency_ms: step.latency_ms ?? null,
  };
  trace.steps.push(row);
  return row;
}

export async function persistPipelineTrace(admin, trace, queryLogId = null) {
  if (!admin || !trace?.steps?.length) return { ok: true, persisted: 0, skipped: true };
  const rows = trace.steps.map((step) => ({
    query_log_id: queryLogId,
    session_id: trace.session_id,
    query: trace.query,
    ...step,
  }));

  try {
    const { error } = await admin.from("reasoning_pipeline_steps").insert(rows);
    if (error) throw error;
    return { ok: true, persisted: rows.length };
  } catch (err) {
    return { ok: false, persisted: 0, error: String(err?.message || err) };
  }
}
