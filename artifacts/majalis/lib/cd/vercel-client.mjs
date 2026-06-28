/**
 * Vercel deployment client — poll status, list deployments, rollback.
 */

const VERCEL_API = "https://api.vercel.com";

export function getVercelConfig() {
  return {
    token: process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN,
    projectId: process.env.VERCEL_PROJECT_ID,
    teamId: process.env.VERCEL_ORG_ID || process.env.VERCEL_TEAM_ID,
    productionUrl: process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com",
  };
}

function vercelHeaders(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function waitForProductionDeploy({
  commitSha,
  timeoutMs = 300_000,
  pollMs = 10_000,
} = {}) {
  const { token, projectId, teamId } = getVercelConfig();
  if (!token || !projectId) {
    return { ok: false, skipped: true, reason: "VERCEL_TOKEN or VERCEL_PROJECT_ID not configured" };
  }

  const started = Date.now();
  const teamQuery = teamId ? `&teamId=${teamId}` : "";

  while (Date.now() - started < timeoutMs) {
    const res = await fetch(
      `${VERCEL_API}/v6/deployments?projectId=${projectId}&target=production&limit=5${teamQuery}`,
      { headers: vercelHeaders(token) },
    );
    if (!res.ok) {
      return { ok: false, error: `Vercel API ${res.status}` };
    }

    const json = await res.json();
    const deployments = json.deployments || [];

    for (const d of deployments) {
      const sha = d.meta?.githubCommitSha || d.gitSource?.sha;
      const matches = !commitSha || sha?.startsWith(commitSha.slice(0, 7)) || sha === commitSha;
      if (!matches) continue;

      if (d.state === "READY") {
        return {
          ok: true,
          deploymentId: d.uid,
          url: d.url,
          readyState: d.readyState,
          createdAt: d.createdAt,
          durationMs: Date.now() - started,
        };
      }
      if (d.state === "ERROR" || d.state === "CANCELED") {
        return { ok: false, deploymentId: d.uid, state: d.state, error: d.errorMessage || d.state };
      }
    }

    await new Promise((r) => setTimeout(r, pollMs));
  }

  return { ok: false, error: "deploy_timeout", durationMs: Date.now() - started };
}

export async function listRecentDeployments(limit = 10) {
  const { token, projectId, teamId } = getVercelConfig();
  if (!token || !projectId) return { ok: false, deployments: [] };

  const teamQuery = teamId ? `&teamId=${teamId}` : "";
  const res = await fetch(
    `${VERCEL_API}/v6/deployments?projectId=${projectId}&target=production&limit=${limit}${teamQuery}`,
    { headers: vercelHeaders(token) },
  );
  if (!res.ok) return { ok: false, error: `Vercel API ${res.status}`, deployments: [] };

  const json = await res.json();
  return {
    ok: true,
    deployments: (json.deployments || []).map((d) => ({
      id: d.uid,
      url: d.url,
      state: d.state,
      readyState: d.readyState,
      createdAt: d.createdAt,
      commitSha: d.meta?.githubCommitSha || d.gitSource?.sha,
      commitMessage: d.meta?.githubCommitMessage,
    })),
  };
}

export async function rollbackToDeployment(deploymentId) {
  const { token, projectId, teamId } = getVercelConfig();
  if (!token || !projectId || !deploymentId) {
    return { ok: false, error: "missing_vercel_config" };
  }

  const teamQuery = teamId ? `?teamId=${teamId}` : "";
  const res = await fetch(
    `${VERCEL_API}/v13/deployments/${deploymentId}/promote${teamQuery}`,
    { method: "POST", headers: vercelHeaders(token), body: JSON.stringify({}) },
  );

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body.slice(0, 500), status: res.status };
  }

  const json = await res.json();
  return { ok: true, deployment: json };
}

export async function rollbackToPreviousHealthy(currentDeploymentId) {
  const listed = await listRecentDeployments(20);
  if (!listed.ok) return listed;

  const healthy = listed.deployments.filter(
    (d) => d.id !== currentDeploymentId && d.state === "READY",
  );
  if (healthy.length < 2) {
    return { ok: false, error: "no_previous_healthy_deployment" };
  }

  const previous = healthy[1];
  const result = await rollbackToDeployment(previous.id);
  return { ...result, rolledBackTo: previous };
}
