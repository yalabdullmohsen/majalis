#!/usr/bin/env node
/**
 * AKP stress tests — dedup, semantic, memory bounds (no live DB required for unit portion).
 */
import { performance } from "node:perf_hooks";
import { checkDuplicate, buildFingerprint } from "../lib/autonomous-platform/dedup.mjs";
import { normalizeArabicText, tokenOverlapSimilarity } from "../lib/autonomous-platform/normalize.mjs";
import { semanticSimilarityLocal, buildSemanticFingerprint } from "../lib/autonomous-platform/semantic.mjs";
import { batchSizeForPipeline, getDailyTargets } from "../lib/autonomous-platform/production-scheduler.mjs";
import { probeEndpoint } from "../lib/autonomous-platform/source-health.mjs";
import { signCronRequest, validateCronAuth } from "../lib/env-config.mjs";

let failed = 0;
const memStart = process.memoryUsage().heapUsed;

function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

console.log("=== AKP Stress Tests ===\n");

const targets = getDailyTargets();
assert("Daily targets computed", targets.quotas.benefits === 300);
assert("Spread batch benefits", batchSizeForPipeline("benefits", 0) > 0);

const t0 = performance.now();
const questions = [];
for (let i = 0; i < 1000; i += 1) {
  questions.push({
    question: `ما حكم ${i} في الصيام`,
    answer: `الجواب الشرعي للسؤال رقم ${i} مع تفصيل`,
  });
}
assert("1000 questions generated", questions.length === 1000);
console.log(`  1000 questions: ${Math.round(performance.now() - t0)}ms`);

const t1 = performance.now();
let dupHits = 0;
for (let i = 0; i < 200; i += 1) {
  const a = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";
  const b = i % 2 === 0 ? "بسم الله الرحمن الرحيم" : `نص مختلف ${i}`;
  if (tokenOverlapSimilarity(normalizeArabicText(a), normalizeArabicText(b)) > 0.85) dupHits += 1;
}
assert("200 dedup comparisons", performance.now() - t1 < 5000);
console.log(`  200 comparisons: ${Math.round(performance.now() - t1)}ms, near-dup: ${dupHits}`);

const t2 = performance.now();
for (let i = 0; i < 2000; i += 1) {
  buildFingerprint("benefits", { text: `فائدة رقم ${i % 100}` }, "test");
}
assert("2000 fingerprints", performance.now() - t2 < 8000);
console.log(`  2000 fingerprints: ${Math.round(performance.now() - t2)}ms`);

const t3 = performance.now();
for (let i = 0; i < 1000; i += 1) {
  semanticSimilarityLocal(
    buildSemanticFingerprint("حديث عن طلب العلم"),
    buildSemanticFingerprint(i % 3 === 0 ? "حديث عن طلب العلم فريضة" : `نص ${i}`),
  );
}
assert("1000 semantic local", performance.now() - t3 < 10000);
console.log(`  1000 semantic: ${Math.round(performance.now() - t3)}ms`);

const probe = await probeEndpoint("https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.min.json");
assert("Hadith CDN probe available", probe.status === "available" || probe.status === "slow");

const secret = process.env.CRON_SECRET || "test-stress-secret";
const headers = signCronRequest("/api/cron/autonomous-platform-monitor", secret);
const hmacOk = validateCronAuth({ headers, url: "/api/cron/autonomous-platform-monitor" });
assert("HMAC cron auth", hmacOk);

const dup = await checkDuplicate({
  contentType: "benefits",
  record: { text: "طلب العلم فريضة على كل مسلم" },
  source: { slug: "stress-test", dedup_rules: { hash: true, semantic_threshold: 0.99 } },
});
assert("Dedup check completes", typeof dup.duplicate === "boolean");

const memEnd = process.memoryUsage().heapUsed;
const memMb = (memEnd - memStart) / 1024 / 1024;
console.log(`\nMemory delta: ${memMb.toFixed(1)} MB`);
assert("Memory delta < 200MB", memMb < 200);

console.log(failed ? `\n${failed} stress test(s) failed` : "\nAll stress tests passed");
process.exit(failed ? 1 : 0);
