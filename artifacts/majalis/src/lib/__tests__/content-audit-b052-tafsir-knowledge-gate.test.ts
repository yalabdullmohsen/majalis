/**
 * بوابة b052: معرفة التفسير — مقدمات سور بلا placeholder، وآيات بلا حشو قالبي قصير.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b052-tafsir-knowledge-gate.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const ayahDir = resolve(root, "public/data/knowledge/tafsir/ayahs");
const introsPath = resolve(root, "public/data/knowledge/tafsir/surahs/all-surah-intros.json");

const FORBIDDEN = [
  "أسباب التسمية التفصيلية تُراجع",
  "يُراجع في كتب الغريب",
  "تدبّر الآية في سياق سورتها",
  "لا يُثبت إلا بسند صحيح",
  "ربط الآية بموضوع السورة.",
  "العمل بما دلّت عليه من توحيد أو حكم أو خلق.",
  "الحذر من التفسير بالرأي المجرد.",
];

function wordCount(s: string): number {
  return String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

const intros = JSON.parse(readFileSync(introsPath, "utf8")) as {
  items: { id: string; body: string; review_status?: string }[];
};
assert.equal(intros.items.length, 114, "114 مقدمة سورة");
assert.equal(
  intros.items.filter((i) => i.review_status === "verified").length,
  114,
  "كل المقدمات verified",
);
for (const it of intros.items) {
  for (const ph of FORBIDDEN) {
    assert.equal(
      (it.body || "").includes(ph),
      false,
      `مقدمة ${it.id}: بقايا «${ph}»`,
    );
  }
}
const ikhlas = intros.items.find((i) => i.id === "tafsir-surah-112");
assert.ok(ikhlas, "مقدمة الإخلاص");
assert.match(ikhlas!.body, /سبب التسمية|سُمّيت/, "سبب تسمية الإخلاص");
assert.match(ikhlas!.body, /التوحيد/, "محور التوحيد في الإخلاص");

let thin = 0;
let ayahCount = 0;
for (const f of readdirSync(ayahDir).filter((x) => x.endsWith(".json"))) {
  const data = JSON.parse(readFileSync(resolve(ayahDir, f), "utf8")) as {
    items: { id: string; body: string }[];
  };
  for (const it of data.items || []) {
    ayahCount++;
    const body = it.body || "";
    for (const ph of FORBIDDEN) {
      assert.equal(body.includes(ph), false, `${it.id}: بقايا «${ph}»`);
    }
    if (wordCount(body) < 25) thin++;
  }
}
assert.ok(ayahCount >= 1000, `تغطية آيات كافية (${ayahCount})`);
assert.equal(thin, 0, "لا بطاقات تفسير دون 25 كلمة بعد التنظيف");

console.log("content-audit-b052-tafsir-knowledge-gate: ok");
