#!/usr/bin/env node
/**
 * Auto-publish rule scenarios (no network/DB).
 */
import { simulateAutoPublishScenario } from "../lib/cms/lesson-source-monitor.mjs";

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

const trustedSource = {
  active: true,
  auto_publish_allowed: true,
  trust_level: "official",
};

const unknownSource = {
  active: true,
  auto_publish_allowed: false,
  trust_level: "unknown",
};

// 1. Trusted + complete + high confidence → auto publish
const s1 = simulateAutoPublishScenario({
  source: trustedSource,
  parsed: completeParsed,
  confidenceScore: 0.96,
  duplicate: { isDuplicate: false },
  sheikhMatch: { matched: { id: "sheikh-1", name: completeParsed.speaker_name } },
  sourceUrl: "https://example.com/lesson/1",
  imageUrl: "https://example.com/poster.jpg",
});
assert("scenario 1: trusted complete → approved", s1.decision === "approved" && s1.autoPublish === true);

// 2. Trusted but missing date → review
const s2 = simulateAutoPublishScenario({
  source: trustedSource,
  parsed: { ...completeParsed, start_date: "", gregorian_date: "", day_of_week: "" },
  confidenceScore: 0.96,
  duplicate: { isDuplicate: false },
  sheikhMatch: { matched: { id: "sheikh-1" } },
  sourceUrl: "https://example.com/lesson/2",
  imageUrl: null,
});
assert("scenario 2: trusted incomplete → pending_review", s2.decision === "pending_review" && !s2.autoPublish);

// 3. Unknown source → review only
const s3 = simulateAutoPublishScenario({
  source: unknownSource,
  parsed: completeParsed,
  confidenceScore: 0.99,
  duplicate: { isDuplicate: false },
  sheikhMatch: { matched: { id: "sheikh-1" } },
  sourceUrl: "https://example.com/lesson/3",
  imageUrl: "https://example.com/poster.jpg",
});
assert("scenario 3: unknown source → pending_review", s3.decision === "pending_review" && !s3.autoPublish);

// Duplicate blocks publish
const s4 = simulateAutoPublishScenario({
  source: trustedSource,
  parsed: completeParsed,
  confidenceScore: 0.99,
  duplicate: { isDuplicate: true, message: "duplicate" },
  sheikhMatch: { matched: { id: "sheikh-1" } },
  sourceUrl: "https://example.com/lesson/4",
  imageUrl: "https://example.com/poster.jpg",
});
assert("scenario 4: duplicate → duplicate decision", s4.decision === "duplicate");

if (failed > 0) {
  console.error(`\n${failed} scenario(s) failed.`);
  process.exit(1);
}

console.log("\nAll lesson automation scenarios passed.");
