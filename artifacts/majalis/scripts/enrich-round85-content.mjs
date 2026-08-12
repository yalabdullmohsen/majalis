#!/usr/bin/env node
/**
 * Round 85 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round85-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS, STORY_ITEMS, PM_ITEMS } from "./r85-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 85,
  roundAr: "٨٥",
  quizStart: 3055,
  quizEnd: 3104,
  qaStart: 2020,
  qaEnd: 2059,
  storyStart: 294,
  storyEnd: 298,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
