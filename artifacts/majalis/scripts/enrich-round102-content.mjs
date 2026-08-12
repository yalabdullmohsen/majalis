#!/usr/bin/env node
/**
 * Round 102 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round102-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r102-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 102,
  roundAr: "١٠٢",
  quizStart: 3905,
  quizEnd: 3954,
  qaStart: 2700,
  qaEnd: 2739,
  storyStart: 379,
  storyEnd: 383,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
