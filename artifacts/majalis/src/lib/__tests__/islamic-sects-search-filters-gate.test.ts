/**
 * بوابة PR-6: بحث/فلاتر/PUBLISHED فقط + ملخص قائمة.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  buildFilterChips,
  countPublishedIslamicSectsFromMeta,
  filterIslamicSectSummaries,
  getPublishedIslamicSectById,
  isIslamicSectPubliclyListed,
  listPublishedIslamicSectSummaries,
  type IslamicSectSummary,
} from "../islamic-sects/catalog";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const publicMetaPath = resolve(
  majalisRoot,
  "src/data/islamic-sects-public-meta.json",
);
const buildScript = resolve(
  majalisRoot,
  "scripts/build-islamic-sects-inventory.mjs",
);
const listSrc = readFileSync(
  resolve(majalisRoot, "src/views/IslamicSectsPage.tsx"),
  "utf8",
);
const detailSrc = readFileSync(
  resolve(majalisRoot, "src/views/IslamicSectsDetailPage.tsx"),
  "utf8",
);

assert.ok(existsSync(buildScript));
const build = spawnSync(process.execPath, [buildScript], {
  cwd: majalisRoot,
  encoding: "utf8",
});
assert.equal(build.status, 0, build.stderr || build.stdout);
assert.ok(existsSync(publicMetaPath), "islamic-sects-public-meta.json");

const meta = JSON.parse(readFileSync(publicMetaPath, "utf8"));
assert.equal(meta.policy.includes("no_auto_publish"), true);
assert.ok(Array.isArray(meta.records));
assert.equal(meta.records.length, 35);

// لا معتقدات/كتب كاملة في ملخص الحزمة العامة
for (const r of meta.records) {
  assert.ok(!("coreDoctrines" in r));
  assert.ok(!("keyBeliefs" in r));
  assert.ok(!("quotations" in r));
  assert.ok(r.publicationStatus);
  assert.ok(r.entityKind);
  assert.ok(r.eraBucket);
}

assert.equal(countPublishedIslamicSectsFromMeta(), 0);
assert.equal(listPublishedIslamicSectSummaries().length, 0);
assert.equal(isIslamicSectPubliclyListed("ahl-al-sunna"), false);
assert.equal(getPublishedIslamicSectById("ahl-al-sunna"), undefined);

// منطق الفلاتر مع عيّنة وهمية (لا ينشر بيانات حقيقية)
const sample: IslamicSectSummary[] = [
  {
    id: "a",
    name: "عينة أ",
    icon: "📄",
    legacyCategory: "مدرسة عقدية",
    statusLabel: "قائمة",
    summary: "ملخص محايد أ",
    entityKind: "creedal_school",
    historicalStatus: "contemporary",
    eraBucket: "القرن الرابع الهجري",
    publicationStatus: "PUBLISHED",
    searchBlob: ["عينة أ", "اسم بديل أ", "ملخص محايد أ"],
  },
  {
    id: "b",
    name: "عينة ب",
    icon: "📄",
    legacyCategory: "فرقة تاريخية",
    statusLabel: "تاريخية",
    summary: "ملخص محايد ب",
    entityKind: "historical_sect",
    historicalStatus: "historical",
    eraBucket: "القرن الأول الهجري",
    publicationStatus: "PUBLISHED",
    searchBlob: ["عينة ب", "ملخص محايد ب"],
  },
];

assert.equal(
  filterIslamicSectSummaries(sample, { entityKind: "creedal_school" }).length,
  1,
);
assert.equal(
  filterIslamicSectSummaries(sample, { search: "بديل" }).map((s) => s.id).join(),
  "a",
);
assert.equal(
  filterIslamicSectSummaries(sample, { eraBucket: "القرن الأول الهجري" })[0]
    ?.id,
  "b",
);

const chips = buildFilterChips(sample, "entityKind");
assert.ok(chips.some((c) => c.value === "الكل" && c.count === 2));
assert.ok(chips.every((c) => c.count > 0));

// الواجهة: لا تعرض الكل بدون حراسة نشر؛ العدد من المنشور
assert.match(listSrc, /listPublishedIslamicSectSummaries/);
assert.match(listSrc, /countPublishedIslamicSectsFromMeta|publishedTotal/);
assert.match(listSrc, /buildFilterChips/);
assert.match(detailSrc, /getPublishedIslamicSectById/);
assert.match(detailSrc, /قيد المراجعة|PUBLISHED/);
assert.doesNotMatch(listSrc, /ISLAMIC_SECTS\.filter/);

console.log(
  `islamic-sects-search-filters-gate.test.ts: ok (meta=${meta.records.length} published=${countPublishedIslamicSectsFromMeta()})`,
);
