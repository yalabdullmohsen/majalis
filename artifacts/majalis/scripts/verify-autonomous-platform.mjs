#!/usr/bin/env node
/**
 * Autonomous Knowledge Platform — Phase 2 verification.
 */
import {
  PLATFORM_VERSION,
  CONTENT_PIPELINES,
  CRON_SCHEDULES,
  DAILY_QUOTAS,
  listContentSources,
  runAutonomousPlatform,
  probePlatformTables,
} from "../lib/autonomous-platform/index.mjs";
import { checkDuplicate } from "../lib/autonomous-platform/dedup.mjs";
import { verifyContent } from "../lib/autonomous-platform/verification.mjs";
import { normalizeArabicText, tokenOverlapSimilarity } from "../lib/autonomous-platform/normalize.mjs";
import { loadSourcesFromJson } from "../lib/autonomous-platform/sources.mjs";

let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

console.log(`Autonomous Knowledge Platform v${PLATFORM_VERSION} — Tests\n`);

assert("Platform version 2.0", PLATFORM_VERSION === "2.0.0");
assert("6 content pipelines", Object.keys(CONTENT_PIPELINES).length === 6);
assert("Benefits daily quota 300", DAILY_QUOTAS.benefits === 300);
assert("Questions daily quota 150", DAILY_QUOTAS.questions === 150);
assert("Hadith daily quota 150", DAILY_QUOTAS.hadith === 150);
assert("Rulings daily quota 50", DAILY_QUOTAS.rulings === 50);
assert("Stories daily quota 20", DAILY_QUOTAS.stories === 20);
assert("Articles weekly quota 10", CONTENT_PIPELINES.articles.quota === 10);
assert("7+ cron schedules", Object.keys(CRON_SCHEDULES).length >= 7);

const jsonSources = loadSourcesFromJson();
assert("JSON sources >= 6", jsonSources.length >= 6);
assert("Sources have dedup rules", jsonSources.every((s) => s.dedup_rules?.hash === true));
assert("Sources have publication policy", jsonSources.every((s) => s.publication_policy?.min_trust >= 75));

const sources = await listContentSources({ activeOnly: true });
assert("listContentSources returns data", sources.length >= 6);

const norm = normalizeArabicText("  بِسْمِ  اللَّهِ  ");
assert("Arabic normalization", norm.includes("بسم"));

const sim = tokenOverlapSimilarity("طلب العلم فريضة", "طلب العلم فريضة على كل مسلم");
assert("Token similarity", sim > 0.5);

const dup = await checkDuplicate({
  contentType: "benefits",
  record: { text: "طلب العلم فريضة" },
  source: { slug: "test", dedup_rules: { hash: true, semantic_threshold: 0.99 } },
});
assert("Dedup check runs", typeof dup.duplicate === "boolean");

const verification = await verifyContent({
  contentType: "benefits",
  record: { text: "طلب العلم فريضة على كل مسلم ومسلمة" },
  source: { trust_score: 90, language: "ar", publication_policy: { min_trust: 80 } },
});
assert("Benefits verification passes", verification.ok);

const badHadith = await verifyContent({
  contentType: "hadith",
  record: { text: "حديث ضعيف لا أصل له", grade: "ضعيف" },
  source: { trust_score: 90, language: "ar" },
});
assert("Hadith blocks weak markers", !badHadith.ok);

const health = await runAutonomousPlatform({ mode: "health", triggerType: "test" });
assert("Health check runs", health.ok !== undefined);

const tables = await probePlatformTables();
assert("Probe tables returns object", typeof tables === "object");

console.log(failed ? `\n${failed} test(s) failed` : "\nAll Autonomous Knowledge Platform tests passed");
process.exit(failed ? 1 : 0);
