#!/usr/bin/env node
/**
 * UI 2026 redesign regression guard
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${msg}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${msg}`);
  }
}

console.log("UI 2026 redesign verification\n");

ok(existsSync(resolve(root, "src/styles/ui-2026.css")), "ui-2026.css design layer exists");

const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");
ok(main.includes("ui-2026.css"), "main.tsx imports ui-2026.css");
ok(main.includes('classList.add("ui-2026")'), "html.ui-2026 class applied");

const home = readFileSync(resolve(root, "src/views/HomePage.tsx"), "utf8");
ok(home.includes("home-page--v2026"), "HomePage uses v2026 layout");
ok(home.includes("HomeFeatureGrid"), "HomePage has feature grid");
ok(home.includes("HomePlatformStats"), "HomePage has live stats");

const nav = readFileSync(resolve(root, "src/lib/navigation.ts"), "utf8");
ok(nav.includes("/sheikhs"), "Nav includes المشايخ");
const navCount = (nav.match(/PRIMARY_NAV = \[[\s\S]*?\];/)?.[0].match(/href:/g) || []).length;
ok(navCount <= 8, `Primary nav streamlined (${navCount} items)`);

const footer = readFileSync(resolve(root, "src/components/SiteFooter.tsx"), "utf8");
ok(footer.includes("site-footer--v2026"), "Footer uses v2026 styles");

const notFound = readFileSync(resolve(root, "src/views/not-found.tsx"), "utf8");
ok(notFound.includes("not-found-page--v2026"), "404 page redesigned");

const login = readFileSync(resolve(root, "src/views/LoginPage.tsx"), "utf8");
ok(login.includes("auth-page--v2026"), "Login page redesigned");

const register = readFileSync(resolve(root, "src/views/RegisterPage.tsx"), "utf8");
ok(register.includes("auth-card--v2026"), "Register page redesigned");

const ui2026 = readFileSync(resolve(root, "src/styles/ui-2026.css"), "utf8");
ok(ui2026.includes("--ui26-glass"), "Glass UI tokens defined");
ok(ui2026.includes("prefers-reduced-motion"), "Reduced motion support");
ok(ui2026.includes(".ui-card"), "Unified card overrides");

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
