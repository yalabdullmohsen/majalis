/**
 * بوابة وجود verify:ci — يمنع حذف السكربت أو إزالته من package.json بالخطأ.
 * تشغيل: node --test scripts/__tests__/verify-ci-script.test.mjs
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("verify:ci script exists and is wired in package.json", () => {
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  assert.equal(pkg.scripts["verify:ci"], "node scripts/verify-ci.mjs");
  assert.ok(existsSync(resolve(root, "scripts/verify-ci.mjs")));
});

test("verify:ci --list exits 0", () => {
  const r = spawnSync(
    process.execPath,
    ["scripts/verify-ci.mjs", "--list", "--no-mushaf"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /verify:ci/);
  assert.match(r.stdout, /typecheck/);
  assert.match(r.stdout, /test:ci-unit/);
  assert.match(r.stdout, /build/);
});
