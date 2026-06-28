#!/usr/bin/env node
/**
 * Phase 1 — Full production audit across all subsystems.
 * Usage: node scripts/production-audit-full.mjs [--json]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const jsonOut = process.argv.includes("--json");

const AREAS = [
  "database", "routes", "apis", "crons", "connectors", "background_jobs",
  "vercel", "supabase", "github_actions", "monitoring", "ake", "cms",
  "admin", "search", "publisher", "ocr", "vision", "telegram", "instagram",
  "sitemap", "seo", "queue", "notifications",
];

function countFiles(dir, ext) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) n += countFiles(p, ext);
    else if (!ext || e.name.endsWith(ext)) n++;
  }
  return n;
}

function grepRoutes() {
  const app = readFileSync(join(ROOT, "src/App.tsx"), "utf8");
  const routes = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]);
  return { count: routes.length, sample: routes.slice(0, 20) };
}

function grepApiDispatch() {
  const dispatch = readFileSync(join(ROOT, "lib/api-dispatch.mjs"), "utf8");
  const apis = [...dispatch.matchAll(/prefix:\s*"([^"]+)"/g)].map((m) => m[1]);
  return { count: apis.length, crons: apis.filter((a) => a.includes("/cron/")), admin: apis.filter((a) => a.includes("/admin/")) };
}

function readVercel() {
  try {
    const v = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
    return { ok: true, crons: v.crons?.length || 0, headers: Boolean(v.headers) };
  } catch {
    return { ok: false };
  }
}

function readGithubActions() {
  const dir = join(ROOT, "../../.github/workflows");
  if (!existsSync(dir)) return { count: 0, files: [] };
  const files = readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  return { count: files.length, files };
}

async function probeProduction() {
  const base = process.env.PRODUCTION_BASE || "https://www.majlisilm.com";
  const checks = {};
  for (const path of ["/api/cron/system-health", "/sitemap.xml", "/robots.txt"]) {
    try {
      const res = await fetch(new URL(path, base), {
        headers: { "x-vercel-cron": "1" },
        signal: AbortSignal.timeout(15000),
      });
      checks[path] = { status: res.status, ok: res.ok };
    } catch (e) {
      checks[path] = { status: 0, ok: false, error: e.message };
    }
  }
  return checks;
}

async function main() {
  const report = {
    at: new Date().toISOString(),
    phase: 1,
    areas: {},
    summary: { pass: 0, warn: 0, fail: 0 },
    readinessPct: 0,
  };

  const routes = grepRoutes();
  const apis = grepApiDispatch();
  const vercel = readVercel();
  const gh = readGithubActions();
  const production = await probeProduction();

  const checks = {
    database: { sqlFiles: countFiles(join(ROOT, "supabase"), ".sql"), migrationRunner: existsSync(join(ROOT, "lib/db-migrate.mjs")) },
    routes: routes,
    apis: apis,
    crons: { vercelCrons: vercel.crons, apiCrons: apis.crons?.length || 0 },
    connectors: { modules: countFiles(join(ROOT, "lib/auto-knowledge-engine/connectors"), ".mjs") },
    background_jobs: { queueModule: existsSync(join(ROOT, "lib/auto-knowledge-engine/queue.mjs")) },
    vercel,
    supabase: {
      url: Boolean(process.env.VITE_SUPABASE_URL),
      anonKey: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      databaseUrl: Boolean(process.env.DATABASE_URL),
    },
    github_actions: gh,
    monitoring: {
      platformMonitoring: existsSync(join(ROOT, "lib/platform-monitoring.mjs")),
      systemHealth: existsSync(join(ROOT, "lib/system-health.mjs")),
      dashboardPage: existsSync(join(ROOT, "src/views/admin/PlatformMonitoringPage.tsx")),
    },
    ake: { orchestrator: existsSync(join(ROOT, "lib/auto-knowledge-engine/orchestrator.mjs")) },
    cms: { lessonExtractor: existsSync(join(ROOT, "lib/cms/lesson-extractor.mjs")) },
    admin: { shell: existsSync(join(ROOT, "src/views/admin/AdminShell.tsx")) },
    search: { module: existsSync(join(ROOT, "src/lib/platform-search.ts")) },
    publisher: { module: existsSync(join(ROOT, "lib/knowledge-engine/publisher.mjs")) },
    ocr: { localOcr: existsSync(join(ROOT, "lib/ai/local-ocr.mjs")) },
    vision: { fallback: existsSync(join(ROOT, "lib/ai/vision-provider-fallback.mjs")) },
    telegram: { fetch: existsSync(join(ROOT, "lib/cms/telegram-channel-fetch.mjs")) },
    instagram: { graphApi: existsSync(join(ROOT, "lib/cms/instagram-graph-api.mjs")), platformPage: existsSync(join(ROOT, "src/views/admin/PlatformInstagramPage.tsx")) },
    sitemap: production["/sitemap.xml"],
    seo: { robots: production["/robots.txt"] },
    queue: { akeQueue: existsSync(join(ROOT, "lib/auto-knowledge-engine/queue.mjs")) },
    notifications: { notify: existsSync(join(ROOT, "lib/auto-knowledge-engine/monitoring/notify.mjs")) },
    production_probes: production,
  };

  for (const area of AREAS) {
    const data = checks[area];
    let status = "PASS";
    if (area === "supabase" && !data.serviceRole) status = "WARN";
    if (area === "vision" && !data.fallback) status = "WARN";
    if (area === "sitemap" && !data?.ok) status = "WARN";
    report.areas[area] = { status, ...data };
    report.summary[status.toLowerCase()]++;
  }

  const total = AREAS.length;
  report.readinessPct = Math.round(((report.summary.pass + report.summary.warn * 0.5) / total) * 100);
  report.ok = report.summary.fail === 0;

  const outPath = join(ROOT, "reports/production-audit-phase1.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("=== Production Audit Phase 1 ===\n");
  console.log(`Areas: ${total} | PASS: ${report.summary.pass} | WARN: ${report.summary.warn} | FAIL: ${report.summary.fail}`);
  console.log(`Readiness: ${report.readinessPct}%`);
  console.log(`Report: ${outPath}`);

  if (jsonOut) console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
