#!/usr/bin/env node
/**
 * Production detail-page audit — detects error boundary, 404, blank, infinite loading.
 * Usage: node scripts/audit-detail-pages.mjs [--base=https://www.majlisilm.com]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "https://www.majlisilm.com";
const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

const ERROR_MARKERS = [
  "تعذر عرض هذه الصفحة",
  "404",
  "Not Found",
  "حدث خطأ",
  "تعذر تحميل",
];

function loadSeedIds() {
  const routes = [];

  // Research seed slugs
  const researchSeed = readFileSync(join(root, "src/lib/scientific-research/seed.ts"), "utf8");
  for (const m of researchSeed.matchAll(/slug:\s*"([^"]+)"/g)) {
    routes.push({ section: "research", path: `/research/${m[1]}` });
  }

  // Quran scientific circles
  const qscSeed = readFileSync(join(root, "src/lib/quran-scientific-circles-seed.ts"), "utf8");
  for (const m of qscSeed.matchAll(/id:\s*"(qsc-[^"]+)"/g)) {
    routes.push({ section: "quran-scientific-circles", path: `/quran-scientific-circles/${m[1]}` });
  }

  // Annual courses
  const acSeed = readFileSync(join(root, "src/lib/annual-courses-seed.ts"), "utf8");
  for (const m of acSeed.matchAll(/id:\s*"(course-[^"]+)"/g)) {
    routes.push({ section: "annual-courses", path: `/annual-courses/${m[1]}` });
  }

  return routes;
}

async function fetchSupabaseIds(table, pathFn, section, select = "id") {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=${select}&limit=5`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows.slice(0, 3).map((row) => ({
      section,
      path: pathFn(row),
    }));
  } catch {
    return [];
  }
}

async function buildRoutes() {
  const routes = loadSeedIds();

  routes.push(
    ...(await fetchSupabaseIds("lessons", (r) => `/lessons/${r.id}`, "lessons")),
    ...(await fetchSupabaseIds("sheikhs", (r) => `/sheikhs/${r.id}`, "sheikhs")),
    ...(await fetchSupabaseIds("library_items", (r) => `/library/${r.id}`, "books")),
    ...(await fetchSupabaseIds("fawaid", (r) => `/fawaid/${r.id}`, "fawaid")),
    ...(await fetchSupabaseIds("qa_questions", (r) => `/qa/${r.id}`, "qa")),
  );

  // Mutoon via qsc seed entries containing mutoon
  for (const r of routes.filter((x) => x.section === "quran-scientific-circles").slice(0, 2)) {
    routes.push({ section: "mutoon", path: r.path });
  }

  // Mosques — list page only if no rows
  routes.push({ section: "mosques", path: "/mosques" });

  return routes;
}

async function checkSpaRoute({ section, path }) {
  const url = new URL(path, base).toString();
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();
  const shellOk = res.status === 200 && html.includes("/assets/index-") && !html.includes("/src/main.tsx");
  return { section, path, status: res.status, shellOk, htmlSnippet: html.slice(0, 500) };
}

async function checkWithPlaywright(routes) {
  try {
    const pw = await import("playwright");
    const browser = await pw.chromium.launch({ headless: true });
    const page = await browser.newPage();
    const results = [];

    for (const route of routes) {
      const url = new URL(route.path, base).toString();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForTimeout(1500);
        const body = (await page.textContent("body")) || "";
        const hasError = ERROR_MARKERS.some((m) => body.includes(m));
        const title = await page.title();
        const blank = body.replace(/\s+/g, "").length < 80;
        const loading = body.includes("جاري التحميل") && body.length < 400;

        results.push({
          ...route,
          ok: !hasError && !blank && !loading,
          hasError,
          blank,
          loading,
          title: title.slice(0, 80),
          consoleErrors: errors.filter((e) => !e.includes("404")).slice(0, 3),
        });
      } catch (err) {
        results.push({
          ...route,
          ok: false,
          error: String(err.message || err).slice(0, 120),
        });
      }
    }

    await browser.close();
    return results;
  } catch (err) {
    console.warn("Playwright unavailable:", err.message);
    return null;
  }
}

console.log(`\n=== Detail Page Audit (${base}) ===\n`);

const routes = await buildRoutes();
console.log(`Routes to check: ${routes.length}\n`);

const shellResults = [];
for (const route of routes) {
  shellResults.push(await checkSpaRoute(route));
}

const pwResults = await checkWithPlaywright(routes);
const results = pwResults || shellResults.map((r) => ({ ...r, ok: r.shellOk && r.status === 200 }));

let passed = 0;
let failed = 0;

for (const r of results) {
  if (r.ok) {
    passed++;
    console.log(`✓ [${r.section}] ${r.path}`);
  } else {
    failed++;
    const detail = r.hasError
      ? "error boundary"
      : r.blank
        ? "blank"
        : r.loading
          ? "infinite loading"
          : r.error || `HTTP ${r.status}`;
    console.error(`✗ [${r.section}] ${r.path} — ${detail}`);
    if (r.consoleErrors?.length) console.error(`    console: ${r.consoleErrors.join(" | ")}`);
  }
}

console.log(`\n=== Summary: ${passed} passed, ${failed} failed / ${results.length} ===\n`);
process.exit(failed > 0 ? 1 : 0);
