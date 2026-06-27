/**
 * Content Production System — unit & integration verification.
 */
import { validateContentItem } from "../lib/content-production/validator.mjs";
import { buildDedupKeys, checkDuplicate } from "../lib/content-production/dedup.mjs";
import { PIPELINES, SCHEDULER_JOBS, PRODUCTION_FLOW, listPipelineIds } from "../lib/content-production/config.mjs";
import { JOB_HANDLERS } from "../lib/content-production/scheduler.mjs";
import { normalizeArabicText, tokenSimilarity } from "../lib/content-production/normalize.mjs";

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed += 1;
    console.log(`✓ ${label}`);
  } else {
    failed += 1;
    console.error(`✗ ${label}`);
  }
}

console.log("=== Content Production Verification ===\n");

// Config
assert(listPipelineIds().length === 6, "6 pipelines configured");
assert(Object.keys(SCHEDULER_JOBS).length === 6, "6 scheduler jobs configured");
assert(PRODUCTION_FLOW.length === 9, "9-stage production flow defined");

// Validation — rejects placeholder
const bad = validateContentItem(
  { body: "This is a demo placeholder test", source_name: "test" },
  "fawaid",
);
assert(!bad.passed, "Rejects placeholder/demo content");

// Validation — accepts verified Arabic content
const good = validateContentItem(
  {
    body: "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى",
    source_name: "صحيح البخاري",
    source_url: "https://sunnah.com/bukhari:1",
    text: "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى",
  },
  "fawaid",
);
assert(good.passed, "Accepts verified Arabic content with source");

// Validation — rejects missing source
const noSource = validateContentItem({ body: "نص عربي صحيح بدون مصدر" }, "fawaid");
assert(!noSource.passed, "Rejects content without source");

// Dedup — hash
const keys1 = buildDedupKeys({ body: "إنما الأعمال بالنيات" });
const keys2 = buildDedupKeys({ body: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ" });
assert(keys1.content_hash === keys2.content_hash, "Normalization dedup — diacritics ignored");

// Semantic similarity
const sim = tokenSimilarity("إنما الأعمال بالنيات", "إنما الاعمال بالنيات");
assert(sim >= 0.85, `Semantic similarity works (${sim.toFixed(3)})`);

// Dedup — duplicate detection (in-memory)
const dup = await checkDuplicate(null, "fawaid", { body: "test", title: "test" });
assert(!dup.isDuplicate, "No duplicate without registry");

// Pipeline quotas
assert(PIPELINES.questions.dailyQuota === 150, "Questions daily quota 150");
assert(PIPELINES.fawaid.dailyQuota === 300, "Fawaid daily quota 300");
assert(PIPELINES.hadith.dailyQuota === 150, "Hadith daily quota 150");
assert(PIPELINES.rulings.dailyQuota === 50, "Rulings daily quota 50");
assert(PIPELINES.stories.weeklyQuota === 20, "Stories weekly quota 20");
assert(PIPELINES.articles.weeklyQuota === 10, "Articles weekly quota 10");

// Job handlers
assert(typeof JOB_HANDLERS["source-check"] === "function", "source-check handler exists");
assert(typeof JOB_HANDLERS["daily-production"] === "function", "daily-production handler exists");
assert(typeof JOB_HANDLERS["cleanup"] === "function", "cleanup handler exists");

// Dry-run scheduler jobs (no Supabase)
const sourceCheck = await JOB_HANDLERS["source-check"](null);
assert(sourceCheck.ok && sourceCheck.job === "source-check", "source-check dry-run OK");

const reindex = await JOB_HANDLERS.reindex(null);
assert(reindex.ok && reindex.job === "reindex", "reindex dry-run OK");

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
console.log("Content Production verification: PASS");
