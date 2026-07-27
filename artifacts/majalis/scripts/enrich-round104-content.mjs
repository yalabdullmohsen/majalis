#!/usr/bin/env node
/**
 * Round 104 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round104-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r104-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 104,
  roundAr: "١٠٤",
  quizStart: 4005,
  quizEnd: 4054,
  qaStart: 2780,
  qaEnd: 2819,
  storyStart: 389,
  storyEnd: 393,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
