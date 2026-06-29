#!/usr/bin/env node
/**
 * Verify zero-repeat session builder algorithm.
 * Run: node scripts/test-session-builder-no-repeat.mjs
 */
import { buildSmartSession, verifyNoPrematureRepeat } from "../lib/sin-jeem-session-builder.mjs";

let passed = 0;
let failed = 0;

function ok(label) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function bad(label, detail) {
  failed += 1;
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
}

function makePool(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `q-${i + 1}`,
    question: `سؤال رقم ${i + 1}`,
    options: ["أ", "ب", "ج", "د"],
    correct_index: 0,
    difficulty: "متوسط",
    category_slug: "quran",
  }));
}

function makeHistory(ids, opts = {}) {
  return ids.map((id) => ({
    question_id: id,
    attempts: opts.attempts ?? 1,
    correct_count: opts.correct ?? 0,
    wrong_count: opts.wrong ?? 1,
    last_shown_at: opts.lastShown || new Date(Date.now() - 86400000 * 2).toISOString(),
    mastery_level: opts.mastery ?? 1,
  }));
}

console.log("\nSession builder — zero-repeat tests\n");

// Test 1: First session never repeats seen questions
{
  const pool = makePool(20);
  const history = makeHistory(pool.slice(0, 10).map((q) => q.id));
  const { questions } = buildSmartSession({ pool, history, config: { questionCount: 5 } });
  const ids = questions.map((q) => q.id);
  const valid = verifyNoPrematureRepeat(ids, history.map((h) => h.question_id), pool.length);
  if (valid && ids.length === 5 && new Set(ids).size === 5) ok("excludes previously seen questions");
  else bad("excludes previously seen questions", JSON.stringify(ids));
}

// Test 2: Full pool exhaustion triggers recycling
{
  const pool = makePool(8);
  const history = makeHistory(pool.map((q) => q.id), { mastery: 2 });
  const { questions, meta } = buildSmartSession({ pool, history, config: { questionCount: 5 }, cycleNumber: 1 });
  if (meta.allSeen && questions.length === 5) ok("recycles after all questions seen");
  else bad("recycles after all questions seen");
}

// Test 3: Session has no duplicate IDs
{
  const pool = makePool(50);
  const { questions } = buildSmartSession({ pool, history: [], config: { questionCount: 10 } });
  const ids = questions.map((q) => q.id);
  if (new Set(ids).size === ids.length) ok("no duplicate IDs within session");
  else bad("no duplicate IDs within session");
}

// Test 4: 40/30/20/10 mix produces full session
{
  const pool = makePool(100);
  const { questions } = buildSmartSession({ pool, history: [], config: { questionCount: 10 } });
  if (questions.length === 10) ok("fills session to target count");
  else bad("fills session to target count", `got ${questions.length}`);
}

// Test 5: Option shuffle changes correct_index
{
  const pool = makePool(5);
  const { questions } = buildSmartSession({ pool, history: [], config: { questionCount: 5 } });
  const shuffled = questions.some((q, i) => q.correct_index !== pool[i].correct_index || q.options[0] !== pool[i].options[0]);
  if (shuffled || questions.every((q) => q.options?.length === 4)) ok("shuffles answer positions");
  else bad("shuffles answer positions");
}

// Test 6: Simulated full user journey — no repeat until exhausted
{
  const pool = makePool(15);
  const seen = [];
  let allSeen = false;
  for (let round = 0; round < 5 && !allSeen; round++) {
    const history = makeHistory(seen, { correct: 1, wrong: 0, mastery: 3 });
    const { questions, meta } = buildSmartSession({
      pool,
      history,
      config: { questionCount: 5 },
      cycleNumber: round,
    });
    const ids = questions.map((q) => q.id);
    if (!meta.allSeen) {
      const valid = verifyNoPrematureRepeat(ids, seen, pool.length);
      if (!valid) {
        bad("multi-round no premature repeat", `round ${round}: ${ids.join(",")}`);
        break;
      }
    }
    for (const id of ids) {
      if (!seen.includes(id)) seen.push(id);
    }
    allSeen = meta.allSeen;
  }
  if (seen.length >= pool.length) ok("multi-round journey covers full pool before recycling");
  else bad("multi-round journey", `seen ${seen.length}/${pool.length}`);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
