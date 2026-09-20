/**
 * بوابة PR-1: جرد الفرق الإسلامية + taxonomy + حالات النشر.
 * تشغيل: node --import tsx src/lib/__tests__/islamic-sects-inventory-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  canPublishIslamicSectsRecord,
  ISLAMIC_SECTS_PUBLICATION_STATES,
  ISLAMIC_SECTS_PUBLIC_VISIBLE_STATES,
  isIslamicSectsPubliclyVisible,
} from "../islamic-sects/publication-states";
import { ISLAMIC_SECTS_ENTITY_KINDS } from "../islamic-sects/types";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const inventoryPath = resolve(
  repoRoot,
  "docs/content-quality/islamic-sects-inventory.json",
);
const taxonomyPath = resolve(
  repoRoot,
  "docs/content-quality/islamic-sects-taxonomy.json",
);
const queuePath = resolve(
  repoRoot,
  "docs/content-quality/ISLAMIC_SECTS_HUMAN_REVIEW_QUEUE.md",
);
const pagePath = resolve(majalisRoot, "src/views/IslamicSectsPage.tsx");
const buildScript = resolve(
  majalisRoot,
  "scripts/build-islamic-sects-inventory.mjs",
);

assert.ok(existsSync(buildScript), "build-islamic-sects-inventory.mjs");
assert.ok(existsSync(pagePath), "IslamicSectsPage.tsx");
assert.ok(existsSync(taxonomyPath), "islamic-sects-taxonomy.json");
assert.ok(existsSync(queuePath), "ISLAMIC_SECTS_HUMAN_REVIEW_QUEUE.md");

const build = spawnSync(process.execPath, [buildScript], {
  cwd: majalisRoot,
  encoding: "utf8",
});
assert.equal(build.status, 0, `فشل بناء الجرد: ${build.stderr || build.stdout}`);

assert.ok(existsSync(inventoryPath), "islamic-sects-inventory.json بعد البناء");

const taxonomy = JSON.parse(readFileSync(taxonomyPath, "utf8"));
const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
const pageSrc = readFileSync(pagePath, "utf8");
const queue = readFileSync(queuePath, "utf8");

assert.equal(inventory.policy.includes("no_auto_publish"), true);
assert.equal(inventory.route, "/islamic-sects");
assert.ok(Array.isArray(inventory.records));
assert.equal(inventory.recordCount, inventory.records.length);

const pageIds = [
  ...pageSrc.matchAll(/^\s+id:\s*"([a-z0-9-]+)"/gm),
].map((m) => m[1]);
assert.equal(
  pageIds.length,
  inventory.recordCount,
  `عدد ids الواجهة (${pageIds.length}) يجب = الجرد (${inventory.recordCount})`,
);

const invIds = inventory.records.map((r: { id: string }) => r.id);
assert.deepEqual([...invIds].sort(), [...pageIds].sort());

const slugs = new Set<string>();
for (const r of inventory.records) {
  assert.ok(r.id && r.slug && r.canonicalName, `سجل ناقص: ${r.id}`);
  assert.equal(r.id, r.slug, `slug=id في PR-1: ${r.id}`);
  assert.ok(!slugs.has(r.slug), `تكرار slug: ${r.slug}`);
  slugs.add(r.slug);

  assert.ok(
    (ISLAMIC_SECTS_ENTITY_KINDS as readonly string[]).includes(r.entityKind),
    `entityKind غير معروف: ${r.id} → ${r.entityKind}`,
  );
  assert.ok(
    taxonomy.entityKinds.some((k: { id: string }) => k.id === r.entityKind),
  );
  assert.ok(
    (ISLAMIC_SECTS_PUBLICATION_STATES as readonly string[]).includes(
      r.publicationStatus,
    ),
    `publicationStatus غير معروف: ${r.id}`,
  );
  assert.ok(
    (ISLAMIC_SECTS_PUBLICATION_STATES as readonly string[]).includes(
      r.factualReviewStatus,
    ),
  );
  assert.ok(
    (ISLAMIC_SECTS_PUBLICATION_STATES as readonly string[]).includes(
      r.shariaReviewStatus,
    ),
  );
  assert.ok(
    (ISLAMIC_SECTS_PUBLICATION_STATES as readonly string[]).includes(
      r.languageReviewStatus,
    ),
  );

  // لا نشر بلا مصدر؛ ولا PUBLISHED آليًا في PR-1
  assert.notEqual(
    r.publicationStatus,
    "PUBLISHED",
    `ممنوع PUBLISHED في جرد PR-1: ${r.id}`,
  );
  assert.equal(
    canPublishIslamicSectsRecord({
      publicationStatus: r.publicationStatus,
      humanDecision: null,
      hasPrimaryOrSecondarySource:
        (r.primarySources?.length ?? 0) > 0 ||
        (r.secondarySources?.length ?? 0) > 0,
    }),
    false,
    `canPublish يجب false بدون قرار بشري: ${r.id}`,
  );

  // حقول داخلية موجودة في العقد
  for (const key of [
    "alternateNames",
    "selfDesignation",
    "externalDesignations",
    "coreDoctrines",
    "primarySources",
    "secondarySources",
    "inventoryFlags",
  ]) {
    assert.ok(key in r, `حقل مفقود ${key} في ${r.id}`);
  }
}

assert.equal(inventory.publishedCount, 0);
assert.equal(inventory.hiddenCount, inventory.recordCount);
assert.equal(
  inventory.records.filter((r: { publicationStatus: string }) =>
    isIslamicSectsPubliclyVisible(r.publicationStatus as "PUBLISHED"),
  ).length,
  0,
);
assert.deepEqual([...ISLAMIC_SECTS_PUBLIC_VISIBLE_STATES], ["PUBLISHED"]);

// منع نشر حكم بلا نسبة / تاريخ بلا مرجع على مستوى العقد: لا primarySources بعد
const withPrimary = inventory.records.filter(
  (r: { primarySources: string[] }) => r.primarySources.length > 0,
);
assert.equal(
  withPrimary.length,
  0,
  "PR-1: لا مصادر أولية معتمدة بعد — أي primarySources يتطلب موجة توثيق لاحقة",
);

// تصنيف غير موجود ممنوع
for (const kind of taxonomy.entityKinds) {
  assert.ok(kind.id && kind.labelAr);
}

assert.match(queue, /ISLAMIC_SECTS_HUMAN_REVIEW_QUEUE|طابور المراجعة البشرية/);
assert.match(queue, /APPROVED_WITH_CORRECTION/);
assert.match(queue, /NEEDS_MORE_EVIDENCE/);
assert.match(queue, /أهل السنة والجماعة/);
assert.match(queue, /الأشعرية/);
assert.match(queue, /الماتريدية/);
assert.match(queue, /الخوارج/);
assert.match(queue, /الإباضية/);
assert.match(queue, /المعتزلة/);
assert.match(queue, /لا يضع `PUBLISHED`|لا يضع \*\*`PUBLISHED`\*\*|لا يضع PUBLISHED|لا يضع `PUBLISHED`/);
assert.match(queue, /Owner Actions/);

// حارس: سكربت البناء يرفض PUBLISHED
const buildSrc = readFileSync(buildScript, "utf8");
assert.match(buildSrc, /must not set PUBLISHED|PUBLISHED forbidden/);
assert.match(buildSrc, /REVIEW_OVERLAY/);

console.log(
  `islamic-sects-inventory-gate.test.ts: ok (records=${inventory.recordCount} published=${inventory.publishedCount} hidden=${inventory.hiddenCount})`,
);
