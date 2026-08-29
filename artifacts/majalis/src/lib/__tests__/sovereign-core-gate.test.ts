/**
 * بوابة: نواة Sovereign — workers، تفاؤل، تسخين، حارس حراري.
 * تشغيل: node --import tsx src/lib/__tests__/sovereign-core-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OPTIMISTIC_UI_BUDGET_MS } from "../sovereign/optimistic-engine";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p: string) => readFileSync(resolve(appRoot, p), "utf8");

assert.equal(OPTIMISTIC_UI_BUDGET_MS, 8);

const bootstrap = read("lib/sovereign/sovereign-bootstrap.ts");
assert.match(bootstrap, /startSovereignCore/);
assert.match(bootstrap, /warmSovereignWorker/);
assert.match(bootstrap, /startThermalSentinel/);

const worker = read("lib/sovereign/sovereign-compute.worker.ts");
assert.match(worker, /plain-search/);
assert.match(worker, /normalize-batch/);

const hub = read("lib/sovereign/sovereign-worker-hub.ts");
assert.match(hub, /new Worker/);
assert.match(hub, /plainSearchOffMain/);

const prewarm = read("lib/sovereign/navigation-prewarm.ts");
assert.match(prewarm, /recordNavigationPath/);
assert.match(prewarm, /prefetchMushafPage/);

const thermal = read("lib/sovereign/thermal-sentinel.ts");
assert.match(thermal, /dataset\.sovereignTier/);
assert.match(thermal, /getRenderFpsPolicy/);

const platform = read("lib/platform-logic-bootstrap.ts");
assert.match(platform, /startSovereignCore/);

const app = read("App.tsx") + "\n" + read("AppRoutes.tsx");
assert.match(app, /SovereignNavigationBridge/);

const search = read("lib/quran-search-verses.ts");
assert.match(search, /plainSearchOffMain/);

console.log("sovereign-core-gate: OK");