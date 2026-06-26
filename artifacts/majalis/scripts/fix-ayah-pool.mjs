import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const OUT = path.join(ROOT, "public/content");

const refs = [
  [2, 152], [2, 153], [2, 255], [3, 190], [8, 45], [11, 88], [20, 114], [94, 5], [94, 6], [112, 1],
  [4, 58], [5, 6], [7, 180], [9, 40], [10, 62], [13, 28], [16, 97], [17, 82], [21, 87], [24, 35],
  [25, 74], [28, 77], [31, 17], [33, 41], [39, 53], [40, 60], [46, 13], [55, 13], [57, 4], [67, 2],
];

const meanings = {
  "2:152": "ذكر الله يورث ذكرًا من الله وثوابًا عظيمًا.",
  "2:153": "الصبر والصلاة من أسباب نيل معية الله.",
  "2:255": "آية الكرسi — أعظم آية في القرآn.",
  "3:190": "في الكون آيات لأصحاب العقول.",
  "8:45": "كثرة ذكر الله من أسباب الفلاح.",
  "94:6": "إn مع العsr يسrًا.",
};

const data = await fetch("https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmanihaf.json").then((r) => r.json());
const verses = Object.values(data.quran);
const pool = [];

for (const [s, a] of refs) {
  const v = verses.find((x) => x.chapter === s && x.verse === a);
  if (!v) continue;
  const ref = `${s}:${a}`;
  pool.push({
    id: `ayah-${s}-${a}`,
    text: v.text.replace(/\s+/g, " ").trim(),
    surah: `سورة ${s}`,
    ayahNumber: a,
    reference: `القرآn الكريm — ${ref}`,
    meaning: meanings[ref] || "آية للتدبر والعمل.",
    benefits: meanings[ref] || "",
    asbab: "",
    waqafat: "",
  });
}

fs.writeFileSync(path.join(OUT, "daily-ayah-pool.json"), JSON.stringify(pool));
console.log(`ayah pool: ${pool.length}`);
