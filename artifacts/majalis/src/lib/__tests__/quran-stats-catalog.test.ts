/**
 * بوابة: كتالوج «القرآن في أرقام».
 * تشغيل: node --import tsx src/lib/__tests__/quran-stats-catalog.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertQuranStatsCatalog,
  buildQuranStatsCatalog,
} from "@/lib/quran-stats/catalog";
import type { QuranComputedStats, QuranStat } from "@/lib/quran-stats/types";
import { FORBIDDEN_STAT_SOURCES } from "@/lib/quran-stats/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const computed = JSON.parse(
  readFileSync(resolve(root, "public/data/quran/stats.json"), "utf8"),
) as QuranComputedStats;

assert.equal(computed.totals.ayahs, 6236);
assert.ok(computed.fingerprint?.length >= 16);

const catalog = buildQuranStatsCatalog(computed);
assertQuranStatsCatalog(catalog);

const byKind = (k: QuranStat["kind"]) => catalog.filter((s) => s.kind === k);
assert.ok(byKind("agreed").length >= 4, "متفق عليه");
assert.ok(byKind("by-school").some((s) => s.id === "ayat-kufi" && s.value === 6236));
assert.ok(byKind("disputed").every((s) => (s.variants?.length ?? 0) >= 2));
assert.ok(byKind("computed").length >= 4);

const ayat = catalog.find((s) => s.id === "ayat-kufi")!;
assert.match(String(ayat.label) + (ayat.note ?? ""), /كوف/);

for (const s of catalog) {
  const blob = [s.source, s.note, ...(s.variants ?? []).map((v) => v.source)].join(" ");
  for (const bad of FORBIDDEN_STAT_SOURCES) {
    assert.equal(blob.toLowerCase().includes(bad.toLowerCase()), false, `${s.id} بلا ${bad}`);
  }
}

assert.throws(() => {
  assertQuranStatsCatalog([
    {
      id: "bad",
      label: "x",
      value: 1,
      kind: "agreed",
      source: "",
    },
  ]);
});

assert.throws(() => {
  assertQuranStatsCatalog([
    {
      id: "bad-disputed",
      label: "x",
      value: "مختلف",
      kind: "disputed",
      source: "الداني",
      variants: [{ value: "1", attribution: "a", source: "الداني" }],
    },
  ]);
});

console.log(
  `quran-stats-catalog.test.ts: ok · ${catalog.length} stats · agreed=${byKind("agreed").length} by-school=${byKind("by-school").length} disputed=${byKind("disputed").length} computed=${byKind("computed").length}`,
);
