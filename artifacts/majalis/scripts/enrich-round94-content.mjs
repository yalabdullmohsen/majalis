#!/usr/bin/env node
/**
 * Round 94 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round94-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r94-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 94,
  roundAr: "٩٤",
  quizStart: 3505,
  quizEnd: 3554,
  qaStart: 2380,
  qaEnd: 2419,
  storyStart: 339,
  storyEnd: 343,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
