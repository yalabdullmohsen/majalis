#!/usr/bin/env node
/**
 * بوابة PSI على الإنتاج — أهداف 2200/2500 (فحص 12) لا على LHCI المعاينة.
 * يفشل إن FCP/SI أسوأ من فحص 12 (انحدار).
 *
 * Usage:
 *   node scripts/verify-psi-production-gate.mjs
 *   node scripts/verify-psi-production-gate.mjs --url=https://majlisilm.com/
 *   PAGESPEED_API_KEY=... node scripts/verify-psi-production-gate.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const { loadPsiTargets } = require("./lhci-thresholds.cjs");

const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith("--url="))?.slice(6);
const jsonOut = args.includes("--json");
const skipVersion = args.includes("--skip-version");

const config = loadPsiTargets();
const targetUrl = urlArg || config.url;
const { targets, regressionBaseline } = config;

async function fetchVersionJson(base) {
  const origin = new URL(base).origin;
  const res = await fetch(`${origin}/version.json`, { redirect: "follow" });
  if (!res.ok) throw new Error(`version.json HTTP ${res.status}`);
  return res.json();
}

async function runPsi(url) {
  const params = new URLSearchParams({
    url,
    strategy: config.strategy,
    category: "performance",
  });
  params.append("category", "accessibility");
  params.append("category", "best-practices");
  params.append("category", "seo");

  const apiKey = process.env.PAGESPEED_API_KEY;
  if (apiKey) params.set("key", apiKey);

  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PSI API HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

function auditMs(lhr, id) {
  return lhr.audits[id]?.numericValue ?? null;
}

function categoryScore(lhr, id) {
  return lhr.categories[id]?.score ?? null;
}

async function main() {
  let version = null;
  if (!skipVersion) {
    try {
      version = await fetchVersionJson(targetUrl);
    } catch (err) {
      console.warn(`⚠ version.json: ${err.message}`);
    }
  }

  const data = await runPsi(targetUrl);
  const lhr = data.lighthouseResult;
  if (!lhr) throw new Error("PSI: لا lighthouseResult");

  const metrics = {
    performance: categoryScore(lhr, "performance"),
    accessibility: categoryScore(lhr, "accessibility"),
    bestPractices: categoryScore(lhr, "best-practices"),
    seo: categoryScore(lhr, "seo"),
    fcpMs: auditMs(lhr, "first-contentful-paint"),
    siMs: auditMs(lhr, "speed-index"),
    lcpMs: auditMs(lhr, "largest-contentful-paint"),
    cls: auditMs(lhr, "cumulative-layout-shift"),
    tbtMs: auditMs(lhr, "total-blocking-time"),
  };

  const report = {
    at: new Date().toISOString(),
    url: targetUrl,
    version,
    exam: 13,
    metrics,
    targets,
    regressionBaseline,
    psiReportUrl: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(targetUrl)}&form_factor=mobile`,
  };

  const failures = [];

  if (metrics.performance != null && metrics.performance < targets.performanceMin) {
    failures.push(`performance ${metrics.performance} < ${targets.performanceMin}`);
  }
  if (metrics.fcpMs != null && metrics.fcpMs > targets.fcpMs) {
    failures.push(`FCP ${Math.round(metrics.fcpMs)}ms > ${targets.fcpMs}ms (هدف PSI)`);
  }
  if (metrics.siMs != null && metrics.siMs > targets.siMs) {
    failures.push(`SI ${Math.round(metrics.siMs)}ms > ${targets.siMs}ms (هدف PSI)`);
  }
  if (metrics.lcpMs != null && metrics.lcpMs > targets.lcpMs) {
    failures.push(`LCP ${Math.round(metrics.lcpMs)}ms > ${targets.lcpMs}ms`);
  }
  if (metrics.cls != null && metrics.cls > targets.cls) {
    failures.push(`CLS ${metrics.cls} > ${targets.cls}`);
  }
  if (metrics.tbtMs != null && metrics.tbtMs > targets.tbtMs) {
    failures.push(`TBT ${Math.round(metrics.tbtMs)}ms > ${targets.tbtMs}ms`);
  }

  /** انحدار عن فحص 12 — FCP/SI أسوأ → رجوع */
  if (metrics.fcpMs != null && metrics.fcpMs > regressionBaseline.fcpMs) {
    failures.push(
      `FCP انحدار: ${Math.round(metrics.fcpMs)}ms > فحص ${regressionBaseline.exam} (${regressionBaseline.fcpMs}ms)`,
    );
  }
  if (metrics.siMs != null && metrics.siMs > regressionBaseline.siMs) {
    failures.push(
      `SI انحدار: ${Math.round(metrics.siMs)}ms > فحص ${regressionBaseline.exam} (${regressionBaseline.siMs}ms)`,
    );
  }

  report.pass = failures.length === 0;
  report.failures = failures;

  if (jsonOut) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("═══════════════════════════════════════════════════");
    console.log("  PSI Production Gate — فحص 13");
    console.log("═══════════════════════════════════════════════════");
    console.log(`URL: ${targetUrl}`);
    if (version?.commit) console.log(`SHA: ${version.commit.slice(0, 8)} · builtAt ${version.builtAt ?? "?"}`);
    console.log(`PSI: ${report.psiReportUrl}\n`);
    console.log("| المقياس | القيمة | الهدف |");
    console.log("|---|---:|---:|");
    const row = (name, val, goal, unit = "") =>
      console.log(`| ${name} | ${val ?? "—"}${unit} | ${goal}${unit} |`);
    row("أداء", metrics.performance?.toFixed(2), targets.performanceMin);
    row("FCP", metrics.fcpMs != null ? Math.round(metrics.fcpMs) : null, targets.fcpMs, "ms");
    row("SI", metrics.siMs != null ? Math.round(metrics.siMs) : null, targets.siMs, "ms");
    row("LCP", metrics.lcpMs != null ? Math.round(metrics.lcpMs) : null, targets.lcpMs, "ms");
    row("CLS", metrics.cls?.toFixed(3), targets.cls);
    row("TBT", metrics.tbtMs != null ? Math.round(metrics.tbtMs) : null, targets.tbtMs, "ms");
    console.log("");
    if (failures.length) {
      console.log("✗ FAIL:");
      for (const f of failures) console.log(`  • ${f}`);
    } else {
      console.log("✓ PASS — PSI يلبي أهداف الإنتاج ولا انحدار عن فحص 12");
    }
  }

  if (failures.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
