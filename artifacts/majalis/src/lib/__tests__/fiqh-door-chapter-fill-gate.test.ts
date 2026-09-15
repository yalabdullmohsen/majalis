/**
 * بوابة: أبواب الفقه الفرعية تُملأ من تصنيف الفصول، لا تبقى فارغة رغم وجود مسائل.
 * تشغيل: node --import tsx src/lib/__tests__/fiqh-door-chapter-fill-gate.test.ts
 */
import assert from "node:assert/strict";
import {
  FIQH_HUB_DOOR_ORDER,
  buildFiqhDoorSummaries,
  resolveChapterDoorId,
} from "../fiqh/fiqhNormalize";

assert.equal(resolveChapterDoorId("talaq-sunni"), "talaq");
assert.equal(resolveChapterDoorId("riba-sarf"), "riba");
assert.equal(resolveChapterDoorId("adahi"), "udhiya");
assert.equal(resolveChapterDoorId("dhaka"), "sayd");
assert.equal(resolveChapterDoorId("sayd"), "sayd");
assert.equal(resolveChapterDoorId("sayd-haram"), null, "صيد الحرم يبقى تحت الحج");
assert.equal(resolveChapterDoorId("nafaqat-zawja"), "nafaqat");
assert.equal(resolveChapterDoorId("hadd-zina"), "hudud");
assert.equal(resolveChapterDoorId("shurut-shahada"), "shahadat");
assert.equal(resolveChapterDoorId("iqrar-mujmal"), "iqrar");
assert.equal(resolveChapterDoorId("mirath-haml"), "faraid");

const doors = buildFiqhDoorSummaries();
const empty = doors.filter((d) => d.issueCount === 0);
assert.equal(empty.length, 0, `أبواب بلا مسائل: ${empty.map((d) => d.id).join(",")}`);

for (const id of FIQH_HUB_DOOR_ORDER) {
  const door = doors.find((d) => d.id === id);
  assert.ok(door, `باب بوابة مفقود: ${id}`);
  assert.ok(door!.issueCount > 0, `باب البوابة ${id} بلا مسائل`);
  assert.equal(door!.status, "complete", `باب البوابة ${id} غير مكتمل`);
}

for (const id of [
  "udhiya",
  "sayd",
  "riba",
  "ijara",
  "qard",
  "waqf_hiba",
  "talaq",
  "iddah_rida",
  "nafaqat",
  "hudud",
  "shahadat",
  "faraid",
  "diyat",
  "iqrar",
] as const) {
  const door = doors.find((d) => d.id === id);
  assert.ok(door && door.issueCount > 0, `${id} يجب أن يُملأ من الفصول`);
}

console.log("fiqh-door-chapter-fill-gate: ok");
