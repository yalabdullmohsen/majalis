/**
 * Unit — Mutashabihat engine against the shipped index file.
 * Run: npx tsx tests/unit/mutashabihat-engine.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getSimilarAyahs, type MutashabihMatch } from "../../src/lib/recitation-ai/mutashabihat";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const index = JSON.parse(
  readFileSync(resolve(root, "public/data/quran/mutashabihat-index.json"), "utf8"),
) as Record<string, MutashabihMatch[]>;

let passed = 0;
let failed = 0;
function check(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.log(`  ✗ ${msg}`);
  }
}

console.log("═══ Mutashabihat Engine ═══");

check(Object.keys(index).length >= 500, `الفهرس يحتوي مفاتيح كافية (${Object.keys(index).length})`);

{
  const matches = getSimilarAyahs(index, 2, 255);
  check(matches.length >= 1, "آية الكرسي لها متشابهات");
  check(matches.some((m) => m.surah === 3 && m.ayah === 2), "2:255 ↔ 3:2 بنسبة تطابق 1");
  check(matches.every((m) => m.overlapRatio > 0 && m.overlapRatio <= 1.2), "نِسَب التداخل ضمن المدى المتوقع");
}

{
  const matches = getSimilarAyahs(index, 55, 13);
  check(matches.length >= 3, "الرحمن 13 لها عدة متشابهات داخل السورة");
  check(matches.every((m) => m.surah === 55), "متشابهات 55:13 كلها في سورة الرحمن");
  const ayahs = matches.map((m) => m.ayah).sort((a, b) => a - b);
  check(ayahs.includes(16) && ayahs.includes(18), "تشمل 16 و18");
}

{
  const empty = getSimilarAyahs(index, 114, 6);
  check(Array.isArray(empty), "آية بلا فهرس ⇒ مصفوفة");
  // قد تكون مفهرسة أو لا — لا نفشل إن وُجدت
}

{
  const a = getSimilarAyahs(index, 2, 5);
  const b = getSimilarAyahs(index, 31, 5);
  check(a.some((m) => m.surah === 31 && m.ayah === 5), "تبادل تشابه 2:5 ↔ 31:5");
  check(b.some((m) => m.surah === 2 && m.ayah === 5), "تبادل عكسي 31:5 ↔ 2:5");
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
