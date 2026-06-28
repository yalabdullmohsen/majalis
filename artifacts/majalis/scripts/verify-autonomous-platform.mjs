#!/usr/bin/env node
/**
 * Autonomous Knowledge Platform — Phase 2 + v3 verification.
 */
import {
  PLATFORM_VERSION,
  PLATFORM_V3_VERSION,
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
import { computeHealthScore, HEALTH_DISABLE_THRESHOLD } from "../lib/autonomous-platform/v3/health-monitor.mjs";
import { scoreContentQuality } from "../lib/autonomous-platform/v3/quality-engine.mjs";

let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

console.log(`Autonomous Knowledge Platform v${PLATFORM_VERSION} (v3 ${PLATFORM_V3_VERSION}) — Tests\n`);

assert("Platform version 3.0.0", PLATFORM_VERSION === "3.0.0");
assert("V3 module version 3.0.0", PLATFORM_V3_VERSION === "3.0.0");
assert("6 content pipelines", Object.keys(CONTENT_PIPELINES).length === 6);
assert("Benefits daily quota 300", DAILY_QUOTAS.benefits === 300);
assert("Questions daily quota 150", DAILY_QUOTAS.questions === 150);
assert("Hadith daily quota 150", DAILY_QUOTAS.hadith === 150);
assert("Rulings daily quota 50", DAILY_QUOTAS.rulings === 50);
assert("Stories daily quota 20", DAILY_QUOTAS.stories === 20);
assert("Articles weekly quota 10", CONTENT_PIPELINES.articles.quota === 10);
assert("7+ cron schedules", Object.keys(CRON_SCHEDULES).length >= 7);
assert("Health disable threshold 60", HEALTH_DISABLE_THRESHOLD === 60);

const healthScore = computeHealthScore({ httpStatus: 200, responseMs: 500, itemsFound: 5, qualityScore: 80 });
assert("Health score computation", healthScore >= 60);

const quality = scoreContentQuality({ text: "طلب العلم فريضة على كل مسلم." }, "benefits");
assert("Quality engine scores content", quality.score >= 60);

const jsonSources = loadSourcesFromJson();
assert("JSON seed file exists (bootstrap only)", jsonSources.length >= 6);

const sources = await listContentSources({ activeOnly: true, dbOnly: true });
assert("listContentSources dbOnly runs", Array.isArray(sources));

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
