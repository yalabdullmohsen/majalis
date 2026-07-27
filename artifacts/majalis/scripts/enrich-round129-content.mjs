#!/usr/bin/env node
/**
 * Round 129 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round129-content.mjs [--apply] [--verify]
 */
import { createSeerahRoundRunner } from "./seerah-round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r129-content-data.mjs";

const runner = createSeerahRoundRunner({
  metaUrl: import.meta.url,
  round: 129,
  roundAr: "١٢٩",
  quizStart: 4205,
  quizEnd: 4254,
  qaStart: 2940,
  qaEnd: 2979,
  storyStart: 409,
  storyEnd: 413,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
