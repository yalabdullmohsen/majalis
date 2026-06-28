#!/usr/bin/env node
/**
 * Unit tests for question generation engine (no AI calls).
 */
import { buildDailyPlan, todayKey } from "../lib/question-generation/categories.mjs";
import { validateStructure, qualityFilter, resolvePipelineStatus } from "../lib/question-generation/validate.mjs";
import { questionContentHash } from "../lib/question-generation/dedup.mjs";
import { ROTATION_CATEGORIES, DIFFICULTY_SLOTS, DAILY_TARGET } from "../lib/question-generation/config.mjs";

let pass = 0;
let fail = 0;

function ok(c, m) {
  if (c) {
    pass++;
    console.log(`✓ ${m}`);
  } else {
    fail++;
    console.error(`✗ ${m}`);
  }
}

ok(ROTATION_CATEGORIES.length >= 20, `rotation categories >= 20 (${ROTATION_CATEGORIES.length})`);
ok(DIFFICULTY_SLOTS.length === 50, `difficulty slots = 50 (${DIFFICULTY_SLOTS.length})`);

const easy = DIFFICULTY_SLOTS.filter((d) => d === "سهل").length;
const medium = DIFFICULTY_SLOTS.filter((d) => d === "متوسط").length;
const hard = DIFFICULTY_SLOTS.filter((d) => d === "متقدم").length;
ok(easy === 20, `40% easy (${easy})`);
ok(medium === 20, `40% medium (${medium})`);
ok(hard === 10, `20% hard (${hard})`);

const plan = buildDailyPlan(50);
ok(plan.length === 50, "daily plan has 50 slots");
const uniqueCats = new Set(plan.map((p) => p.category_slug));
ok(uniqueCats.size >= 15, `balanced categories in plan (${uniqueCats.size})`);

const sample = {
  question: "ما اسم السورة التي تبدأ بـ الم؟",
  options: ["البقرة", "آل عمران", "النisa", "المائدة"],
  correct_index: 1,
  correct_answer: "آل عمران",
  explanation: "سورة آل عمران تبدأ بالحروف المقطعة الم",
  source_type: "quran",
  source_reference: "سورة آل عمران:1",
  difficulty: "متوسط",
  tags: ["قرآن"],
};

const struct = validateStructure(sample);
ok(struct.ok, "valid sample passes structure");

const bad = { ...sample, question: "test placeholder" };
ok(!validateStructure(bad).ok, "placeholder rejected");

const pub = resolvePipelineStatus(0.99, 0.99);
ok(pub.pipeline_status === "published", "high confidence auto-publish");

const review = resolvePipelineStatus(0.96, 0.99);
ok(review.pipeline_status === "pending_review", "medium-high goes to review");

const hash1 = questionContentHash(sample.question, sample.correct_answer);
const hash2 = questionContentHash(sample.question, sample.correct_answer);
ok(hash1 === hash2, "content hash deterministic");

const quality = qualityFilter(sample, { confidence: 0.97, reference_valid: true, issues: [] });
ok(quality.ok, "quality filter passes good sample");

ok(todayKey().match(/^\d{4}-\d{2}-\d{2}$/), `todayKey format (${todayKey()})`);

console.log(`\nQuestion generation tests: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
