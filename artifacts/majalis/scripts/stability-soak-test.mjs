#!/usr/bin/env node
/**
 * Phase 12 — 24-hour stability soak test (simulated cycles).
 * Runs monitoring probes in a loop and writes report.
 *
 * Usage:
 *   node scripts/stability-soak-test.mjs --cycles=24 --interval-ms=1000
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const cycles = Number(process.argv.find((a) => a.startsWith("--cycles="))?.split("=")[1] || 24);
const intervalMs = Number(process.argv.find((a) => a.startsWith("--interval-ms="))?.split("=")[1] || 500);
const base = process.argv.find((a) => a.startsWith("--base="))?.split("=")[1] || "https://www.majlisilm.com";

async function probe(path) {
  const t0 = Date.now();
  try {
    const res = await fetch(new URL(path, base), {
      headers: { "x-vercel-cron": "1" },
      signal: AbortSignal.timeout(20000),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ms: Date.now() - t0, json };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - t0, error: e.message };
  }
}

async function main() {
  const report = {
    at: new Date().toISOString(),
    base,
    cycles,
    intervalMs,
    samples: [],
    summary: { pass: 0, fail: 0, avgMs: 0 },
  };

  const paths = [
    "/api/cron/system-health",
    "/api/cron/connector-health",
    "/api/cron/ake-queue-drain",
  ];

  for (let i = 0; i < cycles; i++) {
    const sample = { cycle: i + 1, at: new Date().toISOString(), probes: {} };
    for (const path of paths) {
      sample.probes[path] = await probe(path);
    }
    const allOk = Object.values(sample.probes).every((p) => p.ok);
    if (allOk) report.summary.pass++;
    else report.summary.fail++;
    report.samples.push(sample);
    if (i < cycles - 1) await new Promise((r) => setTimeout(r, intervalMs));
  }

  const allMs = report.samples.flatMap((s) => Object.values(s.probes).map((p) => p.ms));
  report.summary.avgMs = allMs.length ? Math.round(allMs.reduce((a, b) => a + b, 0) / allMs.length) : 0;
  report.ok = report.summary.fail === 0;

  const outPath = join(ROOT, `reports/soak-${Date.now()}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(JSON.stringify({ ...report, samples: report.samples.slice(-3) }, null, 2));
  console.log(`Full report: ${outPath}`);
  process.exit(report.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
