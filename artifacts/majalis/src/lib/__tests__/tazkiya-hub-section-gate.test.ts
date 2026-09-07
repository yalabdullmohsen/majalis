/**
 * بوابة: الذنوب والتوبة تحت قسم واحد ظاهر «التزكية والتوبة».
 * تشغيل: node --import tsx src/lib/__tests__/tazkiya-hub-section-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

const registry = read("config/sections.registry.ts");
assert.match(registry, /id:\s*"tazkiya"/, "قسم التزكية في السجل");
assert.match(registry, /label:\s*"التزكية والتوبة"/, "الاسم الظاهر");
assert.match(registry, /route:\s*"\/tazkiya"/, "مسار البوابة");

{
  const hubBlock = registry.slice(registry.indexOf('id: "tazkiya"'), registry.indexOf('id: "sins-and-rights"'));
  assert.match(hubBlock, /surfaces:\s*NAV/, "البوابة ظاهرة في الأقسام");
}

{
  const sins = registry.slice(registry.indexOf('id: "sins-and-rights"'), registry.indexOf('id: "tawba"'));
  assert.match(sins, /SEARCH_ONLY/, "الذنوب ليست بطاقة منفصلة في الأقسام");
}

{
  const tawba = registry.slice(registry.indexOf('id: "tawba"'), registry.indexOf('id: "akhlaq"'));
  assert.match(tawba, /SEARCH_ONLY/, "التوبة ليست بطاقة منفصلة في الأقسام");
}

const hub = read("pages/tazkiya/TazkiyaHubPage.tsx");
assert.match(hub, /\/sins-and-rights/, "بطاقة الذنوب");
assert.match(hub, /\/tawba/, "بطاقة التوبة");
assert.match(hub, /MergedSectionHubPage/, "نمط البوابة الموحّدة");

const routes = read("AppRoutes.tsx");
assert.match(routes, /path="\/tazkiya"/, "مسار في الراوتر");

const home = read("lib/home-feature-catalog.ts");
assert.match(home, /\/tazkiya/, "الكتالوج يشير للبوابة");
assert.doesNotMatch(
  home,
  /href:\s*"\/sins-and-rights"/,
  "لا بطاقة ذنوب منفصلة في كتالوج الرئيسية",
);

console.log("tazkiya-hub-section-gate.test.ts: ok");
