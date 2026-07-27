#!/usr/bin/env node
/**
 * Round 86 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round86-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS, STORY_ITEMS, PM_ITEMS } from "./r86-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 86,
  roundAr: "٨٦",
  quizStart: 3105,
  quizEnd: 3154,
  qaStart: 2060,
  qaEnd: 2099,
  storyStart: 299,
  storyEnd: 303,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
