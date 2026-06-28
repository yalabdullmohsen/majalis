/**
 * CD deploy state — persist pipeline runs and deployment events.
 */

import { getSupabaseAdmin, isMissingTableError } from "../supabase-admin.mjs";

export async function recordPipelineRun(run) {
  const admin = getSupabaseAdmin();
  const record = {
    pipeline_type: run.pipelineType || "autonomous-cd",
    status: run.status || "running",
    branch: run.branch || null,
    commit_sha: run.commitSha || null,
    pr_number: run.prNumber || null,
    risk_level: run.riskLevel || "low",
    auto_merge: run.autoMerge ?? false,
    stages: run.stages || [],
    failure_reason: run.failureReason || null,
    fix_suggestion: run.fixSuggestion || null,
    duration_ms: run.durationMs || null,
    finished_at: run.finishedAt || null,
    metadata: run.metadata || {},
  };

  if (!admin) {
    console.log(JSON.stringify({ tag: "cd:pipeline-run", ...record }));
    return { ok: true, id: null, _fallback: true };
  }

  try {
    const { data, error } = await admin.from("cd_pipeline_runs").insert(record).select("id").single();
    if (error) throw error;
    return { ok: true, id: data.id };
  } catch (err) {
    if (isMissingTableError(err)) {
      console.log(JSON.stringify({ tag: "cd:pipeline-run", ...record }));
      return { ok: true, id: null, _fallback: true };
    }
    return { ok: false, error: err.message };
  }
}

export async function recordDeployment(event) {
  const admin = getSupabaseAdmin();
  const record = {
    deployment_id: event.deploymentId || null,
    commit_sha: event.commitSha || null,
    branch: event.branch || "main",
    status: event.status || "unknown",
    health_status: event.healthStatus || null,
    vercel_url: event.vercelUrl || null,
    production_url: event.productionUrl || null,
    build_duration_ms: event.buildDurationMs || null,
    verify_duration_ms: event.verifyDurationMs || null,
    rollback_of: event.rollbackOf || null,
    failure_checks: event.failureChecks || [],
    self_heal_actions: event.selfHealActions || [],
    metadata: event.metadata || {},
  };

  if (!admin) {
    console.log(JSON.stringify({ tag: "cd:deployment", ...record }));
    return { ok: true, id: null, _fallback: true };
  }

  try {
    const { data, error } = await admin.from("cd_deployments").insert(record).select("id").single();
    if (error) throw error;
    return { ok: true, id: data.id };
  } catch (err) {
    if (isMissingTableError(err)) {
      console.log(JSON.stringify({ tag: "cd:deployment", ...record }));
      return { ok: true, id: null, _fallback: true };
    }
    return { ok: false, error: err.message };
  }
}

export async function getDeploymentDashboardStats() {
  const admin = getSupabaseAdmin();
  if (!admin) return buildFallbackStats();

  try {
    const [
      { data: lastDeploy },
      { data: lastRun },
      { data: lastRollback },
      { count: totalDeploys },
      { count: successDeploys },
      { count: rollbackCount },
      { count: autoMergeCount },
      { data: recentRuns },
      { data: recentDeploys },
      { data: healEvents },
    ] = await Promise.all([
      admin.from("cd_deployments").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("cd_pipeline_runs").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("cd_deployments").select("*").eq("status", "rollback").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("cd_deployments").select("id", { count: "exact", head: true }),
      admin.from("cd_deployments").select("id", { count: "exact", head: true }).eq("health_status", "healthy"),
      admin.from("cd_deployments").select("id", { count: "exact", head: true }).eq("status", "rollback"),
      admin.from("cd_pipeline_runs").select("id", { count: "exact", head: true }).eq("auto_merge", true).eq("status", "success"),
      admin.from("cd_pipeline_runs").select("*").order("created_at", { ascending: false }).limit(10),
      admin.from("cd_deployments").select("*").order("created_at", { ascending: false }).limit(10),
      admin.from("cd_self_heal_events").select("*").order("created_at", { ascending: false }).limit(15),
    ]);

    const deploySuccessRate = totalDeploys
      ? Math.round(((successDeploys || 0) / totalDeploys) * 100)
      : null;

    return {
      ok: true,
      lastDeployment: lastDeploy,
      lastPipelineRun: lastRun,
      lastRollback,
      stats: {
        totalDeploys: totalDeploys || 0,
        successDeploys: successDeploys || 0,
        rollbackCount: rollbackCount || 0,
        autoMergeCount: autoMergeCount || 0,
        deploySuccessRate,
      },
      recentRuns: recentRuns || [],
      recentDeployments: recentDeploys || [],
      selfHealEvents: healEvents || [],
    };
  } catch (err) {
    if (isMissingTableError(err)) return buildFallbackStats();
    return { ok: false, error: err.message, ...buildFallbackStats() };
  }
}

function buildFallbackStats() {
  return {
    ok: true,
    _fallback: true,
    lastDeployment: null,
    lastPipelineRun: null,
    lastRollback: null,
    stats: { totalDeploys: 0, successDeploys: 0, rollbackCount: 0, autoMergeCount: 0, deploySuccessRate: null },
    recentRuns: [],
    recentDeployments: [],
    selfHealEvents: [],
  };
}

export async function logSelfHealEvent(event) {
  const admin = getSupabaseAdmin();
  const record = {
    component: event.component || "cd",
    issue_type: event.issueType,
    action_taken: event.actionTaken,
    success: event.success !== false,
    attempt: event.attempt ?? 1,
    error: event.error || null,
    metadata: event.metadata || {},
  };

  if (!admin) {
    console.log(JSON.stringify({ tag: "cd:self-heal", ...record }));
    return;
  }

  try {
    await admin.from("cd_self_heal_events").insert(record);
  } catch {
    console.log(JSON.stringify({ tag: "cd:self-heal", ...record }));
  }
}
