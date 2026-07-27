#!/usr/bin/env node
/**
 * Round 128 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round128-content.mjs [--apply] [--verify]
 */
import { createSeerahRoundRunner } from "./seerah-round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r128-content-data.mjs";

const runner = createSeerahRoundRunner({
  metaUrl: import.meta.url,
  round: 128,
  roundAr: "١٢٨",
  quizStart: 4155,
  quizEnd: 4204,
  qaStart: 2900,
  qaEnd: 2939,
  storyStart: 404,
  storyEnd: 408,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
