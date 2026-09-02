/**
 * تشغيل: node --import tsx src/lib/recitation-ai/__tests__/audio-matcher.test.ts
 */
import assert from "node:assert/strict";
import {
  getLevenshteinDistance,
  matchNormalizedWords,
  matchRecitationAdvanced,
  TOLERANT_SIMILARITY_THRESHOLD_PCT,
} from "../audio-matcher";

assert.equal(getLevenshteinDistance("", "abc"), 3);
assert.equal(getLevenshteinDistance("abc", ""), 3);
assert.equal(getLevenshteinDistance("kitten", "sitting"), 3);

assert.equal(matchRecitationAdvanced("الْحَمْدُ", "الحمد", false), true);
assert.equal(matchRecitationAdvanced("الْحَمْدُ", "الحمد", true), true);
assert.equal(matchRecitationAdvanced("الْحَمْدُ", "الحمدو", false), true);
assert.equal(matchRecitationAdvanced("رب", "ملك", true), false);
assert.equal(matchRecitationAdvanced("رب", "ملك", false), false);

assert.equal(
  matchNormalizedWords("الحمد", "الحمد", true),
  true,
);
assert.equal(
  matchNormalizedWords("الحمد", "الحم", false),
  matchNormalizedWords("الحمد", "الحم", true) === false,
);

const threshold = TOLERANT_SIMILARITY_THRESHOLD_PCT;
assert.ok(threshold >= 70 && threshold <= 80);

console.log("audio-matcher.test.ts: ok");
