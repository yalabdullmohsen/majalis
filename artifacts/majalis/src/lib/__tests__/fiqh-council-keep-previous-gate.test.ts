/**
 * بوابة إزالة: لا تبقى عناوين المجمع في الصفحات الحديثة أو الاقتراحات الذكية.
 * node --import tsx src/lib/__tests__/fiqh-council-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.doesNotMatch(read("src/lib/recent-pages.ts"), /fiqh-council|المجمع الفقهي/);
assert.match(read("src/components/RelatedKnowledge.tsx"), /اقتراحات ذكية/);
assert.doesNotMatch(read("src/lib/scholarly-intelligence-service.ts"), /المجمع الفقهي|\/fiqh-council/);
assert.match(read("src/components/home/HomeLatestUpdates.tsx"), /fiqh-council/);

console.log("fiqh-council-keep-previous-gate.test.ts (removal): ok");
