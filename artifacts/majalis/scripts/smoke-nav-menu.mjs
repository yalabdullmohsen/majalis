#!/usr/bin/env node
/**
 * Smoke test: mobile/desktop menu button opens and closes the navigation drawer.
 * Usage: node scripts/smoke-nav-menu.mjs [--base=http://127.0.0.1:4173]
 *
 * Requires: npx playwright (installed on first run).
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "http://127.0.0.1:4173";
const __dirname = dirname(fileURLToPath(import.meta.url));
const runnerPath = join(__dirname, "smoke-nav-menu-runner.mjs");

const install = spawnSync("npx", ["--yes", "playwright", "install", "chromium"], {
  stdio: "inherit",
  env: process.env,
});
if (install.status !== 0) process.exit(install.status ?? 1);

const run = spawnSync(process.execPath, [runnerPath, `--base=${base}`], {
  stdio: "inherit",
  env: process.env,
});
process.exit(run.status ?? 1);
