#!/usr/bin/env node
/**
 * Round 101 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round101-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r101-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 101,
  roundAr: "١٠١",
  quizStart: 3855,
  quizEnd: 3904,
  qaStart: 2660,
  qaEnd: 2699,
  storyStart: 374,
  storyEnd: 378,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
