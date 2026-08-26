import assert from "node:assert/strict";
import { expandSearchTerms } from "../search-synonyms.ts";
import {
  buildLessonShareUrl,
  formatLessonTimestampLabel,
  parseLessonShareTimestamp,
  type UnifiedLesson,
} from "../unified-lesson-card.ts";

const sampleLesson: UnifiedLesson = {
  id: "kw-test",
  title: "درس تجريبي",
  sheikhName: "شيخ",
  category: "فقه",
  day: "الجمعة",
  time: "بعد المغرب",
  scheduleTime: "بعد المغرب",
  mosque: "مسجد",
  region: "الكويت",
  governorate: "العاصمة",
  sortKey: Date.now(),
  nextOccurrenceMs: Date.now(),
  statusLabel: "قادم",
  detailsHref: "/lessons/kw-test",
};

// مرادفات الطهارة
{
  const terms = expandSearchTerms("الوضوء");
  assert.ok(terms.some((t) => /طهارة|نواقض/i.test(t)), "وضوء expands to طهارة");
}

{
  const terms = expandSearchTerms("نواقض الوضوء");
  assert.ok(terms.some((t) => /وضو|طه/i.test(t)), "نواقض expands to وضوء family");
}

// مشاركة من وقت محدد
assert.equal(parseLessonShareTimestamp("?t=750"), 750);
assert.equal(parseLessonShareTimestamp("?time=120"), 120);
assert.equal(parseLessonShareTimestamp(""), null);

assert.match(formatLessonTimestampLabel(750), /١٢:٣٠|12:30/u);

const url = buildLessonShareUrl(sampleLesson, { atSeconds: 90 });
assert.match(url, /\?t=90$/);

console.log("phase3-batch1-gate: ok");
