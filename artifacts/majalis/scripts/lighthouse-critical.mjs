#!/usr/bin/env node
/**
 * Lighthouse حقيقي على الصفحات الحرجة (يتطلب خادمًا يعمل على --base).
 * Usage: node scripts/lighthouse-critical.mjs [--base=http://127.0.0.1:24216]
 */
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "http://127.0.0.1:24216";
const routes = ["/", "/quran-hub/", "/library/book-bukhari/", "/qa/", "/adhkar/"];

const scores = [];
mkdirSync(resolve(appRoot, "reports"), { recursive: true });

for (const route of routes) {
  const url = base.replace(/\/$/, "") + route;
  const out = resolve(appRoot, "reports", `lh-${route.replace(/\W+/g, "_") || "home"}.json`);
  console.log(`→ Lighthouse ${url}`);
  const chromeFlags = [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-background-networking",
    "--js-flags=--max-old-space-size=512",
  ].join(" ");
  const r = spawnSync(
    "npx",
    [
      "--yes",
      "lighthouse",
      url,
      "--only-categories=performance,accessibility,best-practices,seo",
      `--chrome-flags=${chromeFlags}`,
      "--form-factor=mobile",
      "--screenEmulation.mobile",
      "--max-wait-for-load=45000",
      "--output=json",
      `--output-path=${out}`,
      "--quiet",
    ],
    { cwd: appRoot, encoding: "utf8", timeout: 240000, env: { ...process.env, npm_config_yes: "true" } },
  );
  if (r.status !== 0) {
    console.error(`✗ Lighthouse فشل على ${url}\n`, (r.stderr || r.stdout || "").slice(0, 500));
    scores.push({ route, error: true });
    continue;
  }
  try {
    const report = JSON.parse(readFileSync(out, "utf8"));
    const cats = report.categories || {};
    const row = {
      route,
      performance: Math.round((cats.performance?.score ?? 0) * 100),
      accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((cats["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((cats.seo?.score ?? 0) * 100),
    };
    scores.push(row);
    console.log(`  P${row.performance} A${row.accessibility} BP${row.bestPractices} S${row.seo}`);
  } catch (e) {
    scores.push({ route, error: String(e) });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  base,
  scores,
  targets: { performance: 90, accessibility: 95, bestPractices: 95, seo: 95 },
};
writeFileSync(resolve(appRoot, "reports/lighthouse-critical.json"), JSON.stringify(summary, null, 2));
console.log("✓ تقرير: reports/lighthouse-critical.json");
if (scores.every((s) => s.error)) process.exit(1);
