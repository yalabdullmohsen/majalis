/**
 * تحقق مراجع ومواءمة اقتباسات هبات الأقسام الحساسة.
 * node --import tsx src/lib/__tests__/section-route-quotes.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTE_QUOTE } from "@/config/section-template";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function ayahText(surah: number, ayah: number): string {
  const file = resolve(root, `public/data/quran/surah-${String(surah).padStart(3, "0")}.json`);
  const data = JSON.parse(readFileSync(file, "utf8")) as { ayahs: Array<{ numberInSurah: number; text: string }> };
  const row = data.ayahs.find((a) => a.numberInSurah === ayah);
  assert.ok(row, `آية ${surah}:${ayah} في المصدر المحلي`);
  return row.text;
}

assert.equal(ROUTE_QUOTE["/tarikh-islami"]?.ref, "الحج: ٤١");
assert.equal(ROUTE_QUOTE["/nations"]?.ref, "يوسف: ١١١");
assert.equal(ROUTE_QUOTE["/quran/people"]?.ref, "النساء: ١٦٤");
assert.equal(ROUTE_QUOTE["/seerah"]?.ref, "الأنبياء: ١٠٧");

assert.doesNotMatch(ROUTE_QUOTE["/tarikh-islami"]!.text, /رحمة.*العالمين/);
assert.doesNotMatch(ROUTE_QUOTE["/nations"]!.text, /رحمة.*العالمين/);
assert.match(ROUTE_QUOTE["/nations"]!.text, /عِبْرَة/);
assert.match(ROUTE_QUOTE["/tarikh-islami"]!.text, /مَّكَّنَّاهُمْ/);

assert.ok(ayahText(22, 41).length > 20, "الحج 41 في المصدر");
assert.ok(ayahText(12, 111).length > 20, "يوسف 111 في المصدر");
assert.ok(ayahText(4, 164).length > 20, "النساء 164 في المصدر");

console.log("section-route-quotes.test.ts: ok");
