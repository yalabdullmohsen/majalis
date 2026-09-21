/**
 * Wave 6 — Admin v3 Centers gate.
 * تشغيل: node --import tsx src/lib/__tests__/admin-v3-centers-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADMIN_V3_CENTERS,
  filterCenterTools,
  listCenterTools,
  uniqueTags,
} from "@/admin-v3/centers/catalog";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const required = [
  "content",
  "review",
  "users",
  "notifications",
  "analytics",
  "automation",
  "system",
  "settings",
  "audit",
] as const;

for (const id of required) {
  assert.ok(ADMIN_V3_CENTERS[id], `مركز مفقود: ${id}`);
  assert.ok(ADMIN_V3_CENTERS[id].permissions.length > 0, `صلاحيات ${id}`);
  assert.ok(ADMIN_V3_CENTERS[id].title.length > 2);
}

assert.ok(listCenterTools("content").length >= 10);
assert.ok(listCenterTools("review").length >= 4);
assert.ok(listCenterTools("automation").length >= 6);
assert.equal(listCenterTools("audit").length, 0);

const tools = listCenterTools("content");
assert.ok(filterCenterTools(tools, "درس", "الكل").length > 0);
assert.ok(uniqueTags(tools).includes("الكل"));

const app = read("src/admin-v3/AdminV3App.tsx");
assert.match(app, /AdminV3CenterWorkspace/);
assert.doesNotMatch(app, /AdminV3CenterStub/);
assert.equal(existsSync(resolve(root, "src/admin-v3/AdminV3CenterStub.tsx")), false);

const workspace = read("src/admin-v3/centers/AdminV3CenterWorkspace.tsx");
assert.match(workspace, /av3-center__search/);
assert.match(workspace, /av3-center__filters/);
assert.match(workspace, /av3-pager|PAGE_SIZE/);
assert.match(workspace, /AdminV3Loading|AdminV3Empty|AdminV3ErrorState/);
assert.match(workspace, /permissions/);
assert.match(workspace, /emitAdminV3AuditEvent/);

const css = read("src/styles/pages/admin-v3-shell.css");
assert.match(css, /\.av3-tool-grid/);
assert.match(css, /\.av3-pager/);

const shellGate = read("src/lib/__tests__/admin-v3-shell-gate.test.ts");
assert.match(shellGate, /AdminV3App/);

console.log(
  `admin-v3-centers-gate.test.ts: ok (centers=${required.length} contentTools=${tools.length})`,
);
