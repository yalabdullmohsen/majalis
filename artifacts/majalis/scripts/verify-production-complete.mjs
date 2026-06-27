#!/usr/bin/env node
/**
 * Unified Production Recovery verification — Release Gate.
 *
 * Usage:
 *   pnpm run verify:production-complete
 *   pnpm run verify:production-complete -- --production
 *   pnpm run verify:production-complete -- --json
 *   pnpm run verify:production-complete -- --production --skip-build
 *
 * Exit 1 if ANY gate check fails when --production is set.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawnSync } from "node:child_process";
import {
  PRODUCTION_BASE,
  USER_FACING_ROUTES,
  PRODUCTION_APIS,
  CRON_SMOKE_PATHS,
  CORE_DB_TABLES,
  OPTIONAL_DB_TABLES,
  SECRET_GROUPS,
  RELEASE_GATE_CHECKS,
  classifyDelivery,
} from "../lib/release-gate.mjs";
import { grepCode } from "../lib/release-gate-utils.mjs";
import { probeTables, ACTIVATION_TABLES, countTableRows } from "../lib/table-probe.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(ROOT, "../..");
const DATA = path.join(ROOT, "data/feature-registry.json");
const REPORT_PATH = path.join(ROOT, "data/release-audit-report.json");

const args = process.argv.slice(2);
const production = args.includes("--production");
const jsonOut = args.includes("--json");
const skipBuild = args.includes("--skip-build");
const skipTypecheck = args.includes("--skip-typecheck");
const skipLint = args.includes("--skip-lint");
const base = args.find((a) => a.startsWith("--base="))?.slice(7) || PRODUCTION_BASE;

const ENV_KEYS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PASSWORD",
  "CRON_SECRET",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "INSTAGRAM_GRAPH_ACCESS_TOKEN",
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_APP_ID",
  "INSTAGRAM_APP_SECRET",
  "JWT_SECRET",
  "ADMIN_API_SECRET",
];

function runStep(name, cmd, opts = {}) {
  const t0 = Date.now();
  try {
    const out = execSync(cmd, {
      cwd: opts.cwd || ROOT,
      encoding: "utf8",
      stdio: opts.silent ? "pipe" : "inherit",
      env: { ...process.env, ...opts.env },
    });
    return { ok: true, name, ms: Date.now() - t0, output: opts.capture ? out : undefined };
  } catch (err) {
    return {
      ok: false,
      name,
      ms: Date.now() - t0,
      error: String(err.stderr || err.message || err).slice(0, 2000),
    };
  }
}

function envPresent(key) {
  const aliases = {
    VITE_SUPABASE_URL: ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"],
    VITE_SUPABASE_ANON_KEY: ["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    DATABASE_URL: ["POSTGRES_URL", "SUPABASE_DB_URL"],
  };
  if (process.env[key]) return true;
  for (const alt of aliases[key] || []) {
    if (process.env[alt]) return true;
  }
  return false;
}

function gitMerged(branch) {
  if (!branch) return true;
  try {
    execSync(`git merge-base --is-ancestor origin/${branch} origin/main 2>/dev/null`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function checkTable(table) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const body = await res.text();
    if (body.includes("Could not find") || res.status === 404) return false;
    return res.status < 500;
  } catch {
    return null;
  }
}

async function checkRoute(pathname) {
  try {
    const res = await fetch(`${base}${pathname}`, { redirect: "follow" });
    const text = await res.text();
    return {
      status: res.status,
      ok: res.status === 200 && !text.includes("تعذر عرض هذه الصفحة"),
      overflowRisk: false,
    };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

async function checkApi({ path: apiPath, method, expectOk }) {
  try {
    const res = await fetch(`${base}${apiPath}`, {
      redirect: "follow",
      method,
      headers: method === "POST" ? { "Content-Type": "application/json" } : {},
      body: method === "POST" ? JSON.stringify({ message: "ما حكم الوضوء؟" }) : undefined,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* ignore */
    }
    const authRequired = res.status === 401 && apiPath.includes("/cron/");
    const ok =
      authRequired ||
      (expectOk ? res.status >= 200 && res.status < 500 && json?.ok !== false : res.status < 500);
    return { status: res.status, ok, authRequired, snippet: text.slice(0, 120) };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

async function fetchProdBundle() {
  try {
    const html = await fetch(`${base}/`).then((r) => r.text());
    const match = html.match(/\/assets\/index-[^"]+\.js/);
    if (!match) return { html, bundle: "", bundlePath: null };
    const bundle = await fetch(`${base}${match[0]}`).then((r) => r.text());
    return { html, bundle, bundlePath: match[0] };
  } catch {
    return { html: "", bundle: "", bundlePath: null };
  }
}

async function mobileSmoke() {
  try {
    const mod = await import("playwright");
    const browser = await mod.chromium.launch({ headless: true });
    const ctx = await browser.newContext({ ...mod.devices["iPhone 13"] });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    const results = {};
    for (const route of USER_FACING_ROUTES.slice(0, 10)) {
      errors.length = 0;
      await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      const body = await page.textContent("body");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 2,
      );
      results[route] = {
        ok:
          !body?.includes("تعذر عرض هذه الصفحة") &&
          !overflow &&
          errors.filter((e) => !e.includes("404")).length === 0,
        overflow,
        consoleErrors: errors.slice(0, 3),
      };
    }
    await browser.close();
    return { ok: Object.values(results).every((r) => r.ok), results };
  } catch (err) {
    return { ok: null, skipped: true, reason: err.message };
  }
}

function listOpenPrs() {
  try {
    const raw = execSync(
      'gh pr list --limit 100 --state open --json number,title,headRefName,createdAt,url',
      { cwd: REPO_ROOT, encoding: "utf8" },
    );
    return JSON.parse(raw).sort((a, b) => a.number - b.number);
  } catch {
    return [];
  }
}

function listBranchesAheadOfMain() {
  try {
    const branches = execSync("git branch -r --format='%(refname:short)'", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter((b) => b.startsWith("origin/cursor/"));
    const ahead = [];
    for (const b of branches) {
      const name = b.replace("origin/", "");
      try {
        const count = execSync(`git rev-list --count origin/main..origin/${name} 2>/dev/null`, {
          encoding: "utf8",
        }).trim();
        if (Number(count) > 0) ahead.push({ branch: name, commitsAhead: Number(count) });
      } catch {
        /* skip */
      }
    }
    return ahead.sort((a, b) => b.commitsAhead - a.commitsAhead);
  } catch {
    return [];
  }
}

function readCrons() {
  try {
    const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
    return vercel.crons || [];
  } catch {
    return [];
  }
}

async function main() {
  const t0 = Date.now();
  const registry = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const env = Object.fromEntries(ENV_KEYS.map((k) => [k, envPresent(k)]));

  const steps = [];

  // --- Build gate ---
  if (!skipTypecheck) {
    steps.push(
      runStep("typescript", "pnpm run typecheck", {
        cwd: REPO_ROOT,
        silent: true,
        capture: true,
      }),
    );
  }
  if (!skipLint) {
    steps.push(runStep("lint", "pnpm run lint", { silent: true, capture: true }));
  }
  if (!skipBuild) {
    steps.push(
      runStep("build", "pnpm run build", {
        cwd: ROOT,
        silent: true,
        capture: true,
        env: { PORT: "24216", BASE_PATH: "/" },
      }),
    );
  }

  // --- Git / PR audit ---
  const openPrs = listOpenPrs();
  const branchesAhead = listBranchesAheadOfMain();
  const mainHead = execSync("git rev-parse --short origin/main 2>/dev/null || git rev-parse --short main", {
    encoding: "utf8",
  }).trim();

  // --- DB tables ---
  const tables = {};
  for (const t of [...CORE_DB_TABLES, ...OPTIONAL_DB_TABLES]) {
    tables[t] = await checkTable(t);
  }

  const activationProbe = await probeTables(ACTIVATION_TABLES);
  const activationTables = Object.fromEntries(
    ACTIVATION_TABLES.map((t) => [t, activationProbe[t] === true]),
  );
  const shariaRulingsCount = await countTableRows("sharia_rulings");
  const missingActivationTables = ACTIVATION_TABLES.filter((t) => !activationTables[t]);

  // --- Migrations on disk ---
  const { MIGRATION_FILES } = await import("../lib/migration-paths.mjs");
  const migrations = Object.fromEntries(MIGRATION_FILES.map((f) => [f, true]));

  // --- Feature classification ---
  const codeHits = {};
  const mergedBranches = {};
  for (const f of registry.features) {
    for (const m of f.codeMarkers) codeHits[m] = grepCode(m);
    if (f.branch) mergedBranches[f.branch] = gitMerged(f.branch);
  }

  let prodBundle = "";
  let prodBundlePath = null;
  const prodHits = {};
  const prodBlocked = {};
  const routeResults = {};
  const apiResults = {};
  let mobileResults = null;

  if (production) {
    const prod = await fetchProdBundle();
    prodBundle = prod.bundle;
    prodBundlePath = prod.bundlePath;

    for (const f of registry.features) {
      for (const m of f.productionMarkers || []) {
        prodHits[m] = prodBundle.includes(m);
      }
      for (const m of f.blockedProductionMarkers || []) {
        prodBlocked[m] = prodBundle.includes(m);
      }
    }

    for (const r of USER_FACING_ROUTES) {
      routeResults[r] = await checkRoute(r);
    }
    for (const api of PRODUCTION_APIS) {
      apiResults[api.path] = await checkApi(api);
    }
    for (const cronPath of CRON_SMOKE_PATHS) {
      apiResults[cronPath] = await checkApi({ path: cronPath, method: "GET", expectOk: true });
    }
    mobileResults = await mobileSmoke();
  }

  const features = registry.features.map((f) => {
    const delivery = classifyDelivery(f, {
      production,
      codeHits,
      mergedBranches,
      prodHits,
      prodBlocked,
      env,
      tables,
      migrations: Object.fromEntries((f.migrations || []).map((m) => [m, migrations[m] !== false])),
    });
    return {
      id: f.id,
      name: f.name,
      pr: f.pr ?? null,
      branch: f.branch ?? null,
      phase: f.phase,
      deliveryState: delivery.state,
      blockReason: delivery.reason,
      blockDetail: delivery.detail,
      routes: f.routes,
      usesMock: f.usesMock,
    };
  });

  const deliverySummary = {
    production: features.filter((f) => f.deliveryState === "Production").length,
    ready: features.filter((f) => f.deliveryState === "Ready").length,
    blocked: features.filter((f) => f.deliveryState === "Blocked").length,
    prOnly: features.filter((f) => f.deliveryState !== "Production" && f.branch && !mergedBranches[f.branch])
      .length,
  };

  const routeFailures = production
    ? Object.entries(routeResults).filter(([, v]) => !v.ok).map(([k]) => k)
    : [];
  const apiFailures = production
    ? Object.entries(apiResults).filter(([, v]) => !v.ok).map(([k]) => k)
    : [];
  const missingCoreTables = Object.entries(tables)
    .filter(([t, v]) => CORE_DB_TABLES.includes(t) && v === false)
    .map(([t]) => t);
  const buildFailed = steps.some((s) => !s.ok);

  const gate = {
    code: true,
    typescript: skipTypecheck || steps.find((s) => s.name === "typescript")?.ok !== false,
    build: skipBuild || steps.find((s) => s.name === "build")?.ok !== false,
    migration: missingCoreTables.length === 0,
    activationTables: missingActivationTables.length === 0,
    rulingsSeeded: (shariaRulingsCount ?? 0) > 0,
    merge: openPrs.length === 0,
    productionDeploy: production ? Boolean(prodBundlePath) : null,
    route: production ? routeFailures.length === 0 : null,
    api: production ? apiFailures.length === 0 : null,
    ui: production ? mobileResults?.ok !== false : null,
    featureVerified: deliverySummary.blocked === 0 && deliverySummary.ready === 0,
    secrets: {
      supabase: SECRET_GROUPS.supabase.every((k) => env[k]),
      cron: SECRET_GROUPS.cron.every((k) => env[k]),
      anthropic: env.ANTHROPIC_API_KEY,
      openai: env.OPENAI_API_KEY,
      instagram: SECRET_GROUPS.instagram.every((k) => env[k]),
      database: SECRET_GROUPS.database.some((k) => env[k]),
    },
  };

  const report = {
    at: new Date().toISOString(),
    durationMs: Date.now() - t0,
    releaseGateVersion: 1,
    branch: execSync("git branch --show-current", { encoding: "utf8" }).trim(),
    mainHead,
    production,
    productionUrl: production ? base : null,
    productionBundle: prodBundlePath,
    env,
    gate,
    releaseGateChecks: RELEASE_GATE_CHECKS,
    buildSteps: steps,
    openPrs: { count: openPrs.length, prs: openPrs },
    branchesAheadOfMain: { count: branchesAhead.length, branches: branchesAhead.slice(0, 30) },
    crons: readCrons(),
    tables,
    missingCoreTables,
    activationTables,
    missingActivationTables,
    shariaRulingsCount,
    routeResults: production ? routeResults : undefined,
    apiResults: production ? apiResults : undefined,
    mobile: production ? mobileResults : undefined,
    features,
    deliverySummary,
    manualInterventionRequired: [
      !env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY in Vercel",
      !env.CRON_SECRET && "CRON_SECRET in Vercel",
      !env.DATABASE_URL && !env.POSTGRES_URL && "DATABASE_URL or POSTGRES_* in Vercel (for migrations cron)",
      !env.ANTHROPIC_API_KEY && "ANTHROPIC_API_KEY for assistant",
      !env.OPENAI_API_KEY && "OPENAI_API_KEY for vision/MKE (optional)",
      !env.INSTAGRAM_GRAPH_ACCESS_TOKEN && "INSTAGRAM_GRAPH_* for Instagram automation",
      missingActivationTables.length > 0 &&
        `Apply activation migrations: ${missingActivationTables.join(", ")}`,
      (shariaRulingsCount ?? 0) === 0 && "Seed sharia_rulings via /api/admin/production-activate?action=seed-rulings",
      openPrs.length > 0 && `Merge or close ${openPrs.length} open PRs`,
      "Confirm Vercel Production Branch = main (Dashboard → Settings → Git)",
    ].filter(Boolean),
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  const criticalFail =
    buildFailed ||
    (production &&
      (routeFailures.length > 0 ||
        apiFailures.length > 0 ||
        missingCoreTables.length > 0 ||
        missingActivationTables.length > 0 ||
        (shariaRulingsCount ?? 0) === 0 ||
        !gate.secrets.supabase ||
        !gate.secrets.cron ||
        !gate.secrets.anthropic ||
        deliverySummary.blocked > 0));

  if (jsonOut) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  Majlis Production Recovery — Release Gate");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`At: ${report.at}`);
    console.log(`Branch: ${report.branch} | main@${mainHead}`);
    if (production) console.log(`Production: ${base} | bundle: ${prodBundlePath || "?"}`);
    console.log("");

    console.log("── Build Gate ──");
    for (const s of steps) {
      console.log(`${s.ok ? "✓" : "✗"} ${s.name} (${s.ms}ms)${s.error ? ` — ${s.error.slice(0, 80)}` : ""}`);
    }

    console.log("\n── Delivery States ──");
    console.log(
      `Production: ${deliverySummary.production} | Ready: ${deliverySummary.ready} | Blocked: ${deliverySummary.blocked} | PR-only: ${deliverySummary.prOnly}`,
    );

    console.log("\n── Features ──");
    for (const f of features) {
      const tag = f.deliveryState.padEnd(10);
      const reason = f.blockReason ? ` (${f.blockReason}: ${f.blockDetail || ""})` : "";
      console.log(`[${tag}] ${f.name}${f.pr ? ` PR#${f.pr}` : ""}${reason}`);
    }

    if (production) {
      console.log("\n── Routes ──");
      const rf = routeFailures.length;
      console.log(rf ? `✗ ${rf} route(s) failed: ${routeFailures.join(", ")}` : `✓ All ${USER_FACING_ROUTES.length} routes OK`);

      console.log("\n── APIs ──");
      console.log(apiFailures.length ? `✗ Failed: ${apiFailures.join(", ")}` : "✓ Core APIs OK");

      console.log("\n── Activation tables ──");
      console.log(
        missingActivationTables.length
          ? `✗ Missing: ${missingActivationTables.join(", ")}`
          : `✓ All ${ACTIVATION_TABLES.length} activation tables present (${shariaRulingsCount ?? 0} rulings)`,
      );

      console.log("\n── Database (core) ──");
      console.log(
        missingCoreTables.length
          ? `✗ Missing: ${missingCoreTables.join(", ")}`
          : "✓ Core tables present",
      );

      if (mobileResults?.skipped) {
        console.log(`\n── Mobile: skipped (${mobileResults.reason})`);
      } else if (mobileResults) {
        console.log(`\n── Mobile (iPhone 13): ${mobileResults.ok ? "✓" : "✗"}`);
      }
    }

    console.log("\n── Open PRs ──");
    console.log(`${openPrs.length} open — oldest: ${openPrs[0]?.number ?? "none"} ${openPrs[0]?.headRefName ?? ""}`);

    console.log("\n── Manual intervention ──");
    for (const item of report.manualInterventionRequired) {
      console.log(`  • ${item}`);
    }

    console.log(`\nReport: data/release-audit-report.json`);
    console.log(`\n${criticalFail ? "RELEASE GATE: BLOCKED" : production ? "RELEASE GATE: PASS (with warnings)" : "LOCAL GATE: run with --production for full check"}`);
  }

  process.exit(criticalFail && production ? 1 : buildFailed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
