/**
 * بوابة: لا مضيف FirstRun — الدخول مباشرة للتطبيق.
 * node --import tsx src/lib/__tests__/app-first-run-host.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const app = readFileSync(resolve(root, "App.tsx"), "utf8");

assert.doesNotMatch(app, /AppFirstRunHost/);
assert.doesNotMatch(app, /FirstRunSetup/);
assert.match(app, /<AppShell\s*\/>/);
assert.equal(existsSync(resolve(root, "components/AppFirstRunHost.tsx")), false);

console.log("app-first-run-host.test.ts: ok — بلا دليل سريع");
