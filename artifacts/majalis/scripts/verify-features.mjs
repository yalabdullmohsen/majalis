#!/usr/bin/env node
/**
 * Feature delivery verification — no feature is "done" unless this script passes.
 *
 * Usage:
 *   node scripts/verify-features.mjs
 *   node scripts/verify-features.mjs --production
 *   node scripts/verify-features.mjs --json
 *   node scripts/verify-features.mjs --production --json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const DATA = path.join(ROOT, "data/feature-registry.json");

const production = process.argv.includes("--production");
const jsonOut = process.argv.includes("--json");
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ||
  JSON.parse(fs.readFileSync(DATA, "utf8")).productionUrl ||
  "https://www.majlisilm.com";

const ENV_KEYS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "CRON_SECRET",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "INSTAGRAM_GRAPH_ACCESS_TOKEN",
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_APP_ID",
  "INSTAGRAM_APP_SECRET",
];

function envPresent(key) {
  const aliases = {
    VITE_SUPABASE_URL: ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"],
    VITE_SUPABASE_ANON_KEY: ["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  };
  if (process.env[key]) return true;
  for (const alt of aliases[key] || []) {
    if (process.env[alt]) return true;
  }
  return false;
}

function grepCode(marker) {
  const searchRoot = ROOT;
  try {
    const out = execSync(
      `rg -l "${marker.replace(/"/g, '\\"')}" "${searchRoot}" --glob '!node_modules' --glob '!dist' 2>/dev/null || true`,
      { encoding: "utf8" },
    ).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function gitMerged(branch) {
  if (!branch) return null;
  try {
    execSync(`git merge-base --is-ancestor origin/${branch} origin/main 2>/dev/null`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

let prodBundleCache = null;
async function fetchProdBundleText() {
  if (prodBundleCache !== null) return prodBundleCache;
  try {
    const html = await fetch(`${base}/`).then((r) => r.text());
    const match = html.match(/\/assets\/index-[^"]+\.js/);
    if (!match) {
      prodBundleCache = "";
      return prodBundleCache;
    }
    prodBundleCache = await fetch(`${base}${match[0]}`).then((r) => r.text());
    return prodBundleCache;
  } catch {
    prodBundleCache = "";
    return prodBundleCache;
  }
}

async function checkRoute(pathname) {
  try {
    const res = await fetch(`${base}${pathname}`, { redirect: "follow" });
    const text = await res.text();
    return {
      status: res.status,
      ok: res.status === 200 && !text.includes("تعذر عرض هذه الصفحة"),
      snippet: text.slice(0, 5000),
    };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

async function checkApi(endpoint) {
  try {
    const res = await fetch(`${base}${endpoint}`, {
      redirect: "follow",
      method: endpoint.includes("assistant") && !endpoint.includes("health") ? "POST" : "GET",
      headers: endpoint.includes("assistant") && !endpoint.includes("health") ? { "Content-Type": "application/json" } : {},
      body:
        endpoint.includes("assistant") && !endpoint.includes("health")
          ? JSON.stringify({ question: "ما حكم الوضوء؟" })
          : undefined,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* ignore */
    }
    return { status: res.status, ok: res.status >= 200 && res.status < 400 && json?.ok !== false, json, text: text.slice(0, 200) };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

function resolveStatus(feature, ctx) {
  const codeOk = feature.codeMarkers.every((m) => ctx.codeHits[m]);
  const merged = feature.branch ? ctx.mergedBranches[feature.branch] : true;
  const prodOk =
    !production ||
    (feature.productionMarkers?.every((m) => ctx.prodHits[m]) &&
      !(feature.blockedProductionMarkers || []).some((m) => ctx.prodBlocked[m]));
  const secretsOk = (feature.requiredSecrets || []).every((k) => ctx.env[k]);
  const routeOk =
    !production || (feature.routes || []).every((r) => ctx.routes[r]?.ok !== false);

  if (!codeOk) return "Missing";
  if (!merged && feature.branch) return "Partial";
  if (production && !prodOk) return merged ? "Blocked by Deployment" : "Partial";
  if (!secretsOk) return "Blocked by Missing Secrets";
  if (feature.usesMock && production) return "Not Production Complete";
  if (!routeOk && production) return "Blocked by Deployment";
  if (codeOk && merged && (!production || prodOk)) return "Done";
  return "Partial";
}

async function main() {
  const registry = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const env = Object.fromEntries(ENV_KEYS.map((k) => [k, envPresent(k)]));

  const codeHits = {};
  const mergedBranches = {};
  for (const f of registry.features) {
    for (const m of f.codeMarkers) codeHits[m] = grepCode(m);
    if (f.branch) mergedBranches[f.branch] = gitMerged(f.branch);
  }

  let prodBundle = "";
  const prodHits = {};
  const prodBlocked = {};
  const routes = {};

  if (production) {
    prodBundle = await fetchProdBundleText();
    for (const f of registry.features) {
      for (const m of f.productionMarkers || []) {
        prodHits[m] = prodBundle.includes(m) || (await checkRoute(f.routes?.[0] || "/")).snippet.includes(m);
      }
      for (const m of f.blockedProductionMarkers || []) {
        prodBlocked[m] = prodBundle.includes(m) || (await checkRoute(f.routes?.[0] || "/")).snippet.includes(m);
      }
    }
    const uniqueRoutes = [...new Set(registry.features.flatMap((f) => f.routes || []))];
    for (const r of uniqueRoutes) {
      routes[r] = await checkRoute(r);
    }
  }

  const apiResults = {};
  if (production) {
    for (const ep of ["/api/healthz", "/api/assistant/health", "/api/assistant", "/api/knowledge-search?q=صلاة"]) {
      apiResults[ep] = await checkApi(ep);
    }
  }

  const rows = registry.features.map((f) => {
    const status = resolveStatus(f, { codeHits, mergedBranches, prodHits, prodBlocked, routes, env });
    return {
      id: f.id,
      name: f.name,
      phase: f.phase,
      pr: f.pr ?? null,
      branch: f.branch ?? null,
      mergedToMain: f.branch ? mergedBranches[f.branch] : true,
      inCode: f.codeMarkers.every((m) => codeHits[m]),
      hasRoute: Boolean(f.routes?.length),
      productionOk: production
        ? (f.productionMarkers || []).every((m) => prodHits[m]) &&
          !(f.blockedProductionMarkers || []).some((m) => prodBlocked[m])
        : null,
      needsMigration: Boolean(f.migrations?.length),
      migrations: f.migrations || [],
      needsSecrets: (f.requiredSecrets || []).filter((k) => !env[k]),
      usesMock: f.usesMock,
      hasUi: f.codeMarkers.some((m) => grepCode(m)),
      tested: production ? status === "Done" : null,
      status,
      routes: f.routes,
    };
  });

  const report = {
    at: new Date().toISOString(),
    branch: execSync("git branch --show-current", { encoding: "utf8" }).trim(),
    mainHead: execSync("git rev-parse --short origin/main 2>/dev/null || git rev-parse --short main", {
      encoding: "utf8",
    }).trim(),
    production,
    productionUrl: production ? base : null,
    env,
    apiResults: production ? apiResults : undefined,
    features: rows,
    summary: {
      total: rows.length,
      done: rows.filter((r) => r.status === "Done").length,
      partial: rows.filter((r) => r.status === "Partial").length,
      blocked: rows.filter((r) => r.status.startsWith("Blocked")).length,
      missing: rows.filter((r) => r.status === "Missing").length,
      notProductionComplete: rows.filter((r) => r.status === "Not Production Complete").length,
    },
  };

  fs.writeFileSync(path.join(ROOT, "data/feature-audit-report.json"), JSON.stringify(report, null, 2));

  if (jsonOut) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Feature audit — ${report.at}`);
    console.log(`Git branch: ${report.branch} | main@${report.mainHead}`);
    if (production) console.log(`Production: ${base}\n`);
    console.log(
      `Summary: Done=${report.summary.done} Partial=${report.summary.partial} Blocked=${report.summary.blocked} Missing=${report.summary.missing} Mock=${report.summary.notProductionComplete}\n`,
    );
    for (const r of rows) {
      const flags = [
        r.inCode ? "code" : "NO-CODE",
        r.mergedToMain ? "main" : "NOT-MAIN",
        production && r.productionOk ? "prod" : production ? "NO-PROD" : "",
        r.usesMock ? "mock" : "",
        r.needsSecrets.length ? `secrets:${r.needsSecrets.join(",")}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      console.log(`[${r.status.padEnd(28)}] ${r.name}`);
      console.log(`  ${flags}`);
    }
    console.log(`\nReport: data/feature-audit-report.json`);
  }

  const failed = rows.some(
    (r) => r.status !== "Done" && ["quran-v2", "lessons-v2", "qa-taxonomy", "quran-stories"].includes(r.id),
  );
  process.exit(production && failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
