#!/usr/bin/env node
/**
 * Horizontal round 133 — continued seerah-method content.
 * Usage: node scripts/enrich-round133-content.mjs [--apply] [--verify]
 */
import { createSeerahRoundRunner } from "./seerah-round-content-utils.mjs";
import {
  QUIZ_ITEMS,
  QA_ITEMS,
  FAWAID_ITEMS,
  STORY_ITEMS,
  PM_ITEMS,
} from "./r133-content-data.mjs";

const runner = createSeerahRoundRunner({
  metaUrl: import.meta.url,
  round: 133,
  roundAr: "١٣٣",
  quizStart: 4405,
  quizEnd: 4454,
  qaStart: 3100,
  qaEnd: 3139,
  storyStart: 429,
  storyEnd: 433,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
