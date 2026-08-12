#!/usr/bin/env node
/**
 * Round 93 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round93-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r93-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 93,
  roundAr: "٩٣",
  quizStart: 3455,
  quizEnd: 3504,
  qaStart: 2340,
  qaEnd: 2379,
  storyStart: 334,
  storyEnd: 338,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
