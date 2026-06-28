#!/usr/bin/env node
/**
 * Autonomous Knowledge Platform v3 — unit tests (no network required).
 */
import {
  PLATFORM_V3_VERSION,
  computeHealthScore,
  HEALTH_DISABLE_THRESHOLD,
  scoreContentQuality,
  batchQualityCheck,
  computeSmartSchedule,
  shouldRunMode,
  healWithRetry,
  normalizeLanguageCode,
  SUPPORTED_LANGUAGES,
  buildI18nPayload,
  getDailyGoalProgress,
  sanitizeAdminPayload,
} from "../lib/autonomous-platform/v3/index.mjs";
import { PLATFORM_VERSION, DAILY_QUOTAS, CONTENT_PIPELINES, CRON_SCHEDULES } from "../lib/autonomous-platform/config.mjs";

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

console.log(`Autonomous Knowledge Platform v3 — Tests\n`);

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

const healthy = computeHealthScore({
  httpStatus: 200,
  responseMs: 800,
  itemsFound: 12,
  qualityScore: 85,
  errorRatePct: 0,
  hoursSinceSuccess: 1,
});
assert("Healthy source score >= 80", healthy >= 80);

const unhealthy = computeHealthScore({
  httpStatus: 500,
  responseMs: 15000,
  itemsFound: 0,
  qualityScore: 30,
  errorRatePct: 80,
  hoursSinceSuccess: 72,
});
assert("Unhealthy source score < 60", unhealthy < HEALTH_DISABLE_THRESHOLD);

const goodBenefit = scoreContentQuality(
  { text: "طلب العلم فريضة على كل مسلم. والصدقة برهان." },
  "benefits",
);
assert("Good benefit quality >= 70", goodBenefit.score >= 70);
assert("Good benefit has no errors", goodBenefit.errors.length === 0);

const badBenefit = scoreContentQuality({ text: "قصير" }, "benefits");
assert("Short text quality < 70", badBenefit.score < 70);
assert("Short text has errors", badBenefit.errors.includes("text_too_short"));

const goodQuestion = scoreContentQuality(
  {
    question: "ما حكم الزكاة؟",
    answer: "الزكاة واجبة على المسلم إذا بلغ النصاب وحال عليه الحول.",
  },
  "questions",
);
assert("Good question quality >= 70", goodQuestion.score >= 70);

const missingAnswer = scoreContentQuality({ question: "سؤال؟", answer: "" }, "questions");
assert("Missing answer penalized", missingAnswer.errors.includes("missing_answer"));

const batch = await batchQualityCheck(
  [
    { text: "الصبر مفتاح الفرج. والله أعلم." },
    { text: "" },
  ],
  "benefits",
);
assert("Batch quality avg > 0", batch.avgScore > 0);
assert("Batch rejects low quality", batch.rejected >= 1);

const schedule = await computeSmartSchedule({
  activeSources: 25,
  pendingJobs: 60,
  recentErrors: 2,
  serverLoad: 0.9,
  goalGap: 150,
});
assert("Smart scheduler loadFactor > 1", schedule.loadFactor > 1);
assert("Smart scheduler has nextRuns", Object.keys(schedule.nextRuns).length >= 3);
assert("High errors reduce errorBudget", schedule.errorBudget < 1);

assert("shouldRunMode when no next run", shouldRunMode("fetch", {}));
assert("shouldRunMode when due", shouldRunMode("fetch", { next_runs: { fetch: new Date(Date.now() - 1000).toISOString() } }));
assert("shouldRunMode when not due", !shouldRunMode("fetch", { next_runs: { fetch: new Date(Date.now() + 3600000).toISOString() } }));

const retryOk = await healWithRetry(async () => ({ ok: true, value: 1 }), { maxAttempts: 3, component: "test" });
assert("healWithRetry succeeds", retryOk.ok !== false);

const retryFail = await healWithRetry(async () => ({ ok: false, error: "fail" }), { maxAttempts: 2, component: "test-fail" });
assert("healWithRetry exhausts retries", retryFail.ok === false && retryFail.attempts === 2);

assert("6 supported languages", SUPPORTED_LANGUAGES.length === 6);
assert("Arabic default language", normalizeLanguageCode("ar") === "ar");
assert("Unknown language falls back to ar", normalizeLanguageCode("xx") === "ar");
assert("English normalized", normalizeLanguageCode("EN") === "en");

const i18n = buildI18nPayload({ title: "عنوان", language: "ar" }, { en: { title: "Title" } });
assert("i18n payload has en translation", i18n.i18n.en?.title === "Title");
assert("i18n supported_languages", i18n.supported_languages.includes("en"));

const goals = await getDailyGoalProgress();
assert("Daily goals returns progress", goals.ok && goals.progress);
assert("Daily goals has all pipelines", Object.keys(goals.progress).length === 6);
assert("Daily goals totalGap is number", typeof goals.totalGap === "number");

const sanitized = sanitizeAdminPayload({ action: "test", service_role_key: "secret", name: "مصدر" });
assert("Sanitize removes secrets", !sanitized.service_role_key);
assert("Sanitize keeps safe fields", sanitized.name === "مصدر");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
