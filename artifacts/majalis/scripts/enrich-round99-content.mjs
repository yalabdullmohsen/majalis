#!/usr/bin/env node
/**
 * Round 99 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round99-content.mjs [--apply] [--verify]
 */
import { createRoundRunner } from "./round-content-utils.mjs";
import { FAWAID_ITEMS, PM_ITEMS, QA_ITEMS, QUIZ_ITEMS, STORY_ITEMS } from "./r99-content-data.mjs";

const runner = createRoundRunner({
  metaUrl: import.meta.url,
  round: 99,
  roundAr: "٩٩",
  quizStart: 3755,
  quizEnd: 3804,
  qaStart: 2580,
  qaEnd: 2619,
  storyStart: 364,
  storyEnd: 368,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
