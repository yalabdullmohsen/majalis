#!/usr/bin/env node
/**
 * Majlis Knowledge Engine v1 — Autonomous Platform verification.
 */
import {
  ENGINE_VERSION,
  SUPPORTED_SOURCE_TYPES,
  PIPELINE_STAGES,
  listSupportedPlatforms,
  getVisionStatus,
  makeContentDecision,
  runQualityChecks,
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

console.log(`Majlis Knowledge Engine v${ENGINE_VERSION} — Platform 1.0 Tests\n`);

// 1. Engine config
assert("Engine version", ENGINE_VERSION === "1.0.0");
assert("Supported source types >= 25", SUPPORTED_SOURCE_TYPES.length >= 25);
assert("Pipeline stages >= 14", PIPELINE_STAGES.length >= 14);

// 2. Platform adapters
const platforms = listSupportedPlatforms();
assert("Platform registry", platforms.length >= 25);
assert("Instagram adapter", resolveAdapterType("instagram") === "instagram");
assert("ICS adapter", resolveAdapterType("ics") === "rss");
assert("PNG adapter", resolveAdapterType("png") === "manual");
assert("Mosque announcement", resolveAdapterType("mosque_announcement") === "website");

// 3. Vision status
const vision = getVisionStatus();
assert("Vision capabilities", vision.capabilities?.length >= 6);

// 4. Decision engine — trusted + complete → approved path
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
  trust_level: "official",
  auto_publish_allowed: true,
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

// 5. Decision — unknown source → pending
const unknownDecision = await makeContentDecision({
  source: { id: "x", trust_score: 30, auto_publish: false, active: true },
  parsed: fullParsed,
  confidenceScore: 0.97,
  sourceUrl: "https://example.com/post",
  imageUrl: "https://example.com/poster.jpg",
});
assert("Unknown source → pending_review", unknownDecision.decision === "pending_review");

// 6. Decision — low confidence → pending
const lowConfDecision = await makeContentDecision({
  source: trustedSource,
  parsed: fullParsed,
  confidenceScore: 0.5,
  sourceUrl: "https://example.com/post",
  imageUrl: "https://example.com/poster.jpg",
});
assert("Low confidence → pending", !lowConfDecision.autoPublish);

// 7. Quality control
const quality = await runQualityChecks({
  parsed: fullParsed,
  sourceUrl: "https://example.com",
});
assert("Quality check passes valid lesson", quality.ok);

const weakQuality = await runQualityChecks({
  parsed: { title: "حديث ضعيف عن فضل", description: "موضوع" },
  sourceUrl: "https://example.com",
});
assert("Quality blocks weak hadith markers", !weakQuality.ok || weakQuality.blockers.length > 0);

// 8. Incomplete fields → pending
const incompleteDecision = await makeContentDecision({
  source: trustedSource,
  parsed: { title: "درس" },
  confidenceScore: 0.99,
  sourceUrl: "https://example.com",
});
assert("Incomplete → pending", incompleteDecision.decision !== "approved" || !incompleteDecision.autoPublish);

console.log(failed ? `\n${failed} test(s) failed` : "\nAll Majlis Knowledge Engine tests passed (8 scenarios)");
process.exit(failed ? 1 : 0);
