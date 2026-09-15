/**
 * بوابة إزالة: المسارات العامة تحوّل /fiqh-council ولا تُحمّل صفحات المجمع.
 * node --import tsx src/lib/__tests__/fiqh-council-soft-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const routes = readFileSync(resolve(root, "src/AppRoutes.tsx"), "utf8");

assert.match(routes, /path="\/fiqh-council\/:rest\*"/);
assert.match(routes, /path="\/fiqh-council"/);
assert.ok((routes.match(/Redirect to="\/fiqh"/g) || []).length >= 2);
assert.doesNotMatch(routes, /import\(["']@\/views\/FiqhCouncil/);
assert.doesNotMatch(routes, /FiqhCouncil\w+Page/);

console.log("fiqh-council-soft-gate.test.ts (removal): ok");
