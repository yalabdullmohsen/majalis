#!/usr/bin/env node
/**
 * Production verification for PR #184 scholar recovery.
 * Usage: node scripts/verify-sheikh-recovery-production.mjs [--base=https://www.majlisilm.com]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getScholarAutomationRegistry } from "../lib/scholar-automation-registry.mjs";

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "https://www.majlisilm.com";
const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

let passed = 0;
let failed = 0;
const report = [];

function ok(name, detail = "") {
  passed++;
  report.push({ status: "pass", name, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  failed++;
  report.push({ status: "fail", name, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log(`\n=== Scholar Recovery Production Verification (${base}) ===\n`);

const KUWAIT_SCHOLAR_REGISTRY = getScholarAutomationRegistry().map((s) => ({
  id: s.id,
  name: s.name_ar,
}));
if (KUWAIT_SCHOLAR_REGISTRY.length < 14) fail("Registry minimum", `< 14 scholars`);

const salem = KUWAIT_SCHOLAR_REGISTRY.find((s) => s.id === "salem-bin-saad-altaweel");
if (salem) ok("Salem profile in registry", salem.name);
else fail("Salem profile in registry");

const catalog = JSON.parse(readFileSync(join(root, "scripts/lessons-seed.snapshot.json"), "utf8"));
ok("Catalog lessons count", `${catalog.length} (need >=17)`);
if (catalog.length < 17) fail("Catalog minimum", `< 17 lessons`);
if (catalog.some((l) => l.id === "sci-tawheed-saltaweel")) ok("Salem lesson in catalog seed");
else fail("Salem lesson in catalog seed");

const app = readFileSync(join(root, "src/App.tsx"), "utf8");
if (app.includes('/sheikhs/:id') && !app.includes('path="/sheikhs"><Redirect to="/lessons"')) {
  ok("App routes: /sheikhs without redirect to /lessons");
} else {
  fail("App routes", "missing sheikh routes or redirect still present");
}

// HTTP shell checks
for (const path of ["/sheikhs", "/sheikhs/salem-bin-saad-altaweel", "/lessons/sci-tawheed-saltaweel", "/research", "/contact", "/question-answer"]) {
  const res = await fetch(`${base}${path}`, { redirect: "follow" });
  const html = await res.text();
  const finalPath = new URL(res.url).pathname;
  if (path === "/sheikhs" && finalPath.includes("/lessons") && !finalPath.includes("/sheikhs")) {
    fail(`HTTP ${path}`, `redirected to ${finalPath}`);
  } else if (res.status === 200 && html.includes("/assets/index-")) {
    ok(`HTTP ${path}`, `200`);
  } else {
    fail(`HTTP ${path}`, `status=${res.status}`);
  }
}

// Playwright browser checks
try {
  const pw = await import("playwright");
  const browser = await pw.chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${base}/sheikhs`, { waitUntil: "networkidle", timeout: 60000 });
  const sheikhsBody = await page.textContent("body");
  const scholarCount = (sheikhsBody?.match(/page-card/g) || []).length;
  if (sheikhsBody?.includes("سالم") && scholarCount >= 14) {
    ok("Production /sheikhs page", `${scholarCount} scholar cards, Salem visible`);
  } else if (sheikhsBody?.includes("سالم")) {
    ok("Production /sheikhs page", `Salem visible (${scholarCount} cards)`);
  } else {
    fail("Production /sheikhs page", `Salem not found, cards=${scholarCount}`);
  }

  await page.goto(`${base}/sheikhs/salem-bin-saad-altaweel`, { waitUntil: "networkidle", timeout: 60000 });
  const salemBody = await page.textContent("body");
  if (salemBody?.includes("سالم بن سعد الطويل") && !salemBody.includes("تعذر عرض")) {
    ok("Production Salem sheikh detail");
  } else {
    fail("Production Salem sheikh detail", salemBody?.slice(0, 120));
  }

  await page.goto(`${base}/lessons/sci-tawheed-saltaweel`, { waitUntil: "networkidle", timeout: 60000 });
  const lessonBody = await page.textContent("body");
  if (lessonBody?.includes("sci-tawheed") || lessonBody?.includes("سالم") || lessonBody?.includes("التوحيد")) {
    if (!lessonBody.includes("تعذر عرض") && !lessonBody.includes("لم يُعثر")) {
      ok("Production Salem lesson detail");
    } else {
      fail("Production Salem lesson detail", "error or not found text");
    }
  } else {
    fail("Production Salem lesson detail", "lesson content missing");
  }

  // Search autocomplete
  await page.goto(`${base}/search`, { waitUntil: "networkidle", timeout: 60000 });
  const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"], input[name="q"]').first();
  for (const term of ["سالم", "الطويل", "سالم الطويل"]) {
    await searchInput.fill("");
    await searchInput.fill(term);
    await page.waitForTimeout(800);
    const suggestions = await page.textContent("body");
    if (suggestions?.includes("سالم") || suggestions?.includes("الطويل")) {
      ok(`Search autocomplete: ${term}`);
    } else {
      fail(`Search autocomplete: ${term}`);
    }
  }

  await browser.close();
} catch (err) {
  fail("Playwright verification", err.message);
}

console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
