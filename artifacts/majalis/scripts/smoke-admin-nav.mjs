#!/usr/bin/env node
/**
 * Smoke test — admin sidebar path routes resolve correctly.
 * Usage: node scripts/smoke-admin-nav.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const REQUIRED_ROUTES = [
  { label: "CMS الذكي", path: "/admin/cms", section: "smart-cms" },
  { label: "محرك التجميع", path: "/admin/collector", section: "aggregator" },
  { label: "Auto Knowledge Engine", path: "/admin/ake", section: "knowledge-engine" },
  { label: "التوثيق العلمي", path: "/admin/scientific-verification", section: "scholarly-verification" },
  { label: "المعرفة الموثقة", path: "/admin/knowledge", section: "verified-knowledge" },
  { label: "محرك الاستدلال", path: "/admin/reasoning", section: "knowledge-reasoning" },
  { label: "تحليل البحث", path: "/admin/search-analysis", section: "search-analytics" },
  { label: "التعليم الرقمي", path: "/admin/digital-learning", section: "digital-learning" },
  { label: "المنظومة الذاتية", path: "/admin/autonomous-system", section: "autonomous-ai" },
  { label: "المرجع العالمي", path: "/admin/global-reference", section: "global-reference" },
];

let passed = 0;
let failed = 0;

function ok(name, detail = "") {
  passed++;
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function bad(name, detail = "") {
  failed++;
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("\n=== Admin Navigation Smoke Test ===\n");

const navSrc = readFileSync(resolve(ROOT, "src/lib/admin-navigation.ts"), "utf8");
const shellSrc = readFileSync(resolve(ROOT, "src/views/admin/AdminShell.tsx"), "utf8");
const adminPageSrc = readFileSync(resolve(ROOT, "src/views/AdminPage.tsx"), "utf8");
const appSrc = readFileSync(resolve(ROOT, "src/App.tsx"), "utf8");

if (shellSrc.includes("onClick={() => onSectionChange")) {
  bad("AdminShell uses state-only onClick navigation");
} else if (shellSrc.includes("adminSectionPath") && shellSrc.includes("<Link")) {
  ok("AdminShell uses Link + adminSectionPath (wouter SPA navigation)");
} else {
  bad("AdminShell missing Link-based navigation");
}

if (adminPageSrc.includes("onSectionChange")) {
  bad("AdminPage still uses onSectionChange state");
} else {
  ok("AdminPage derives section from URL path");
}

if (appSrc.includes('/admin/:sectionSlug')) {
  ok("App.tsx has /admin/:sectionSlug route");
} else {
  bad("App.tsx missing section slug route");
}

for (const route of REQUIRED_ROUTES) {
  if (!navSrc.includes(`${route.section}: "${route.path.replace("/admin/", "")}"`) &&
      !navSrc.includes(`"${route.section}": "${route.path.replace("/admin/", "")}"`)) {
    // check alternate format
    const slug = route.path.replace("/admin/", "");
    if (!navSrc.includes(`"${route.section}": "${slug}"`) && !navSrc.includes(`${route.section}: "${slug}"`)) {
      bad(`route map ${route.label}`, `missing ${route.section} → ${slug}`);
      continue;
    }
  }
  ok(`route ${route.label}`, route.path);
}

if (shellSrc.includes('onClick={(e) => e.stopPropagation()}')) {
  ok("Nav links stop event propagation");
} else {
  bad("Nav links missing stopPropagation");
}

if (!shellSrc.includes("window.location") && !shellSrc.includes("location.href")) {
  ok("AdminShell avoids window.location navigation");
} else {
  bad("AdminShell uses hard navigation");
}

console.log(`\n=== Summary: ${passed} PASS, ${failed} FAIL ===\n`);
process.exit(failed ? 1 : 0);
