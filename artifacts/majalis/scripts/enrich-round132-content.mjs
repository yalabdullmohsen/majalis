#!/usr/bin/env node
/**
 * Horizontal round 132 — seerah source-audit focused content.
 * Usage: node scripts/enrich-round132-content.mjs [--apply] [--verify]
 */
import { createSeerahRoundRunner } from "./seerah-round-content-utils.mjs";
import {
  QUIZ_ITEMS,
  QA_ITEMS,
  FAWAID_ITEMS,
  STORY_ITEMS,
  PM_ITEMS,
} from "./r132-content-data.mjs";

const runner = createSeerahRoundRunner({
  metaUrl: import.meta.url,
  round: 132,
  roundAr: "١٣٢",
  quizStart: 4355,
  quizEnd: 4404,
  qaStart: 3060,
  qaEnd: 3099,
  storyStart: 424,
  storyEnd: 428,
  quizItems: QUIZ_ITEMS,
  qaItems: QA_ITEMS,
  fawaidItems: FAWAID_ITEMS,
  storyItems: STORY_ITEMS,
  pmItems: PM_ITEMS,
});

await runner.run();
