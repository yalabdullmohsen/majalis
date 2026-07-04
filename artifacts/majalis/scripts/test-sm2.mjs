#!/usr/bin/env node
/**
 * test-sm2.mjs — اختبارات وحدة خوارزمية SM-2
 * التشغيل: node scripts/test-sm2.mjs
 */

// نُعيد تعريف sm2 مباشرة هنا لأن الملف الأصلي .ts
function sm2(state, quality) {
  let { interval_days, ease_factor, repetitions } = state;

  if (quality >= 3) {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval_days = 1;
  }

  ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  return { interval_days, ease_factor, repetitions };
}

// ── إطار اختبار بسيط ────────────────────────────────────────────────────────
let passed = 0, failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

function approx(a, b, delta = 0.001) {
  return Math.abs(a - b) <= delta;
}

const INITIAL = { interval_days: 1, ease_factor: 2.5, repetitions: 0 };

// ── حالة 1: إجابة صحيحة في أول مراجعة (quality=4) ─────────────────────────
console.log("\n1. إجابة صحيحة — أول مراجعة (q=4):");
{
  const next = sm2(INITIAL, 4);
  assert(next.repetitions === 1, `repetitions = 1 (الناتج: ${next.repetitions})`);
  assert(next.interval_days === 1, `interval_days = 1 يوم (الناتج: ${next.interval_days})`);
  // q=4: 0.1 - (5-4)*(0.08+0.02) = 0.1-0.1 = 0 → ease_factor لا يتغير عند q=4
  assert(approx(next.ease_factor, 2.5), `ease_factor = 2.5 لا يتغير عند q=4 (الناتج: ${next.ease_factor.toFixed(4)})`);
}

// ── حالة 2: إجابة صحيحة في المراجعة الثانية ────────────────────────────────
console.log("\n2. إجابة صحيحة — المراجعة الثانية (q=4):");
{
  const state1 = sm2(INITIAL, 4);
  const next = sm2(state1, 4);
  assert(next.repetitions === 2, `repetitions = 2 (الناتج: ${next.repetitions})`);
  assert(next.interval_days === 6, `interval_days = 6 أيام (الناتج: ${next.interval_days})`);
}

// ── حالة 3: إجابة صحيحة في المراجعة الثالثة ────────────────────────────────
console.log("\n3. إجابة صحيحة — المراجعة الثالثة (q=4):");
{
  const s1 = sm2(INITIAL, 4);
  const s2 = sm2(s1, 4);
  const s3 = sm2(s2, 4);
  assert(s3.repetitions === 3, `repetitions = 3 (الناتج: ${s3.repetitions})`);
  assert(s3.interval_days >= 10, `interval_days ≥ 10 (الناتج: ${s3.interval_days})`);
}

// ── حالة 4: نسيان (quality=0) يُعيد التهيئة ────────────────────────────────
console.log("\n4. نسيان تام (q=0) — إعادة تهيئة:");
{
  const s1 = sm2(INITIAL, 4);
  const s2 = sm2(s1, 4); // بعد 2 مراجعات
  const forgot = sm2(s2, 0); // نسيان
  assert(forgot.repetitions === 0, `repetitions يعود لـ 0 (الناتج: ${forgot.repetitions})`);
  assert(forgot.interval_days === 1, `interval_days يعود لـ 1 (الناتج: ${forgot.interval_days})`);
  assert(forgot.ease_factor < s2.ease_factor, `ease_factor ينخفض بعد النسيان`);
}

// ── حالة 5: حد أدنى للـ ease_factor ────────────────────────────────────────
console.log("\n5. حد أدنى لـ ease_factor (لا ينخفض دون 1.3):");
{
  let state = { ...INITIAL, ease_factor: 1.3 };
  for (let i = 0; i < 5; i++) state = sm2(state, 0);
  assert(state.ease_factor >= 1.3, `ease_factor ≥ 1.3 دائماً (الناتج: ${state.ease_factor.toFixed(4)})`);
}

// ── حالة 6: إجابة ممتازة (quality=5) ترفع ease_factor ──────────────────────
console.log("\n6. إجابة ممتازة (q=5) ترفع ease_factor:");
{
  const next = sm2(INITIAL, 5);
  assert(next.ease_factor > INITIAL.ease_factor, `ease_factor ارتفع من ${INITIAL.ease_factor} إلى ${next.ease_factor.toFixed(4)}`);
}

// ── حالة 7: quality=2 (صعب) لا يُثبّت التقدم ──────────────────────────────
console.log("\n7. quality=2 (أقل من 3) — إعادة تهيئة:");
{
  const s1 = sm2(INITIAL, 4);
  const s2 = sm2(s1, 2); // صعب — أقل من 3
  assert(s2.repetitions === 0, `repetitions يعود لـ 0 عند q<3 (الناتج: ${s2.repetitions})`);
  assert(s2.interval_days === 1, `interval_days = 1 عند q<3 (الناتج: ${s2.interval_days})`);
}

// ── حالة 8: quality=3 (على الحد) يُحتسب كنجاح ──────────────────────────────
console.log("\n8. quality=3 (الحد الأدنى للنجاح):");
{
  const next = sm2(INITIAL, 3);
  assert(next.repetitions === 1, `quality=3 يُحتسب كنجاح (repetitions=1): ${next.repetitions}`);
}

// ── النتيجة ──────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(50)}`);
console.log(`SM-2: ${passed} نجح، ${failed} فشل`);
console.log("═".repeat(50));
if (failed > 0) process.exit(1);
