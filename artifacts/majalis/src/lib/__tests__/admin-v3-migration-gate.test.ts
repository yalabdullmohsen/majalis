/**
 * Wave 7 — Legacy Admin entry migration gate.
 * تشغيل: node --import tsx src/lib/__tests__/admin-v3-migration-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");
const repoRoot = resolve(root, "../..");

const routes = read("src/AppRoutes.tsx");
const bridge = read("src/admin-v3/AdminEntryBridge.tsx");
const nav = read("src/components/NavBar.tsx");
const drawer = read("src/components/SideNavDrawer.tsx");
const shell = read("src/admin-v3/AdminV3Shell.tsx");
const catalog = read("src/app/router/routes.ts");
const report = readFileSync(
  resolve(repoRoot, "docs/admin/ADMIN_V3_MIGRATION_REPORT.md"),
  "utf8",
);

assert.match(routes, /AdminEntryBridge/);
assert.match(routes, /path="\/admin\/legacy"/);
assert.match(routes, /AdminLazyRoute component=\{AdminEntryBridge\}/);
assert.match(bridge, /Redirect to="\/admin\/v3"/);
assert.match(bridge, /section/);
assert.match(bridge, /AdminPage/);

assert.match(nav, /href="\/admin\/v3"/);
assert.doesNotMatch(nav, /href="\/admin"/);
assert.match(drawer, /href="\/admin\/v3"/);

assert.match(shell, /\/admin\/legacy/);
assert.match(catalog, /"\/admin\/legacy"/);

assert.match(report, /BLOCKED/);
assert.match(report, /MIGRATED/);
assert.match(report, /NOT READY/);
assert.ok(existsSync(resolve(root, "src/views/AdminPage.tsx")), "Legacy AdminPage kept");
assert.ok(existsSync(resolve(root, "src/views/admin/AdminShell.tsx")), "Legacy AdminShell kept");

console.log("admin-v3-migration-gate.test.ts: ok");
