#!/usr/bin/env node
/**
 * Regression smoke — سؤال وجواب routes, nav links, legacy redirects, no old branding.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`PASS  ${name}`);
}

function bad(name, detail = "") {
  failed++;
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

const appSrc = readFileSync(resolve(ROOT, "src/App.tsx"), "utf8");
const navSrc = readFileSync(resolve(ROOT, "src/lib/navigation.ts"), "utf8");
const adminNavSrc = readFileSync(resolve(ROOT, "src/lib/admin-navigation.ts"), "utf8");
const adminShellSrc = readFileSync(resolve(ROOT, "src/views/admin/AdminShell.tsx"), "utf8");
const adminPageSrc = readFileSync(resolve(ROOT, "src/views/AdminPage.tsx"), "utf8");
const gameAppSrc = readFileSync(resolve(ROOT, "src/views/sin-jeem/SinJeemApp.tsx"), "utf8");
const constantsSrc = readFileSync(resolve(ROOT, "src/lib/sin-jeem/constants.ts"), "utf8");
const homeFeatureSrc = readFileSync(resolve(ROOT, "src/components/home/HomeFeatureCards.tsx"), "utf8");

const REQUIRED_ROUTES = [
  "/question-answer",
  "/question-answer/setup/:mode",
  "/question-answer/play",
  "/question-answer/results",
  "/question-answer/leaderboard",
  "/question-answer/tournament",
];

const LEGACY_REDIRECTS = [
  ["/sin-jeem", "/question-answer"],
  ["/sin-jeem/play", "/question-answer/play"],
  ["/sin-jeem/results", "/question-answer/results"],
  ["/sin-jeem/leaderboard", "/question-answer/leaderboard"],
  ["/sin-jeem/tournament", "/question-answer/tournament"],
  ["/admin/sin-jeem", "/admin/question-answer"],
];

console.log("\n=== Question-Answer Routes Smoke Test ===\n");

for (const route of REQUIRED_ROUTES) {
  if (appSrc.includes(`path="${route}"`) || appSrc.includes(`path={\`${route}`) || appSrc.includes(`path={QA_BASE}`)) {
    ok(`route registered ${route}`);
  } else if (route.includes(":mode") && appSrc.includes("/question-answer/setup/:mode")) {
    ok(`route registered ${route}`);
  } else {
    bad(`route missing ${route}`);
  }
}

for (const [from, to] of LEGACY_REDIRECTS) {
  if (appSrc.includes(`path="${from}"`) && appSrc.includes(`"${to}"`)) {
    ok(`legacy redirect ${from} → ${to}`);
  } else {
    bad(`legacy redirect ${from} → ${to}`);
  }
}

if (appSrc.includes('lazyWithRetry(() => import("@/views/sin-jeem/SinJeemApp")') || appSrc.includes('import("@/views/sin-jeem/SinJeemApp")')) {
  ok("SinJeemApp lazy import present");
} else {
  bad("SinJeemApp lazy import missing");
}

if (gameAppSrc.includes("export default function SinJeemApp")) {
  ok("SinJeemApp default export");
} else {
  bad("SinJeemApp default export missing");
}

if (gameAppSrc.includes("/question-answer") && !gameAppSrc.includes('path="/sin-jeem"')) {
  ok("SinJeemApp uses /question-answer paths");
} else {
  bad("SinJeemApp still on /sin-jeem paths");
}

if (navSrc.includes('"/question-answer"') && navSrc.includes("سؤال وجواب")) {
  ok("navigation includes سؤال وجواب link");
} else {
  bad("navigation missing سؤال وجواب");
}

if (navSrc.includes('PRIMARY_NAV') && navSrc.match(/question-answer[\s\S]{0,80}سؤال وجواب/)) {
  ok("PRIMARY_NAV desktop link");
} else {
  bad("PRIMARY_NAV missing question-answer");
}

if (homeFeatureSrc.includes("gamepad") && navSrc.includes('href: "/question-answer"')) {
  ok("home feature card for question-answer");
} else {
  bad("home feature card missing");
}

if (adminNavSrc.includes('"question-answer": "question-answer"') && (adminNavSrc.includes('"sin-jeem"') || appSrc.includes("/admin/sin-jeem"))) {
  ok("admin slug question-answer + sin-jeem legacy handling");
} else {
  bad("admin navigation slug missing");
}

if (adminShellSrc.includes('"question-answer"') && adminShellSrc.includes("سؤال وجواب")) {
  ok("admin menu label سؤال وجواب");
} else {
  bad("admin menu missing question-answer");
}

if (adminPageSrc.includes('case "question-answer"') && adminPageSrc.includes("SinJeemSection")) {
  ok("AdminPage renders SinJeemSection");
} else {
  bad("AdminPage question-answer section");
}

if (constantsSrc.includes('GAME_TITLE = "سؤال وجواب"')) {
  ok("GAME_TITLE renamed to سؤال وجواب");
} else {
  bad("GAME_TITLE not updated");
}

const visibleUi = [
  constantsSrc,
  navSrc,
  adminShellSrc,
  readFileSync(resolve(ROOT, "src/views/admin/SinJeemSection.tsx"), "utf8"),
  readFileSync(resolve(ROOT, "src/views/sin-jeem/components/GameLayout.tsx"), "utf8"),
].join("\n");

let brandingFail = false;
if (/سين\s*ج/i.test(visibleUi) || /سين\s*وج/i.test(visibleUi)) {
  bad("old Sin Jeem Arabic branding still visible in UI copy");
  brandingFail = true;
}
if (!brandingFail) ok("no old Sin Jeem branding in visible UI copy");

if (readFileSync(resolve(ROOT, "src/views/sin-jeem/SinJeemHomePage.tsx"), "utf8").includes("DbActivationBanner")) {
  ok("DB activation banner on home page");
} else {
  bad("DB activation banner missing");
}

console.log(`\n=== Summary: ${passed} PASS, ${failed} FAIL ===\n`);
process.exit(failed > 0 ? 1 : 0);
