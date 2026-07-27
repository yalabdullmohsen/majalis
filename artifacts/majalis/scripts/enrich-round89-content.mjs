#!/usr/bin/env node
/**
 * Round 89 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round89-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r89-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 89,
  roundAr: "٨٩",
  quizStart: 3255,
  quizEnd: 3304,
  qaStart: 2180,
  qaEnd: 2219,
  storyStart: 314,
  storyEnd: 318,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
