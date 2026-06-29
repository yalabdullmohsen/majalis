/**
 * Phase 6 — Post-deploy automation verification.
 */
import { PRODUCTION_BASE, USER_FACING_ROUTES, PRODUCTION_APIS } from "../release-gate.mjs";
import { runPostDeployVerification } from "../cd/post-deploy-verify.mjs";

const DOMAIN_CHECKS = [
  { id: "routes", label: "Routes", paths: USER_FACING_ROUTES },
  { id: "apis", label: "APIs", apis: PRODUCTION_APIS },
  { id: "cms", label: "CMS", path: "/api/knowledge-search?q=درس&limit=2" },
  { id: "search", label: "Search", path: "/api/intelligent-search?q=صلاة&limit=3" },
  { id: "question_answer", label: "Q&A", path: "/qa" },
  { id: "research", label: "Research", path: "/api/daily-content" },
  { id: "sheikhs", label: "Sheikhs", path: "/lessons" },
  { id: "quran", label: "Quran", path: "/quran" },
  { id: "radio", label: "Radio/Content", path: "/fawaid" },
  { id: "automation", label: "Automation", path: "/api/cron/system-health", auth: true },
];

async function probe(base, path, { method = "GET", auth = false, cronSecret = "" } = {}) {
  const url = new URL(path, base).toString();
  const headers = { Accept: "application/json,text/html" };
  if (auth && cronSecret) headers.Authorization = `Bearer ${cronSecret}`;
  if (auth) headers["x-vercel-cron"] = "1";
  try {
    const res = await fetch(url, { method, headers, signal: AbortSignal.timeout(25_000) });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* html */ }
    const isHtml = text.includes("<!DOCTYPE") || text.includes("<html");
    const ok = res.status >= 200 && res.status < 500 && (json?.ok !== false || isHtml);
    return { ok, status: res.status, json, isHtml };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function runAutomationVerification(options = {}) {
  const started = Date.now();
  const base = options.baseUrl || process.env.MAJALIS_PRODUCTION_URL || PRODUCTION_BASE;
  const cronSecret = process.env.CRON_SECRET || "";
  const checks = [];

  const cdVerify = await runPostDeployVerification({
    baseUrl: base,
    selfHeal: options.selfHeal !== false,
  });

  for (const check of cdVerify.checks || []) {
    checks.push({
      id: check.id,
      label: check.label,
      ok: check.ok,
      category: "cd",
      detail: check.details,
    });
  }

  for (const domain of DOMAIN_CHECKS) {
    if (domain.paths) {
      const results = [];
      for (const p of domain.paths) {
        const r = await probe(base, p);
        results.push({ path: p, ok: r.ok || r.status === 200, status: r.status });
      }
      checks.push({
        id: domain.id,
        label: domain.label,
        ok: results.every((r) => r.ok),
        category: "domain",
        detail: results,
      });
      continue;
    }

    if (domain.apis) {
      const results = [];
      for (const api of domain.apis) {
        const r = await probe(base, api.path, { method: api.method || "GET" });
        results.push({ path: api.path, ok: r.ok, status: r.status });
      }
      checks.push({
        id: domain.id,
        label: domain.label,
        ok: results.every((r) => r.ok),
        category: "domain",
        detail: results,
      });
      continue;
    }

    const r = await probe(base, domain.path, { auth: domain.auth, cronSecret });
    checks.push({
      id: domain.id,
      label: domain.label,
      ok: r.ok,
      category: "domain",
      detail: { path: domain.path, status: r.status, error: r.error },
    });
  }

  const aiCheck = cdVerify.checks?.find((c) => c.id === "ai");
  checks.push({
    id: "ai",
    label: "AI",
    ok: aiCheck?.ok,
    status: aiCheck?.details?.status,
    category: "cd",
  });

  const queueCheck = cdVerify.checks?.find((c) => c.id === "queue");
  checks.push({
    id: "queue",
    label: "Queue",
    ok: queueCheck?.ok,
    category: "cd",
    detail: queueCheck?.details,
  });

  checks.push({
    id: "workers",
    label: "Workers",
    ok: cdVerify.ok,
    category: "inferred",
    detail: "inferred from CD verify",
  });

  const failed = checks.filter((c) => !c.ok);
  const critical = failed.filter((c) =>
    ["routes", "apis", "database", "system_health", "healthz"].includes(c.id),
  );

  return {
    ok: critical.length === 0,
    deploySuccess: failed.length === 0,
    healthy: cdVerify.healthy,
    checks,
    failedCount: failed.length,
    failedChecks: failed.map((c) => c.id),
    criticalFailed: critical.map((c) => c.id),
    durationMs: Date.now() - started,
    productionUrl: base,
    cdVerify,
  };
}
