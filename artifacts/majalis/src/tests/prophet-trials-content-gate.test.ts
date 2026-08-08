/**
 * بوابة محتوى ابتلاءات الأنبياء — كل عنصر منشور يلزم بشاهد (مصدر + مرجع + درجة).
 * تشغيل: node --import tsx src/tests/prophet-trials-content-gate.test.ts
 */
import assert from "node:assert/strict";
import {
  PROPHET_TRIALS,
  PROPHET_TRIALS_REVIEW_QUEUE,
} from "../content/prophet-trials";

assert.ok(
  PROPHET_TRIALS.length >= 8,
  `expected ≥8 trials, got ${PROPHET_TRIALS.length}`,
);

for (const trial of PROPHET_TRIALS) {
  assert.ok(trial.id?.trim(), `trial missing id: ${JSON.stringify(trial)}`);
  assert.ok(trial.prophetSlug?.trim(), `trial ${trial.id} missing prophetSlug`);
  assert.ok(trial.prophetNameAr?.trim(), `trial ${trial.id} missing prophetNameAr`);
  assert.ok(trial.trialTitleAr?.trim(), `trial ${trial.id} missing trialTitleAr`);
  assert.ok(trial.contextAr?.trim(), `trial ${trial.id} missing contextAr`);
  assert.ok(trial.stanceAr?.trim(), `trial ${trial.id} missing stanceAr`);
  assert.ok(trial.fruitAr?.trim(), `trial ${trial.id} missing fruitAr`);
  assert.ok(
    Array.isArray(trial.lessonsAr) && trial.lessonsAr.length >= 1,
    `trial ${trial.id} needs lessonsAr.length >= 1`,
  );
  assert.ok(
    Array.isArray(trial.citations) && trial.citations.length >= 1,
    `trial ${trial.id} needs citations.length >= 1`,
  );

  for (const citation of trial.citations) {
    assert.ok(
      citation.kind === "ayah" || citation.kind === "hadith",
      `trial ${trial.id}: citation.kind invalid`,
    );
    assert.ok(
      typeof citation.source === "string" && citation.source.trim().length > 0,
      `trial ${trial.id}: citation.source empty`,
    );
    assert.ok(
      typeof citation.reference === "string" && citation.reference.trim().length > 0,
      `trial ${trial.id}: citation.reference empty`,
    );
    assert.ok(
      typeof citation.grade === "string" && citation.grade.trim().length > 0,
      `trial ${trial.id}: citation.grade empty`,
    );
    if (citation.kind === "ayah") {
      assert.equal(
        citation.grade.trim(),
        "قرآن",
        `trial ${trial.id}: ayah grade must be «قرآن»`,
      );
    }
  }
}

assert.ok(
  PROPHET_TRIALS_REVIEW_QUEUE.length >= 5,
  `PROPHET_TRIALS_REVIEW_QUEUE length >= 5, got ${PROPHET_TRIALS_REVIEW_QUEUE.length}`,
);

for (const item of PROPHET_TRIALS_REVIEW_QUEUE) {
  assert.ok(item.id?.trim(), "review item missing id");
  assert.ok(item.titleAr?.trim(), `review ${item.id} missing titleAr`);
  assert.ok(item.reasonAr?.trim(), `review ${item.id} missing reasonAr`);
}

console.log(
  `prophet-trials-content-gate.test.ts: ok (${PROPHET_TRIALS.length} trials, ${PROPHET_TRIALS_REVIEW_QUEUE.length} review items)`,
);
