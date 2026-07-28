/**
 * Unit — Tajweed timing parser + color-tag catalog.
 * Run: npx tsx tests/unit/tajweed-parser.test.ts
 */
import assert from "node:assert/strict";
import { analyzeTajweedTimings } from "../../src/lib/recitation-ai/tajweed-timing";
import type { ReferenceWord } from "../../src/lib/recitation-ai/types";
import {
  assertValidTajweedColor,
  tagTajweedColors,
  TAJWEED_COLOR_RULES,
} from "../../src/lib/tajweed-color-tags";

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

function ref(raw: string, i = 0): ReferenceWord {
  return {
    surah: 1,
    ayah: 1,
    wordIndex: i,
    globalIndex: i,
    raw,
    normalized: raw,
    page: 1,
  };
}

console.log("═══ Tajweed Timing Parser ═══");
{
  const short = analyzeTajweedTimings([
    { ref: ref("قال"), heard: { word: "قال", startSec: 0, endSec: 0.08 } },
  ]);
  check(short.length === 1 && short[0]!.rule === "madd_tabeei_short", "مد أقصر من المتوقع يُعلَّم");
}

{
  const long = analyzeTajweedTimings([
    { ref: ref("نوح"), heard: { word: "نوح", startSec: 0, endSec: 1.2 } },
  ]);
  check(long.length === 1 && long[0]!.rule === "madd_tabeei_long", "مد أطول من المعتاد يُعلَّم");
}

{
  const ok = analyzeTajweedTimings([
    { ref: ref("قال"), heard: { word: "قال", startSec: 0, endSec: 0.35 } },
  ]);
  check(ok.length === 0, "مدة طبيعية ⇒ بلا ملاحظة");
}

{
  const noMadd = analyzeTajweedTimings([
    { ref: ref("كتب"), heard: { word: "كتب", startSec: 0, endSec: 0.05 } },
  ]);
  check(noMadd.length === 0, "كلمة بلا حرف مد ⇒ بلا ملاحظة");
}

console.log("═══ Tajweed Color Tags ═══");
{
  check(TAJWEED_COLOR_RULES.length >= 5, "كتالوج قواعد اللون كافٍ");
  check(
    TAJWEED_COLOR_RULES.every((r) => assertValidTajweedColor(r.color)),
    "كل الألوان hex صالحة وضمن عائلة الزمرد",
  );

  const ghunnah = tagTajweedColors("إنّ الذين");
  check(ghunnah.some((t) => t.ruleId === "ghunnah"), "نّ ⇒ غنّة");
  check(ghunnah.every((t) => t.color.startsWith("#")), "وسوم اللون لها hex");

  const qalqalah = tagTajweedColors("قد أفلح");
  check(qalqalah.some((t) => t.ruleId === "qalqalah"), "قد ⇒ قلقلة");

  const iqlab = tagTajweedColors("من بعد");
  check(iqlab.some((t) => t.ruleId === "iqlab"), "من ب ⇒ إقلاب");
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
