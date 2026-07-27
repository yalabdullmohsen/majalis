#!/usr/bin/env node
/**
 * Round 87 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round87-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS, STORY_ITEMS, PM_ITEMS } from "./r87-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 87,
  roundAr: "٨٧",
  quizStart: 3155,
  quizEnd: 3204,
  qaStart: 2100,
  qaEnd: 2139,
  storyStart: 304,
  storyEnd: 308,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
