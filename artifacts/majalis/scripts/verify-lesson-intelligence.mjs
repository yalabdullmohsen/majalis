#!/usr/bin/env node
/**
 * Phase 6 — Lesson Intelligence Engine unit + integration tests (no DB).
 */
import { fuzzySimilarity, levenshtein, compositeLessonKey } from "../lib/cms/lesson-intelligence/text-utils.mjs";
import { computeSourceTrustScore, computeExtractionConfidence, shouldAutoPublishIntelligence } from "../lib/cms/lesson-intelligence/trust-scorer.mjs";
import { sha256ImageHash, computeDHash, perceptualSimilarity, computeEmbeddingSimilarity } from "../lib/cms/lesson-intelligence/image-hash.mjs";
import { fieldCompletenessScore } from "../lib/cms/lesson-intelligence/dedup-engine.mjs";
import { selectExtractorsForSource, EXTRACTOR_IDS } from "../lib/cms/lesson-intelligence/extractors/index.mjs";
import { listSupportedAdapters, resolveAdapterType, lessonSourceToConnectorSource } from "../lib/cms/lesson-intelligence/adapters/index.mjs";
import { KUWAIT_INSTAGRAM_SOURCES } from "../lib/cms/kuwait-instagram-sources.mjs";

let failed = 0;
let passed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
    passed += 1;
  }
}

// Unit — text utils
assert("Levenshtein identical", levenshtein("شرح رياض الصالحين", "شرح رياض الصالحين") === 0);
assert("Fuzzy high similarity", fuzzySimilarity("شرح رياض الصالحين", "شرح رياض الصالحين") === 1);
assert("Composite key", compositeLessonKey({ title: "درس", speaker_name: "فلان" }).includes("درس"));

// Unit — trust scorer
assert("Official website trust", computeSourceTrustScore({ source_type: "website", trust_score: 96 }) >= 96);
assert("Instagram trusted", computeSourceTrustScore({ source_type: "instagram", trust_score: 98 }) >= 98);
const conf = computeExtractionConfidence({
  sourceTrust: 98,
  extractionConfidence: 0.9,
  hasImage: true,
  hasSourceUrl: true,
  fieldCompleteness: 0.8,
});
assert("Confidence computation", conf >= 0.85);
assert("Auto-publish at 95%", shouldAutoPublishIntelligence({ confidence: 0.96, sourceTrust: 98, autoPublishEnabled: true }));
assert("No auto-publish low conf", !shouldAutoPublishIntelligence({ confidence: 0.8, sourceTrust: 98, autoPublishEnabled: true }));

// Unit — image hash
const buf = Buffer.alloc(128, 42);
assert("SHA256 hash", sha256ImageHash(buf)?.length === 32);
const d1 = computeDHash(buf);
const d2 = computeDHash(buf);
assert("Perceptual hash stable", d1 === d2);
assert("Perceptual similarity self", perceptualSimilarity(d1, d2) === 1);

// Unit — embedding stub
assert("Embedding stub", computeEmbeddingSimilarity("درس فقه", "درس فقه") >= 0.9);

// Unit — field completeness
assert("Field completeness", fieldCompletenessScore({
  title: "x", speaker_name: "y", mosque: "z", start_date: "2026-01-01", lesson_time: "8pm",
}) === 1);

// Integration — extractors registry
assert("Extractors count", EXTRACTOR_IDS.length >= 10);
assert("Instagram extractors", selectExtractorsForSource({ source_type: "instagram" }).includes("vision_ai"));
assert("RSS extractors", selectExtractorsForSource({ source_type: "rss" }).includes("rss_parser"));
assert("PDF extractors", selectExtractorsForSource({ source_type: "pdf" }).includes("pdf_reader"));

// Integration — adapters
assert("Adapters list", listSupportedAdapters().includes("wordpress"));
assert("YouTube adapter", resolveAdapterType("youtube") === "youtube");
assert("WordPress → website", resolveAdapterType("wordpress") === "website");

const kuwaitSrc = KUWAIT_INSTAGRAM_SOURCES[0];
const mapped = lessonSourceToConnectorSource({
  ...kuwaitSrc,
  source_name: kuwaitSrc.name,
  source_url: kuwaitSrc.url,
  auto_publish: true,
  trust_score: 98,
});
assert("Kuwait source mapping", mapped.source_type === "instagram" && mapped.auto_publish_allowed === true);

// Performance smoke — fuzzy 100 pairs
const t0 = Date.now();
for (let i = 0; i < 100; i++) fuzzySimilarity("شرح كتاب التوحيد للشيخ", "شرح التوحيد");
const elapsed = Date.now() - t0;
assert(`Performance: 100 fuzzy comparisons < 500ms (${elapsed}ms)`, elapsed < 500);

console.log(`\n${passed} passed, ${failed} failed`);
console.log(failed ? "SOME TESTS FAILED" : "All Phase 6 intelligence tests passed");
process.exit(failed ? 1 : 0);
