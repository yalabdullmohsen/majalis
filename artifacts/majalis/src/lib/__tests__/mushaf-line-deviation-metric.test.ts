/**
 * مقياس انحراف الأسطر المُصحَّح: استثناء surah_name/basmallah وآخر سطر لكل سورة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-line-deviation-metric.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { linesFromVerses } from "../../../scripts/quran-import/measure-mushaf-line-deviation.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const chapters = JSON.parse(
  readFileSync(resolve(appRoot, "public/data/quran-v2/chapters.json"), "utf8"),
);
const ayahCounts = new Map(chapters.map((c: { id: number; verses_count: number }) => [c.id, c.verses_count]));

function loadPage(n: number) {
  return JSON.parse(
    readFileSync(
      resolve(appRoot, `public/data/quran-v2/pages/page-${String(n).padStart(3, "0")}.json`),
      "utf8",
    ),
  );
}

const p586 = linesFromVerses(loadPage(586), ayahCounts);
const excl586 = p586.filter((l) => l.excludeReason);
assert.ok(
  excl586.some((l) => l.ln === 1 && l.excludeReason === "last_line_of_surah"),
  "ص 586: استثناء آخر سطر لسورة عبس",
);
assert.ok(
  excl586.some((l) => l.ln === 15 && l.excludeReason === "last_line_of_surah"),
  "ص 586: استثناء آخر سطر لسورة التكوير",
);
assert.ok(p586.filter((l) => l.scored).length >= 10, "ص 586: أسطر مَقيسة كافية");

const p600 = linesFromVerses(loadPage(600), ayahCounts);
assert.ok(
  p600.some((l) => l.ln === 3 && l.excludeReason === "last_line_of_surah"),
  "ص 600: استثناء آخر سطر للعاديات",
);
assert.ok(
  p600.some((l) => l.ln === 10 && l.excludeReason === "last_line_of_surah"),
  "ص 600: استثناء آخر سطر للقارعة",
);

console.log("mushaf-line-deviation-metric.test.ts: ok");
