#!/usr/bin/env node
/**
 * Round 91 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round91-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r91-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 91,
  roundAr: "٩١",
  quizStart: 3355,
  quizEnd: 3404,
  qaStart: 2260,
  qaEnd: 2299,
  storyStart: 324,
  storyEnd: 328,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
