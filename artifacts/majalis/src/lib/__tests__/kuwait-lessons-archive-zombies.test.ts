/**
 * دروس/دورات منتهية بتاريخ صريح يجب أن تُؤرشف بعد انتهائها
 * (لا تبقى «زومبي» بسبب is_recurring بدون end_date).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mapLessonRow, splitKuwaitLessons } from "../kuwait-lessons";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const CHUNK = resolve(HERE, "../../../public/data/lessons/chunk-000.json");

const ZOMBIE_IDS = [
  "kw-ajraa-murtaqa-course-3-0",
  "kw-ajraa-murtaqa-course-3-1",
  "kw-ajraa-murtaqa-course-3-2",
  "kw-ajraa-murtaqa-course-3-3",
  "kw-jury-aldahi-sharia-program-4-0",
] as const;

const EXPECTED_END: Record<(typeof ZOMBIE_IDS)[number], string> = {
  "kw-ajraa-murtaqa-course-3-0": "2026-07-29",
  "kw-ajraa-murtaqa-course-3-1": "2026-07-29",
  "kw-ajraa-murtaqa-course-3-2": "2026-07-29",
  "kw-ajraa-murtaqa-course-3-3": "2026-07-29",
  "kw-jury-aldahi-sharia-program-4-0": "2026-07-16",
};

console.log("\n=== kuwait lessons archive zombies ===");

const rows = JSON.parse(readFileSync(CHUNK, "utf8")) as Array<Record<string, unknown>>;
const byId = new Map(rows.map((r) => [String(r.id), r]));

for (const id of ZOMBIE_IDS) {
  const row = byId.get(id);
  assert.ok(row, `missing seed row ${id}`);
  assert.equal(row.end_date, EXPECTED_END[id], `${id} end_date`);
  assert.equal(row.is_recurring, false, `${id} is_recurring`);
}

const lessons = ZOMBIE_IDS.map((id) => mapLessonRow(byId.get(id)));
const afterAugust = new Date("2026-08-07T12:00:00+03:00").getTime();
const { active, archived } = splitKuwaitLessons(lessons, afterAugust);

assert.equal(active.length, 0, "must not stay active after Aug 2026");
assert.equal(archived.length, ZOMBIE_IDS.length);
for (const id of ZOMBIE_IDS) {
  assert.ok(archived.some((l) => l.id === id), `${id} archived`);
}

const duringCourse = new Date("2026-07-10T12:00:00+03:00").getTime();
const mid = splitKuwaitLessons(lessons, duringCourse);
assert.ok(
  mid.active.some((l) => l.id === "kw-ajraa-murtaqa-course-3-0"),
  "أجراح still active mid-July before end_date",
);
assert.ok(
  mid.active.some((l) => l.id === "kw-jury-aldahi-sharia-program-4-0"),
  "جوري still active before 16 July",
);

console.log("kuwait-lessons-archive-zombies: ok");
