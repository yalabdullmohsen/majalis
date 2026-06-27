#!/usr/bin/env node
/**
 * Majlis Knowledge Engine v2 — Autonomous Platform verification.
 */
import {
  ENGINE_VERSION,
  SUPPORTED_SOURCE_TYPES,
  PIPELINE_STAGES,
  INTELLIGENCE_LAYERS,
  listSupportedPlatforms,
  getVisionStatus,
  makeContentDecision,
  makeMultiStageDecision,
  runQualityChecks,
  runQualityEngine,
  computeCompositeScore,
  getSearchCapabilities,
  resolveActiveAiProvider,
} from "../lib/majlis-knowledge-engine/index.mjs";
import { resolveAdapterType } from "../lib/cms/lesson-intelligence/adapters/index.mjs";

let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

console.log(`Majlis Autonomous Platform v${ENGINE_VERSION} — Tests\n`);

assert("Engine version 2.0", ENGINE_VERSION === "2.0.0");
assert("Supported source types >= 28", SUPPORTED_SOURCE_TYPES.length >= 28);
assert("Pipeline stages >= 14", PIPELINE_STAGES.length >= 14);
assert("Intelligence layers >= 8", INTELLIGENCE_LAYERS.length >= 8);
assert("Email/webhook/api types", ["email", "webhook", "api"].every((t) => SUPPORTED_SOURCE_TYPES.includes(t)));

const platforms = listSupportedPlatforms();
assert("Platform registry", platforms.length >= 28);
assert("Instagram adapter", resolveAdapterType("instagram") === "instagram");
assert("Webhook adapter", resolveAdapterType("webhook") === "website");

const vision = getVisionStatus();
assert("Vision capabilities", vision.capabilities?.length >= 6);

const scores = computeCompositeScore({ trust_score: 90, activity_score: 80, health_score: 100 });
assert("Discovery composite score", scores.composite > 70);

const searchCaps = getSearchCapabilities();
assert("Search arabic morphology", searchCaps.arabicMorphology === true);
assert("AI provider resolved", typeof resolveActiveAiProvider() === "string");

const future = new Date();
future.setMonth(future.getMonth() + 2);
const fullParsed = {
  title: "شرح كتاب التوحيد",
  speaker_name: "الشيخ عبدالله الأنصاري",
  start_date: future.toISOString().slice(0, 10),
  gregorian_date: future.toISOString().slice(0, 10),
  day_of_week: "الجمعة",
  lesson_time: "بعد العشاء",
  mosque: "مسجد السلام",
  region: "الجهراء",
  city: "العاصمة",
  country: "الكويت",
  category: "عقيدة",
};
const trustedSource = {
  id: "test",
  trust_score: 95,
  auto_publish: true,
  active: true,
};

const approvedDecision = await makeContentDecision({
  source: trustedSource,
  parsed: fullParsed,
  confidenceScore: 0.97,
  sourceUrl: "https://instagram.com/p/test123",
  imageUrl: "https://example.com/poster.jpg",
  sheikhMatch: { matched: { id: "sheikh-1" } },
  mosqueMatch: { id: "mosque-1" },
});
assert("Trusted+complete → approved or pending", ["approved", "pending_review"].includes(approvedDecision.decision));

const multiDecision = await makeMultiStageDecision({
  source: trustedSource,
  parsed: fullParsed,
  confidenceScore: 0.97,
  sourceUrl: "https://instagram.com/p/test123",
  imageUrl: "https://example.com/poster.jpg",
  visionMetrics: { visionConfidence: 0.9, ocrConfidence: 0.8, combinedConfidence: 0.9 },
  quality: { ok: true, severity: "ok", blockers: [] },
});
assert("Multi-stage decision has stages", multiDecision.multiStage?.stages?.length >= 5);

const qualityV2 = await runQualityEngine({
  parsed: fullParsed,
  source: trustedSource,
  sourceUrl: "https://example.com/lesson",
  imageUrl: "https://example.com/poster.jpg",
});
assert("Quality engine v2 passes valid lesson", qualityV2.ok);

const weakQuality = await runQualityChecks({
  parsed: { title: "حديث ضعيف عن فضل", description: "موضوع" },
  sourceUrl: "https://example.com",
});
assert("Quality blocks weak hadith markers", !weakQuality.ok || weakQuality.blockers.length > 0);

console.log(failed ? `\n${failed} test(s) failed` : "\nAll Majlis Autonomous Platform v2 tests passed");
process.exit(failed ? 1 : 0);
