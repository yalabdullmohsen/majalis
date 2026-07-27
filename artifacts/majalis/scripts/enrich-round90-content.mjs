#!/usr/bin/env node
/**
 * Round 90 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round90-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r90-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 90,
  roundAr: "٩٠",
  quizStart: 3305,
  quizEnd: 3354,
  qaStart: 2220,
  qaEnd: 2259,
  storyStart: 319,
  storyEnd: 323,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
