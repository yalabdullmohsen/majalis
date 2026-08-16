/**
 * يمنع تكرار الألقاب ونسب المنظم كمحاضر في دورات مرتقى.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { formatSheikhName, stripSheikhHonorifics } from "../sheikh-name.ts";
import { buildLessonsSeed } from "../lessons-seed.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const snapshotPath = resolve(__dirname, "../../../scripts/lessons-seed.snapshot.json");

function hasDuplicateHonorific(label: string): boolean {
  return /(?:الشيخ|الشيخة|الدكتور|الدكتورة|الأستاذ|الأستاذة|القارئ|د\.)\s*[:：]?\s*(?:الشيخ|الشيخة|الدكتور|الدكتورة|الأستاذ|الأستاذة|القارئ|د\.)/u.test(
    label,
  );
}

console.log("=== تكرار الألقاب ===");
for (const raw of [
  "الشيخ أسامة الشطي",
  "الشيخ: الشيخ أسامة",
  "د.: د. مطلق",
  "الأستاذ: الأستاذ أحمد",
  "القارئ: القارئ محمود",
]) {
  const formatted = formatSheikhName(raw);
  assert.equal(hasDuplicateHonorific(formatted), false, `formatSheikhName(${raw}) → ${formatted}`);
}
assert.equal(hasDuplicateHonorific("الشيخ: الشيخ أسامة"), true, "الكاشف يلتقط التكرار الخام");
assert.equal(hasDuplicateHonorific("القارئ: القارئ محمود"), true, "الكاشف يلتقط تكرار القارئ");

console.log("=== بذرة الدروس: المحاضر ≠ المنظم في دورة الأجراح ===");
const rows = await buildLessonsSeed();
const session0 = rows.find((r) => r.id === "kw-ajraa-murtaqa-course-3-0");
assert.ok(session0, "جلسة التوحيد موجودة");
assert.match(String(session0.speaker_name), /مطلق/, "المحاضر من تسمية الجلسة: مطلق الجاسر");
assert.doesNotMatch(String(session0.speaker_name), /الأجراح/, "المنظم ليس المحاضر");
assert.match(String(session0.organizer_name || ""), /الأجراح|محمد سليمان/, "المنظم محفوظ");
assert.equal(session0.title, "دورة الشيخ الأجراح العلمية — الثالثة", "العنوان بلا لصق جلسة");

console.log("=== لقطة SEO تطابق البذرة الحية ===");
const snap = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{
  id: string;
  speaker_name?: string;
  organizer_name?: string;
  title?: string;
}>;
const snap0 = snap.find((r) => r.id === "kw-ajraa-murtaqa-course-3-0");
assert.ok(snap0, "اللقطة تحتوي الجلسة");
assert.match(String(snap0.speaker_name), /مطلق/, "لقطة SEO: المحاضر مطلق");
assert.doesNotMatch(String(snap0.speaker_name), /الأجراح/, "لقطة SEO: ليست الأجراح");
assert.equal(
  stripSheikhHonorifics(snap0.speaker_name || ""),
  stripSheikhHonorifics(session0.speaker_name || ""),
  "تطابق المحاضر بين اللقطة والبذرة",
);

console.log("lesson-role-validation: OK");
