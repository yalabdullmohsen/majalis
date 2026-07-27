#!/usr/bin/env node
/**
 * Round 88 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round88-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS, STORY_ITEMS, PM_ITEMS } from "./r88-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 88,
  roundAr: "٨٨",
  quizStart: 3205,
  quizEnd: 3254,
  qaStart: 2140,
  qaEnd: 2179,
  storyStart: 309,
  storyEnd: 313,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
