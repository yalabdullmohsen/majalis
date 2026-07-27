#!/usr/bin/env node
/**
 * Round 96 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round96-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r96-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 96,
  roundAr: "٩٦",
  quizStart: 3605,
  quizEnd: 3654,
  qaStart: 2460,
  qaEnd: 2499,
  storyStart: 349,
  storyEnd: 353,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
