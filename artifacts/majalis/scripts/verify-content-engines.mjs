#!/usr/bin/env node
/**
 * Verify Phase 7 content engines (unit + optional production run).
 */
import { ENGINE_IDS, getEngine } from "../lib/content-engines/registry.mjs";
import { normalizeItem, validateSource, mapCategory, computeHealthScore, contentHash } from "../lib/content-engines/pipeline.mjs";
import { runEngineQualityGate, scoreBenefit, scoreQuizQuestion } from "../lib/content-engines/quality-gate.mjs";
import { currentMonthKey, isInCurrentMonth } from "../lib/content-engines/sync-window.mjs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(ENGINE_IDS.length === 12, "12 engines registered");
assert(getEngine("benefits")?.labelAr, "benefits engine");

const item = normalizeItem({ title: "درس في التفسير", body: "نص الدرس يتحدث عن تفسير سورة الفاتحة", source_url: "https://example.com/lesson" });
assert(item.title.length > 0, "normalize title");
const val = validateSource(item);
assert(val.passed, "valid source");

assert(mapCategory("فقه العبادات") === "فقه", "category map");
assert(isInCurrentMonth("2026-06-15"), "current month");

const gate = runEngineQualityGate(item, { category: "تفسير", confidence: 80 });
assert(gate.canPublish, "quality gate pass");

assert(scoreBenefit("من فوائد الدرس أن المسلم ينبغي أن يتعلم أحكام الصلاة قبل أدائها") >= 60, "benefit score");
assert(scoreQuizQuestion({ question: "ما حكم...", options: ["أ", "ب", "ج", "د"], correct_index: 0 }) >= 60, "quiz score");

assert(computeHealthScore({ items_fetched: 10, items_published: 8, items_rejected: 1 }) >= 70, "health score");
assert(contentHash("test").length === 64, "content hash");

const production = process.argv.includes("--production");
let productionResult = null;

if (production) {
  const { getVerificationReport, runContentEngine } = await import("../lib/content-engines/index.mjs");
  productionResult = await runContentEngine("benefits", { runType: "manual", maxItems: 3 });
  const report = await getVerificationReport();
  console.log(JSON.stringify({ ok: true, unitTests: 12, production: { run: productionResult, report } }, null, 2));
} else {
  console.log(JSON.stringify({ ok: true, tests: 12, engines: ENGINE_IDS.length }, null, 2));
}
