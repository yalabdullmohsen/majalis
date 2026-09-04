/**
 * بوابة عدم تسرب الأقسام المخفية/المحذوفة إلى الاكتشاف العام.
 * Run: node --import tsx src/lib/__tests__/hidden-sections-no-leak.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SECTIONS, sectionsForSurface } from "@/config/sections.registry";
import { HIDDEN_FROM_NAV_PATHS, resolveMergedPath } from "@/lib/nav-visibility";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const hidden = SECTIONS.filter((s) => s.status === "hidden");
assert.ok(hidden.length >= 1, "يوجد قسم مخفي واحد على الأقل في السجل");

for (const surface of ["home", "drawer", "moreHub", "search"] as const) {
  const visible = sectionsForSurface(surface);
  for (const h of hidden) {
    // surfaces SEARCH_ONLY قد تُبقي المسار للبحث الداخلي فقط — الاكتشاف العام = home/drawer/moreHub
    if (surface === "search" && h.surfaces.includes("search") && h.route !== "/search") {
      // حتى في البحث: status=hidden يجب ألا يظهر عبر sectionsForSurface
    }
    assert.ok(
      !visible.some((v) => v.id === h.id),
      `القسم المخفي ${h.id} (${h.route}) لا يظهر في سطح ${surface}`,
    );
  }
}

const nav = read("src/config/navigation.ts");
const home = read("src/pages/account/ui/HomeView.tsx") + read("src/pages/account/ui/HomeBelowFold.tsx");
const sitemap = existsSync(resolve(root, "public/sitemap.xml"))
  ? read("public/sitemap.xml")
  : "";
const seoRoutes = JSON.parse(read("src/lib/seo-routes.json")) as {
  routes?: Array<string | { path?: string }>;
};
const seoPaths = new Set(
  (seoRoutes.routes || [])
    .map((r) => (typeof r === "string" ? r : r?.path))
    .filter((p): p is string => typeof p === "string"),
);

for (const h of hidden) {
  if (h.route === "/search") continue; // مسار عام حي؛ السجل يخفي بطاقة «مكتبة» القديمة فقط
  assert.doesNotMatch(
    nav,
    new RegExp(`["']${h.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`),
    `التنقل بلا مسار مخفي ${h.route}`,
  );
  assert.doesNotMatch(
    home,
    new RegExp(`href=["']${h.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    `الرئيسية بلا بطاقة للقسم المخفي ${h.route}`,
  );
  if (sitemap) {
    assert.doesNotMatch(
      sitemap,
      new RegExp(`${h.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/|"|<)`),
      `sitemap بلا ${h.route}`,
    );
  }
}

// المكتبة العامة محوّلة — لا اكتشاف ولا SEO
assert.ok(
  HIDDEN_FROM_NAV_PATHS.has("/library") || resolveMergedPath("/library") === "/search",
  "المكتبة مخفية أو محوّلة إلى /search",
);
assert.equal(resolveMergedPath("/library"), "/search");
assert.ok(!seoPaths.has("/library") && ![...seoPaths].some((p) => p.startsWith("/library/")));

const searchApi = read("lib/api-handlers/search.js");
assert.match(searchApi, /المكتبة العامة أُزيلت|لا نتائج \/library/);

const relatedCandidates = [
  "src/components/RelatedKnowledge.tsx",
  "src/lib/related-links.ts",
  "src/lib/site-interlink.ts",
];
for (const rel of relatedCandidates) {
  if (!existsSync(resolve(root, rel))) continue;
  const src = read(rel);
  assert.doesNotMatch(src, /["']\/library\/[^"']+["']/, `${rel} بلا روابط مكتبة عامة`);
}

console.log(`hidden-sections-no-leak: ok (${hidden.length} hidden sections checked)`);
