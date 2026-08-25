/**
 * بوابة تسلسل الإقلاع الموحّد — بلا await قبل createRoot + مراحل واضحة.
 * تشغيل: node --import tsx src/lib/__tests__/boot-sequence-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const seq = read("src/lib/boot-sequence.ts");
const main = read("src/main.tsx");
const boot = read("src/lib/boot-readiness.ts");
const purge = read("src/lib/runtime-cache-purge.ts");

assert.match(seq, /runBootSequenceBeforeMount/);
assert.match(seq, /lockBootLayoutMetrics/);
assert.match(seq, /purgeLegacyColdBootKeysSync/);
assert.match(seq, /loadLastPageSync/);
assert.match(seq, /scheduleMushafLastPagePrewarm/);
assert.match(seq, /mjLayoutLock/);
assert.match(seq, /Phase|phase|hydrate|layout-lock|purge/);

assert.match(main, /runBootSequenceBeforeMount/);
assert.match(main, /markBootAwaitPaint/);
assert.match(main, /scheduleMushafLastPagePrewarm/);

const createIdx = main.indexOf("createRoot(");
assert.ok(createIdx > 0);
const beforeCreate = main.slice(0, createIdx);
assert.match(beforeCreate, /runBootSequenceBeforeMount/);
assert.doesNotMatch(beforeCreate, /await\s+hydrateNativeStorage/);
assert.doesNotMatch(beforeCreate, /await\s+purgeNativeWebRuntimeCaches/);
assert.doesNotMatch(beforeCreate, /await\s+runBootSequence/);

assert.match(boot, /markBootReady/);
assert.match(purge, /LEGACY_COLD_BOOT_KEYS|purgeLegacyColdBootKeysSync/);

console.log("boot-sequence-gate.test.ts: ok");
