/**
 * Phase 4 — Unified Health Score (0–100) with breakdown.
 */
export function computeUnifiedHealthScore(input) {
  const weights = {
    database: 15,
    migrations: 10,
    automation: 10,
    smartCms: 8,
    crons: 10,
    apis: 8,
    routes: 7,
    queue: 5,
    workers: 5,
    search: 5,
    ai: 5,
    storage: 4,
    performance: 4,
    dataIntegrity: 4,
  };

  const breakdown = [];
  let totalScore = 0;
  let totalWeight = 0;

  function add(id, label, score, detail) {
    const w = weights[id] || 5;
    const weighted = (Math.max(0, Math.min(100, score)) / 100) * w;
    totalScore += weighted;
    totalWeight += w;
    breakdown.push({ id, label, score: Math.round(score), weight: w, weighted: Math.round(weighted * 10) / 10, detail });
  }

  const validation = input.startupValidation || {};
  const tables = validation.tables || {};
  const tablePct = tables.expected ? (tables.present / tables.expected) * 100 : 50;
  add("database", "قاعدة البيانات", tablePct, `${tables.present ?? 0}/${tables.expected ?? 0} جداول`);

  const migrations = input.migrationState || {};
  const migScore = migrations.failed?.count
    ? Math.max(0, 100 - migrations.failed.count * 20)
    : migrations.pending?.count
      ? Math.max(40, 100 - migrations.pending.count * 2)
      : 100;
  add("migrations", "Migrations", migScore, `applied=${migrations.applied?.count ?? 0} pending=${migrations.pending?.count ?? 0}`);

  const lockdown = input.lockdown || {};
  const systems = lockdown.systems || [];
  const sysOp = systems.filter((s) => s.status === "operational").length;
  const sysPct = systems.length ? (sysOp / systems.length) * 100 : 50;
  add("automation", "الأتمتة", sysPct, `${sysOp}/${systems.length} أنظمة`);

  const cms = lockdown.cmsTables || {};
  const cmsPct = cms.missing?.length === 0 ? 100 : cms.present ? (cms.present / (cms.present + cms.missing.length)) * 100 : 30;
  add("smartCms", "Smart CMS", cmsPct, cms.missing?.length ? `ناقص: ${cms.missing.slice(0, 2).join(", ")}` : "كامل");

  const crons = lockdown.crons || [];
  const cronReach = crons.filter((c) => c.endpointReachable).length;
  add("crons", "Cron Jobs", crons.length ? (cronReach / crons.length) * 100 : 50, `${cronReach}/${crons.length}`);

  const apis = lockdown.apis || [];
  const apiOk = apis.filter((a) => a.ok).length;
  add("apis", "APIs", apis.length ? (apiOk / apis.length) * 100 : 50, `${apiOk}/${apis.length}`);

  const routes = lockdown.routes || [];
  const routeOk = routes.filter((r) => r.ok).length;
  add("routes", "Routes", routes.length ? (routeOk / routes.length) * 100 : 50, `${routeOk}/${routes.length}`);

  const verify = input.automationVerify || {};
  const queueCheck = verify.checks?.find((c) => c.id === "queue");
  add("queue", "Queue", queueCheck?.ok ? 100 : 40, queueCheck?.ok ? "سليم" : "مشاكل");

  const workerCheck = verify.checks?.find((c) => c.id === "workers");
  add("workers", "Workers", workerCheck?.ok !== false ? 90 : 35, workerCheck?.detail || "—");

  const searchCheck = verify.checks?.find((c) => c.id === "search");
  add("search", "البحث", searchCheck?.ok ? 100 : 30, searchCheck?.ok ? "OK" : "فشل");

  const aiCheck = verify.checks?.find((c) => c.id === "ai");
  add("ai", "AI", aiCheck?.ok ? 100 : aiCheck?.status === "fallback" ? 70 : 25, aiCheck?.status || "—");

  const storage = validation.storage || {};
  const bucketCount = Object.values(storage.buckets || {}).filter(Boolean).length;
  const bucketTotal = Object.keys(storage.buckets || {}).length || 2;
  add("storage", "Storage", bucketTotal ? (bucketCount / bucketTotal) * 100 : 50, `${bucketCount}/${bucketTotal} buckets`);

  const perfMs = verify.durationMs || 0;
  const perfScore = perfMs < 30_000 ? 100 : perfMs < 60_000 ? 80 : perfMs < 120_000 ? 60 : 40;
  add("performance", "الأداء", perfScore, `${Math.round(perfMs / 1000)}s verify`);

  const integrity = lockdown.dataIntegrity || {};
  add("dataIntegrity", "سلامة البيانات", integrity.issueCount === 0 ? 100 : Math.max(0, 100 - integrity.issueCount * 15), `${integrity.issueCount ?? 0} مشاكل`);

  const healthScore = Math.round((totalScore / totalWeight) * 100);
  const deductions = breakdown.filter((b) => b.score < 80).map((b) => ({ id: b.id, label: b.label, score: b.score, detail: b.detail }));

  return {
    healthScore,
    readinessPct: Math.min(100, Math.round(healthScore * 0.85 + (lockdown.readinessPct ?? 0) * 0.15)),
    breakdown,
    deductions,
    weights,
  };
}
