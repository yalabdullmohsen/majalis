#!/usr/bin/env node
/**
 * Autonomous Knowledge Platform — Phase 2 verification + hardening.
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
import { probeEndpoint, HEALTH_STATUS } from "../lib/autonomous-platform/source-health.mjs";
import { semanticSimilarityLocal, buildSemanticFingerprint } from "../lib/autonomous-platform/semantic.mjs";
import { batchSizeForPipeline } from "../lib/autonomous-platform/production-scheduler.mjs";
import { signCronRequest, validateCronAuth } from "../lib/env-config.mjs";

let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

console.log(`Autonomous Knowledge Platform v${PLATFORM_VERSION} — Hardening Tests\n`);

assert("Platform version 2.0", PLATFORM_VERSION === "2.0.0");
assert("6 content pipelines", Object.keys(CONTENT_PIPELINES).length === 6);
assert("Benefits daily quota 300", DAILY_QUOTAS.benefits === 300);
assert("Questions daily quota 150", DAILY_QUOTAS.questions === 150);
assert("Hadith daily quota 150", DAILY_QUOTAS.hadith === 150);
assert("Rulings daily quota 50", DAILY_QUOTAS.rulings === 50);
assert("Stories daily quota 20", DAILY_QUOTAS.stories === 20);
assert("Articles weekly quota 10", CONTENT_PIPELINES.articles.quota === 10);
assert("9+ cron schedules (incl monitor/recovery)", Object.keys(CRON_SCHEDULES).length >= 9);
assert("Monitor cron defined", Boolean(CRON_SCHEDULES.monitor));
assert("Recovery cron defined", Boolean(CRON_SCHEDULES.recovery));

const jsonSources = loadSourcesFromJson();
assert("JSON sources >= 8", jsonSources.length >= 8);
assert("All sources have fallback or internal/api type", jsonSources.every(
  (s) => s.fallback_urls?.length || s.source_type === "internal" || s.source_type === "api",
));
assert("Sources have dedup rules", jsonSources.every((s) => s.dedup_rules?.hash === true));

const hadithSource = jsonSources.find((s) => s.parser === "hadith_json");
if (hadithSource) {
  const probe = await probeEndpoint(hadithSource.source_url);
  assert("Primary hadith CDN reachable", probe.status === HEALTH_STATUS.AVAILABLE || probe.status === HEALTH_STATUS.SLOW);
}

const sources = await listContentSources({ activeOnly: true });
assert("listContentSources returns data", sources.length >= 6);

const norm = normalizeArabicText("  بِسْمِ  اللَّهِ  ");
assert("Arabic normalization strips tashkeel", norm.includes("بسم"));

const sim = tokenOverlapSimilarity("طلب العلم فريضة", "طلب العلم فريضة على كل مسلم");
assert("Token similarity", sim > 0.5);

const localSem = semanticSimilarityLocal(
  buildSemanticFingerprint("طلب العلم فريضة"),
  buildSemanticFingerprint("طلب العلم فريضة على كل مسلم"),
);
assert("Local semantic fallback", localSem > 0.3);

assert("Spread scheduler batch", batchSizeForPipeline("benefits", 0) > 0);

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

const secret = process.env.CRON_SECRET || "verify-test-secret";
process.env.CRON_SECRET = secret;
const hmacHeaders = signCronRequest("/api/cron/autonomous-platform-fetch", secret);
assert("HMAC cron signature validates", validateCronAuth({ headers: hmacHeaders, url: "/api/cron/autonomous-platform-fetch" }));

const health = await runAutonomousPlatform({ mode: "health", triggerType: "test" });
assert("Health check runs", health.ok !== undefined);

const monitor = await runAutonomousPlatform({ mode: "monitor", triggerType: "test" });
assert("Health monitor runs", monitor.healthScore !== undefined || monitor.checks !== undefined);

const tables = await probePlatformTables();
assert("Probe tables returns object", typeof tables === "object");

console.log(failed ? `\n${failed} test(s) failed` : "\nAll Autonomous Knowledge Platform hardening tests passed");
process.exit(failed ? 1 : 0);
