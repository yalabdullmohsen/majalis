/**
 * بوابة: خط أنابيب الإقلاع + Safe Mode لا يمنعان أول شاشة، ويعزلان الثانوي.
 * Run: node --import tsx src/lib/__tests__/startup-bootstrap-recovery-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  beginBootstrapStage,
  completeBootstrapStage,
  failBootstrapStage,
  getBootstrapSnapshot,
  getFailedBlockingStages,
} from "../app-bootstrap-pipeline";
import {
  clearStartupFailures,
  isOptionalFeatureEnabledInSafeMode,
  isStartupSafeMode,
  recordStartupFailure,
} from "../startup-safe-mode";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const native = readFileSync(resolve(root, "public/native-load-error.html"), "utf8");
const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");

// sessionStorage mock لبيئة Node
const mem = new Map<string, string>();
(globalThis as { sessionStorage?: Storage }).sessionStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  get length() {
    return mem.size;
  },
} as Storage;

assert.match(native, /version\.json/);
assert.match(native, /probeThenGo\(true\)/);
assert.match(native, /clearLastPath/);
assert.match(native, /attempts < 2/);
assert.match(native, /الصفحة الرئيسية/);
assert.match(native, /إعادة المحاولة/);
assert.match(main, /beginBootstrapStage/);
assert.match(main, /showFirstUsefulScreen/);
assert.match(main, /isStartupSafeMode/);
assert.match(main, /clearStartupFailures/);

beginBootstrapStage("loadRuntimeConfiguration", true);
completeBootstrapStage("loadRuntimeConfiguration");
beginBootstrapStage("initializeAudioServices", false);
failBootstrapStage("initializeAudioServices", "safe_mode", true);
assert.equal(getFailedBlockingStages().length, 0);
assert.ok(getBootstrapSnapshot().some((s) => s.id === "initializeAudioServices" && s.fallbackUsed));

clearStartupFailures();
recordStartupFailure("t1");
assert.equal(isStartupSafeMode(), false);
recordStartupFailure("t2");
assert.equal(isStartupSafeMode(), true);
assert.equal(isOptionalFeatureEnabledInSafeMode("maps"), false);
assert.equal(isOptionalFeatureEnabledInSafeMode("mushaf"), true);
clearStartupFailures();
assert.equal(isStartupSafeMode(), false);

console.log("startup-bootstrap-recovery-gate: ok");
