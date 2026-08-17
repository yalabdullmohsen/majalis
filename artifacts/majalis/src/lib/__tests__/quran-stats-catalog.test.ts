/**
 * بوابة كتالوج القرآن في أرقام — محتوى محرَّر بلا computed.
 * تشغيل: node --import tsx src/lib/__tests__/quran-stats-catalog.test.ts
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertQuranStatsCatalog,
  buildQuranStatsCatalog,
  isNumericCardValue,
} from "../quran-stats/catalog";
import { FORBIDDEN_STAT_SOURCES } from "../quran-stats/types";
import type { QuranStat } from "../quran-stats/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const catalog = buildQuranStatsCatalog();
assert.ok(catalog.length >= 60, `عدد الإحصاءات ${catalog.length} < 60`);
assert.doesNotThrow(() => assertQuranStatsCatalog(catalog));

for (const g of ["bunya", "alfaz", "mawdoo", "suwar", "ajaib"] as const) {
  assert.ok(catalog.some((s) => s.group === g), `مجموعة ناقصة: ${g}`);
}

assert.equal(isNumericCardValue(0), false);
assert.equal(isNumericCardValue("٠"), false);
assert.equal(isNumericCardValue("مختلف فيه"), false);
assert.equal(isNumericCardValue(114), true);

function validStat(overrides: Partial<QuranStat> = {}): QuranStat {
  return {
    id: "surahs",
    label: "اختبار",
    value: 1,
    kind: "agreed",
    group: "bunya",
    source: { book: "كتاب", author: "مؤلف", ref: "ص١" },
    detail: "تفصيل كافٍ للاختبار.",
    ...overrides,
  };
}

assert.throws(
  () => {
    const bad = [
      ...catalog.filter((s) => s.id !== catalog[0].id),
      validStat({
        id: "fabricated-unreviewed-id",
        group: catalog[0].group,
        source: { book: "ك", author: "م", ref: "ر" },
      }),
    ];
    assertQuranStatsCatalog(bad);
  },
  /REVIEW|غير مذكور/,
);

for (const marker of FORBIDDEN_STAT_SOURCES.slice(0, 3)) {
  assert.throws(
    () =>
      assertQuranStatsCatalog([
        validStat({
          id: catalog[0].id,
          source: { book: `نقل من ${marker}`, author: "س", ref: "ص١" },
          detail: "وصف",
        }),
        ...catalog.slice(1),
      ]),
    /مصدر ممنوع/,
  );
}

/** لا stats.json ولا مولّد */
assert.equal(
  fs.existsSync(path.join(root, "public/data/quran/stats.json")),
  false,
  "stats.json يجب أن يكون محذوفًا",
);
assert.equal(
  fs.existsSync(path.join(root, "scripts/generate-quran-stats.mjs")),
  false,
  "سكربت التوليد يجب أن يكون محذوفًا",
);

/** لا computed / حساب آلي في المسارات المنتَجة */
const scanRoots = [
  path.join(root, "src/lib/quran-stats"),
  path.join(root, "src/pages/quran/ui/QuranNumbersView.tsx"),
  path.join(root, "content/quran-stats"),
];
const needles = ["computed", "حساب آلي"];
for (const needle of needles) {
  const hits = execSync(
    `rg -l ${JSON.stringify(needle)} ${scanRoots.map((p) => JSON.stringify(p)).join(" ")} || true`,
    { encoding: "utf8", shell: "/bin/bash" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  assert.equal(hits.length, 0, `ظهور «${needle}» في: ${hits.join(", ") || "—"}`);
}

/** كل معروض مذكور في reviewed-ids */
const reviewed = JSON.parse(
  fs.readFileSync(path.join(root, "content/quran-stats/reviewed-ids.json"), "utf8"),
) as string[];
for (const s of catalog) {
  assert.ok(reviewed.includes(s.id), `غير مراجع: ${s.id}`);
  assert.ok(s.source.book && s.source.author && s.source.ref);
  if (s.basis === "mawdoo") assert.ok((s.evidence?.length ?? 0) >= 1, s.id);
  if (s.group === "alfaz" || s.group === "mawdoo") assert.ok(s.basis, s.id);
}

console.log(`quran-stats-catalog.test.ts: ok (${catalog.length} بطاقة)`);
