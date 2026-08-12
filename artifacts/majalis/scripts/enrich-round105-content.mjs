#!/usr/bin/env node
/**
 * Round 105 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round105-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r105-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 105,
  roundAr: "١٠٥",
  quizStart: 4055,
  quizEnd: 4104,
  qaStart: 2820,
  qaEnd: 2859,
  storyStart: 394,
  storyEnd: 398,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
