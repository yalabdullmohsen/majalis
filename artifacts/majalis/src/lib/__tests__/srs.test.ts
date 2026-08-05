/**
 * اختبار منطق التكرار المتباعد (srs).
 * تشغيل: npx tsx src/lib/__tests__/srs.test.ts
 */
import assert from "node:assert/strict";
import { schedule, MAX_SESSION, today } from "../srs";

assert.equal(MAX_SESSION, 20);

const noon = new Date("2026-08-05T12:00:00");
const base = today(noon);

const hard = schedule({ interval: 7, ease: 2.5, reps: 3, lapses: 0 }, "hard", noon);
assert.equal(hard.again, true);
assert.equal(hard.reps, 0);
assert.equal(hard.lapses, 1);
assert.equal(hard.interval, 1);
assert.ok(hard.ease < 2.5);

const later = schedule({ interval: 0, ease: 2.5, reps: 0 }, "later", noon);
assert.equal(later.again, false);
assert.equal(later.interval, 1);
assert.equal(later.reps, 1);

const ok0 = schedule({ interval: 0, ease: 2.5, reps: 0 }, "ok", noon);
assert.equal(ok0.interval, 1);
assert.equal(ok0.reps, 1);
assert.equal(ok0.again, false);

const ok1 = schedule({ interval: 1, ease: 2.5, reps: 1 }, "ok", noon);
assert.equal(ok1.interval, 3);

const ok2 = schedule({ interval: 3, ease: 2.5, reps: 2 }, "ok", noon);
assert.equal(ok2.interval, Math.round(3 * Math.min(2.8, 2.5 + 0.1)));

assert.equal(base.getHours(), 0);
assert.ok(ok0.dueOn.match(/^\d{4}-\d{2}-\d{2}$/));

console.log("srs.test.ts: ok");
