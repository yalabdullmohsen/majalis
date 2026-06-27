#!/usr/bin/env node
/**
 * Phase 4 auto-publish rule scenarios (no network/DB).
 */
import { simulateAutoPublishScenario, AUTO_PUBLISH_KILL_SWITCH } from "../lib/cms/lesson-source-monitor.mjs";
import { AUTO_PUBLISH_MIN_CONFIDENCE } from "../lib/cms/auto-publish-engine.mjs";

let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

const futureDate = new Date();
futureDate.setMonth(futureDate.getMonth() + 2);
const futureIso = futureDate.toISOString().slice(0, 10);

const completeParsed = {
  title: "شرح كتاب التوحيد",
  speaker_name: "الشيخ عبدالله الأنصاري",
  start_date: futureIso,
  gregorian_date: futureIso,
  lesson_time: "بعد العشاء",
  mosque: "مسجد الدعوة",
  region: "الصديق",
  city: "العاصمة",
  day_of_week: "الجمعة",
};

const trustedAutoSource = {
  active: true,
  auto_publish_allowed: true,
  trust_level: "official",
};

const trustedNoAutoSource = {
  active: true,
  auto_publish_allowed: true,
  trust_level: "trusted",
};

const unknownSource = {
  active: true,
  auto_publish_allowed: false,
  trust_level: "unknown",
};

const communitySource = {
  active: true,
  auto_publish_allowed: true,
  trust_level: "community",
};

// Phase 4 test 1: trusted + complete + high confidence → auto publish
const s1 = simulateAutoPublishScenario({
  source: trustedAutoSource,
  parsed: completeParsed,
  confidenceScore: 0.96,
  duplicate: { isDuplicate: false },
  sheikhMatch: { matched: { id: "sheikh-1", name: completeParsed.speaker_name } },
  sourceUrl: "https://example.com/lesson/1",
  imageUrl: "https://example.com/poster.jpg",
});
assert("Phase 4 #1: trusted complete → auto-publish approved", s1.decision === "approved" && s1.autoPublish === true);

// Phase 4 test 2: trusted but incomplete (no image) → pending_review
const s2 = simulateAutoPublishScenario({
  source: trustedNoAutoSource,
  parsed: { ...completeParsed, start_date: "", gregorian_date: "", day_of_week: "" },
  confidenceScore: 0.96,
  duplicate: { isDuplicate: false },
  sheikhMatch: { matched: { id: "sheikh-1" } },
  sourceUrl: "https://example.com/lesson/2",
  imageUrl: null,
});
assert("Phase 4 #2: trusted incomplete → pending_review", s2.decision === "pending_review" && !s2.autoPublish);

// Phase 4 test 3: unknown source → pending_review only
const s3 = simulateAutoPublishScenario({
  source: unknownSource,
  parsed: completeParsed,
  confidenceScore: 0.99,
  duplicate: { isDuplicate: false },
  sheikhMatch: { matched: { id: "sheikh-1" } },
  sourceUrl: "https://example.com/lesson/3",
  imageUrl: "https://example.com/poster.jpg",
});
assert("Phase 4 #3: unknown source → pending_review", s3.decision === "pending_review" && !s3.autoPublish);

// community never auto-publishes
const s5 = simulateAutoPublishScenario({
  source: communitySource,
  parsed: completeParsed,
  confidenceScore: 0.99,
  duplicate: { isDuplicate: false },
  sheikhMatch: { matched: { id: "sheikh-1" } },
  sourceUrl: "https://example.com/lesson/5",
  imageUrl: "https://example.com/poster.jpg",
});
assert("community source → pending_review", s5.decision === "pending_review" && !s5.autoPublish);

// Duplicate blocks publish
const s4 = simulateAutoPublishScenario({
  source: trustedAutoSource,
  parsed: completeParsed,
  confidenceScore: 0.99,
  duplicate: { isDuplicate: true, message: "duplicate" },
  sheikhMatch: { matched: { id: "sheikh-1" } },
  sourceUrl: "https://example.com/lesson/4",
  imageUrl: "https://example.com/poster.jpg",
});
assert("duplicate → duplicate decision", s4.decision === "duplicate");

// Low confidence → review
const s6 = simulateAutoPublishScenario({
  source: trustedAutoSource,
  parsed: completeParsed,
  confidenceScore: 0.80,
  duplicate: { isDuplicate: false },
  sheikhMatch: { matched: { id: "sheikh-1" } },
  sourceUrl: "https://example.com/lesson/6",
  imageUrl: "https://example.com/poster.jpg",
});
assert("low confidence → pending_review", s6.decision === "pending_review" && !s6.autoPublish);

assert("min confidence threshold is 95%", AUTO_PUBLISH_MIN_CONFIDENCE === 0.95);
assert("Phase 4: auto-publish enabled (kill switch off)", AUTO_PUBLISH_KILL_SWITCH === false);

if (failed > 0) {
  console.error(`\n${failed} scenario(s) failed.`);
  process.exit(1);
}

console.log("\nAll Phase 4 auto-publish scenarios passed.");
