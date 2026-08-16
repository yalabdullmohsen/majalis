import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertQuranStatsCatalog,
  buildQuranStatsCatalog,
  isNumericCardValue,
} from "../quran-stats/catalog";
import { FORBIDDEN_STAT_SOURCES } from "../quran-stats/types";
import type { QuranComputedStats, QuranStat } from "../quran-stats/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const statsPath = path.join(root, "public/data/quran/stats.json");
const sampleComputed = JSON.parse(fs.readFileSync(statsPath, "utf8")) as QuranComputedStats;

function validStat(overrides: Partial<QuranStat> = {}): QuranStat {
  return {
    id: "x",
    label: "اختبار",
    value: 1,
    kind: "agreed",
    group: "bunya",
    source: "مصدر موثوق",
    detail: "تفصيل كافٍ للاختبار.",
    ...overrides,
  };
}

/** يملأ ≥٦٠ مع المجموعات الخمس حتى تصل فحوصات الحقول الفردية إلى الشرط */
function padded(bad: QuranStat): QuranStat[] {
  const filler: QuranStat[] = [];
  const groups = ["bunya", "alfaz", "mawdoo", "suwar", "ajaib"] as const;
  for (let i = 0; i < 60; i++) {
    const g = groups[i % 5];
    filler.push(
      validStat({
        id: `pad-${i}`,
        group: g,
        basis: g === "alfaz" || g === "mawdoo" ? "exact-form" : undefined,
        method: g === "alfaz" || g === "mawdoo" ? "منهج اختبار" : undefined,
      }),
    );
  }
  return [bad, ...filler];
}

const catalog = buildQuranStatsCatalog(sampleComputed);
assert.ok(catalog.length >= 60, `عدد الإحصاءات ${catalog.length} < 60`);
const groups = new Set(catalog.map((s) => s.group));
for (const g of ["bunya", "alfaz", "mawdoo", "suwar", "ajaib"] as const) {
  assert.ok(groups.has(g), `مجموعة ناقصة: ${g}`);
}
assert.doesNotThrow(() => assertQuranStatsCatalog(catalog));

assert.throws(
  () => assertQuranStatsCatalog(padded(validStat({ id: "bad", source: "   " }))),
  /مصدر|source/i,
);

assert.equal(isNumericCardValue("مختلف فيه"), false);
assert.throws(
  () => assertQuranStatsCatalog(padded(validStat({ id: "text-value", value: "مختلف فيه" }))),
  /رقمية/,
);

assert.throws(
  () =>
    assertQuranStatsCatalog(
      padded(
        validStat({
          id: "d",
          kind: "disputed",
          value: 10,
          variants: [{ value: "١", attribution: "أ", source: "س" }],
        }),
      ),
    ),
  /variants/,
);

assert.throws(
  () =>
    assertQuranStatsCatalog(
      padded(
        validStat({
          id: "topic",
          kind: "computed",
          group: "mawdoo",
          basis: "topic",
          method: "موضوع",
          value: 3,
          evidence: [],
        }),
      ),
    ),
  /evidence/,
);

for (const marker of FORBIDDEN_STAT_SOURCES.slice(0, 3)) {
  assert.throws(
    () =>
      assertQuranStatsCatalog(
        padded(
          validStat({
            id: `forbid-${marker}`,
            source: `نقل من ${marker}`,
          }),
        ),
      ),
    /مصدر ممنوع/,
  );
}

assert.throws(
  () =>
    assertQuranStatsCatalog(
      padded(
        validStat({
          id: "tech",
          detail: "من public/data/quran/uthmani",
        }),
      ),
    ),
  /تقني/,
);

assert.throws(
  () =>
    assertQuranStatsCatalog(
      padded(validStat({ id: "nodesc", detail: undefined, note: undefined })),
    ),
  /بلا وصف/,
);

const byGroup: Record<string, number> = {};
for (const s of catalog) byGroup[s.group] = (byGroup[s.group] ?? 0) + 1;
console.log(`quran-stats-catalog.test.ts: ok (${catalog.length})`, byGroup);
