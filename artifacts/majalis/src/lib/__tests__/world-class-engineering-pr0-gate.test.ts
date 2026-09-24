/**
 * بوابة PR-0: World-Class Engineering — جرد تقنيات + هدف + قرارات (بلا تثبيت).
 * تشغيل: node --import tsx src/lib/__tests__/world-class-engineering-pr0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const inventory = "docs/architecture/TECHNOLOGY_INVENTORY.md";
const target = "docs/architecture/TARGET_ARCHITECTURE.md";
const decisions = "docs/architecture/DEPENDENCY_DECISIONS.md";
const metrics = "docs/architecture/world-class-engineering-pr0-metrics.json";

for (const rel of [inventory, target, decisions, metrics]) {
  assert.ok(existsSync(resolve(repoRoot, rel)), `${rel} مطلوب`);
}

const inv = readRepo(inventory);
assert.match(inv, /PR-0/);
assert.match(inv, /07d580b0afdfc65ce9142129a73c6201f1e47854|07d580b0a/);
assert.match(inv, /wouter/);
assert.match(inv, /Capacitor/);
assert.match(inv, /@tanstack\/react-query|TanStack Query/);
assert.match(inv, /Supabase/);
assert.match(inv, /Playwright/);
assert.match(inv, /لا Sentry|REJECT/);
assert.match(inv, /Storybook/);
assert.match(inv, /PARTIAL/);
assert.match(inv, /SUNNAH_WORLD_CLASS_ENGINEERING_COMPLETE/);
assert.doesNotMatch(inv, /SUNNAH_WORLD_CLASS_ENGINEERING_COMPLETE\s*=\s*true/);

const tgt = readRepo(target);
assert.match(tgt, /features\//);
assert.match(tgt, /AppStartupController/);
assert.match(tgt, /Storybook/);
assert.match(tgt, /PARTIAL/);

const dec = readRepo(decisions);
assert.match(dec, /\bKEEP\b/);
assert.match(dec, /\bUPGRADE\b/);
assert.match(dec, /\bREJECT\b/);
assert.match(dec, /\bREMOVE\b/);
assert.match(dec, /next-themes/);
assert.match(dec, /Sentry/);
assert.match(dec, /صفر تثبيت|لا شيء/);
assert.match(dec, /Owner Actions/);

const m = JSON.parse(readRepo(metrics)) as {
  program: string;
  stage: number;
  commit: string;
  dependenciesAddedInThisPr: unknown[];
  dependenciesRemovedInThisPr: unknown[];
  acceptanceClaimForbiddenUntilLater: string;
  status: string;
};

assert.equal(m.program, "sunnah-world-class-product-engineering-upgrade");
assert.equal(m.stage, 0);
assert.match(m.commit, /^[0-9a-f]{40}$/);
assert.deepEqual(m.dependenciesAddedInThisPr, []);
assert.deepEqual(m.dependenciesRemovedInThisPr, []);
assert.equal(m.acceptanceClaimForbiddenUntilLater, "SUNNAH_WORLD_CLASS_ENGINEERING_COMPLETE");
assert.equal(m.status, "PARTIAL");

// لا إضافة sentry/storybook في package.json المنتج كجزء من هذا الجرد
const pkg = readFileSync(resolve(majalisRoot, "package.json"), "utf8");
assert.doesNotMatch(pkg, /"@sentry\//);
assert.doesNotMatch(pkg, /"storybook"/);
assert.doesNotMatch(pkg, /"@storybook\//);

console.log("world-class-engineering-pr0-gate: PASS");
