#!/usr/bin/env node
/**
 * Round 103 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round103-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r103-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 103,
  roundAr: "١٠٣",
  quizStart: 3955,
  quizEnd: 4004,
  qaStart: 2740,
  qaEnd: 2779,
  storyStart: 384,
  storyEnd: 388,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
