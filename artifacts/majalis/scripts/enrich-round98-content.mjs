#!/usr/bin/env node
/**
 * Round 98 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round98-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r98-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 98,
  roundAr: "٩٨",
  quizStart: 3705,
  quizEnd: 3754,
  qaStart: 2540,
  qaEnd: 2579,
  storyStart: 359,
  storyEnd: 363,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
