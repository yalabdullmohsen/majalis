#!/usr/bin/env node
/**
 * Round 106 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round106-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r106-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 106,
  roundAr: "١٠٦",
  quizStart: 4105,
  quizEnd: 4154,
  qaStart: 2860,
  qaEnd: 2899,
  storyStart: 399,
  storyEnd: 403,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
