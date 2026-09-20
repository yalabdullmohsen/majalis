/**
 * بوابة PR-7: حراسة النشر + قرارات بشرية — لا PUBLISHED آلي.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  assertNoDraftInPublicList,
  canPublishIslamicSectsRecord,
  evaluateIslamicSectsPublishReadiness,
  isIslamicSectsPubliclyVisible,
  resolvePublicationStatusFromHumanDecision,
} from "../islamic-sects";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const decisionsPath = resolve(
  repoRoot,
  "docs/content-quality/islamic-sects-human-decisions.json",
);
const inventoryPath = resolve(
  repoRoot,
  "docs/content-quality/islamic-sects-inventory.json",
);
const buildScript = resolve(
  majalisRoot,
  "scripts/build-islamic-sects-inventory.mjs",
);

assert.ok(existsSync(decisionsPath), "islamic-sects-human-decisions.json");
const decisions = JSON.parse(readFileSync(decisionsPath, "utf8"));
assert.match(decisions.policy, /human_only_publish/);
assert.ok(Array.isArray(decisions.decisions));
assert.equal(
  decisions.decisions.length,
  0,
  "PR-7: لا قرارات APPROVED من الوكيل — الملف فارغ حتى مراجع بشري",
);

const build = spawnSync(process.execPath, [buildScript], {
  cwd: majalisRoot,
  encoding: "utf8",
});
assert.equal(build.status, 0, build.stderr || build.stdout);

const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
assert.equal(inventory.publishedCount, 0);
assert.match(inventory.humanDecisionsRef || "", /human-decisions/);

for (const r of inventory.records) {
  assert.notEqual(r.publicationStatus, "PUBLISHED");
  assert.equal(
    canPublishIslamicSectsRecord({
      publicationStatus: r.publicationStatus,
      humanDecision: r.humanDecision ?? null,
      hasPrimaryOrSecondarySource:
        (r.primarySources?.length ?? 0) > 0 ||
        (r.secondarySources?.length ?? 0) > 0,
    }),
    false,
  );
  assert.equal(isIslamicSectsPubliclyVisible(r.publicationStatus), false);
}

assertNoDraftInPublicList(
  inventory.records.map((r: { publicationStatus: string }) => r.publicationStatus),
);

// وحدة: بلا مصدر
assert.equal(
  evaluateIslamicSectsPublishReadiness({
    id: "x",
    publicationStatus: "PUBLISHED",
    humanDecision: "APPROVED",
    hasPrimaryOrSecondarySource: false,
  }).ok,
  false,
);

// وحدة: بلا قرار بشري
assert.equal(
  evaluateIslamicSectsPublishReadiness({
    id: "x",
    publicationStatus: "PUBLISHED",
    humanDecision: null,
    hasPrimaryOrSecondarySource: true,
  }).ok,
  false,
);

// وحدة: حكم شرعي معلّق
assert.ok(
  evaluateIslamicSectsPublishReadiness({
    id: "x",
    publicationStatus: "PUBLISHED",
    humanDecision: "APPROVED",
    hasPrimaryOrSecondarySource: true,
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
  }).reasons.includes("sharia_review_pending"),
);

// وحدة: علم تكفير جماعي بلا تصريح مختص
assert.ok(
  evaluateIslamicSectsPublishReadiness({
    id: "x",
    publicationStatus: "PUBLISHED",
    humanDecision: "APPROVED",
    hasPrimaryOrSecondarySource: true,
    shariaReviewStatus: "HUMAN_REVIEWED",
    inventoryFlags: ["needs_sharia_specialist"],
  }).reasons.includes("sharia_specialist_clearance_required"),
);

// وحدة: مسار صالح
assert.equal(
  evaluateIslamicSectsPublishReadiness({
    id: "x",
    publicationStatus: "PUBLISHED",
    humanDecision: "APPROVED",
    hasPrimaryOrSecondarySource: true,
    shariaReviewStatus: "HUMAN_REVIEWED",
    licenseStatus: "ok",
    inventoryFlags: [],
  }).ok,
  true,
);

// resolve: overlay لا يضع PUBLISHED
assert.throws(() =>
  resolvePublicationStatusFromHumanDecision({
    overlayStatus: "PUBLISHED",
    decision: null,
    hasPrimaryOrSecondarySource: true,
  }),
);

assert.equal(
  resolvePublicationStatusFromHumanDecision({
    overlayStatus: "NEEDS_SOURCE",
    decision: {
      id: "x",
      decision: "APPROVED",
      reviewer: "test",
      reviewedAt: "2026-09-20",
    },
    hasPrimaryOrSecondarySource: true,
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
  }),
  "HUMAN_REVIEWED",
);

const buildSrc = readFileSync(buildScript, "utf8");
assert.match(buildSrc, /human-decisions|decisionsPath/);
assert.match(buildSrc, /must not set PUBLISHED/);

console.log(
  `islamic-sects-publish-guards-gate.test.ts: ok (published=${inventory.publishedCount} decisions=${decisions.decisions.length})`,
);
