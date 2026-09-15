/**
 * بوابة: لا تُعاد إحياء روابط/عناوين المجمع في الكاتالوجات العامة.
 * node --import tsx src/lib/__tests__/fiqh-council-source-validation.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const surfaces = [
  "src/lib/navigation.ts",
  "src/lib/feature-registry.ts",
  "src/lib/fiqh-hub-topics.ts",
  "src/lib/masarat-data.ts",
  "src/lib/home-feature-catalog.ts",
  "src/views/MadhahibPage.tsx",
  "src/views/AssistantPage.tsx",
  "src/views/admin/AdminShell.tsx",
  "src/views/admin/DashboardSection.tsx",
  "src/lib/platform-search.ts",
  "src/lib/search-suggestions.ts",
];

for (const rel of surfaces) {
  const src = read(rel);
  assert.doesNotMatch(src, /href:\s*["'`]\/fiqh-council/, `${rel}: لا روابط /fiqh-council`);
  assert.doesNotMatch(src, /المجمع الفقهي/, `${rel}: لا يظهر «المجمع الفقهي»`);
}

assert.doesNotMatch(read("src/lib/updates-seed.ts"), /source_url:\s*["']\/fiqh-council/);
assert.doesNotMatch(read("src/lib/cms/content-registry.ts"), /`\/fiqh-council\/\$\{/);

console.log("fiqh-council-source-validation (removal gate): OK");
