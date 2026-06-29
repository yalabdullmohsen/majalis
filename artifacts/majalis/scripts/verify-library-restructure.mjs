#!/usr/bin/env node
/**
 * Verify library restructure — routes, files, tests, and optional HTTP smoke.
 *
 * Usage:
 *   node scripts/verify-library-restructure.mjs
 *   node scripts/verify-library-restructure.mjs --base http://127.0.0.1:24216
 *   node scripts/verify-library-restructure.mjs --skip-http
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://127.0.0.1:24216";
const skipHttp = process.argv.includes("--skip-http");

const results = [];
function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

const ROUTES = [
  "/library",
  "/library/books",
  "/library/articles",
  "/books",
  "/articles",
  "/research",
];

const ADMIN_ROUTES = ["/admin/library-books", "/admin/library-articles", "/admin/scientific-research"];

const REQUIRED_FILES = [
  "src/lib/library/content-types.ts",
  "lib/library/content-types.mjs",
  "src/views/LibraryHubPage.tsx",
  "src/views/LibraryBooksPage.tsx",
  "src/views/LibraryArticlesPage.tsx",
  "src/views/LibraryLegacyRedirect.tsx",
  "src/views/admin/LibraryTypeAdminSection.tsx",
  "src/components/library/LibraryHubCards.tsx",
  "scripts/migrate-library-content-types.mjs",
  "scripts/test-library-restructure.mjs",
  "scripts/audit-library-content-types.mjs",
];

async function main() {
  console.log("=== Library Restructure Verification ===\n");

  for (const f of REQUIRED_FILES) {
    const p = join(ROOT, f);
    if (existsSync(p)) pass(`File ${f.split("/").pop()}`, "exists");
    else fail(`File ${f}`, "missing");
  }

  try {
    execSync("node scripts/test-library-restructure.mjs", { cwd: ROOT, stdio: "pipe" });
    pass("Unit test suite", "test-library-restructure.mjs");
  } catch (e) {
    fail("Unit test suite", String(e.stderr || e.message || e).slice(0, 120));
  }

  try {
    execSync("node scripts/audit-library-content-types.mjs", { cwd: ROOT, stdio: "pipe" });
    pass("Migration audit", "audit-library-content-types.mjs (local)");
  } catch (e) {
    fail("Migration audit", String(e.stderr || e.message || e).slice(0, 120));
  }

  try {
    execSync("node scripts/migrate-library-content-types.mjs", { cwd: ROOT, stdio: "pipe" });
    pass("Migration classifier", "runs OK");
  } catch (e) {
    fail("Migration classifier", String(e.message || e).slice(0, 80));
  }

  const contentTypes = readFileSync(join(ROOT, "lib/library/content-types.mjs"), "utf8");
  if (contentTypes.includes("validateContentTypeForSection")) pass("Validation layer");
  else fail("Validation layer");

  const sqlPath = join(ROOT, "../../supabase/library_content_types_v1.sql");
  if (existsSync(sqlPath)) {
    const sql = readFileSync(sqlPath, "utf8");
    if (sql.includes("trg_library_items_content_type")) pass("SQL publish trigger");
    else fail("SQL publish trigger");
  } else {
    fail("SQL migration file");
  }

  const app = readFileSync(join(ROOT, "src/App.tsx"), "utf8");
  for (const fragment of [
    "/library/books",
    "/library/articles",
    "LibraryLegacyRedirect",
    "/books",
    "/articles",
  ]) {
    if (app.includes(fragment)) pass(`App route ${fragment}`);
    else fail(`App route ${fragment}`);
  }

  const adminShell = readFileSync(join(ROOT, "src/views/admin/AdminShell.tsx"), "utf8");
  for (const slug of ["library-books", "library-articles", "scientific-research"]) {
    if (adminShell.includes(slug)) pass(`Admin nav ${slug}`);
    else fail(`Admin nav ${slug}`);
  }

  if (!skipHttp) {
    for (const route of ROUTES) {
      try {
        const r = await fetch(`${BASE}${route}`, { signal: AbortSignal.timeout(12000) });
        if (r.ok) pass(`HTTP ${route}`, String(r.status));
        else fail(`HTTP ${route}`, String(r.status));
      } catch (e) {
        fail(`HTTP ${route}`, e instanceof Error ? e.message.slice(0, 60) : "unreachable");
      }
    }
  } else {
    pass("HTTP smoke", "skipped (--skip-http)");
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
  console.log("\nLibrary separation: VERIFIED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
