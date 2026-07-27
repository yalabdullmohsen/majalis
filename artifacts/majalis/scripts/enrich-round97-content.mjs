#!/usr/bin/env node
/**
 * Round 97 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round97-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r97-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 97,
  roundAr: "٩٧",
  quizStart: 3655,
  quizEnd: 3704,
  qaStart: 2500,
  qaEnd: 2539,
  storyStart: 354,
  storyEnd: 358,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
