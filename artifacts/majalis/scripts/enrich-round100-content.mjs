#!/usr/bin/env node
/**
 * Round 100 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round100-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r100-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 100,
  roundAr: "١٠٠",
  quizStart: 3805,
  quizEnd: 3854,
  qaStart: 2620,
  qaEnd: 2659,
  storyStart: 369,
  storyEnd: 373,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
