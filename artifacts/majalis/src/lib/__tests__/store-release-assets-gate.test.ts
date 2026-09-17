/**
 * بوابة وثائق/كتالوج المتجر — تُشغَّل مع بوابات الوحدة.
 * node --import tsx src/lib/__tests__/store-release-assets-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listSelectableAdhanVoices } from "../sunnah-audio-platform";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const store = resolve(repo, "docs/store-release");

{
  for (const f of [
    "STORE_SOURCE_COMMIT.txt",
    "STORE_ASSET_MANIFEST.md",
    "STORE_LICENSE_DECISIONS.md",
    "STORE_EXCLUSION_REPORT.md",
    "excluded-asset-globs.json",
    "MANUAL_OWNER_ACTION.md",
  ]) {
    assert.ok(existsSync(resolve(store, f)), f);
  }
  const commit = readFileSync(resolve(store, "STORE_SOURCE_COMMIT.txt"), "utf8").trim();
  assert.match(commit, /^[0-9a-f]{40}$/i);
  console.log("  ✓ store-release docs present");
}

{
  const selectable = listSelectableAdhanVoices();
  assert.equal(selectable.length, 1);
  assert.equal(selectable[0]?.id, "system-default");
  console.log("  ✓ store selectable voices = system-default only");
}

console.log("store-release-assets-gate.test.ts: ok");
