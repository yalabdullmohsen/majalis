/**
 * بوابة: الهيكل النهائي للأقسام (مرحلة 2).
 * تشغيل: node --import tsx src/lib/__tests__/site-sections-final-structure.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BOTTOM_NAV_TABS } from "@/lib/nav-map";
import { FEATURED } from "@/lib/home-feature-catalog";
import { MORE_FEATURED_SECTIONS, MORE_IA_GROUP_TITLES } from "@/features/more/moreSections";
import { featuredSections } from "@/config/sections.registry";
import {
  IA_FORBIDDEN_PUBLIC_LABELS,
  IA_HOME_PRIMARY,
  IA_NESTED_ONLY_PATHS,
  IA_REDIRECTS,
  IA_BREADCRUMB_PARENTS,
} from "@/lib/ia-final-structure";
import { HIDDEN_FROM_NAV_PATHS } from "@/lib/nav-visibility";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

assert.equal(IA_HOME_PRIMARY.length, 6, "الرئيسية: ٦ أقسام فقط");
assert.equal(FEATURED.length, 6, "FEATURED = ٦");
assert.deepEqual(
  FEATURED.map((f) => f.href),
  IA_HOME_PRIMARY.map((h) => h.href),
);

assert.deepEqual(
  BOTTOM_NAV_TABS.map((t) => t.href),
  ["/quran-hub", "/lessons", "/prayer-times", "/fiqh"],
);

assert.deepEqual(MORE_IA_GROUP_TITLES.length, 7);
assert.equal(MORE_IA_GROUP_TITLES.at(-1), "الحساب والإعدادات");

assert.equal(MORE_FEATURED_SECTIONS.length, 6);
assert.deepEqual(
  MORE_FEATURED_SECTIONS.map((s) => s.title),
  featuredSections().map((s) => s.label),
);
for (const required of [
  "العقيدة",
  "التفسير",
  "الحديث وعلومه",
  "الفقه والأحكام",
  "السيرة النبوية",
  "قصص الأنبياء",
]) {
  assert.ok(
    MORE_FEATURED_SECTIONS.some((s) => s.title === required),
    `المزيد المميّز يتضمن «${required}»`,
  );
}

const SURFACES = [
  "src/features/more/moreSections.ts",
  "src/lib/site-footer-nav.ts",
  "src/pages/account/ui/HomeView.tsx",
  "src/lib/home-feature-catalog.ts",
  "src/components/home/HomeExplorePlatform.tsx",
  "src/components/home/HomeStartHereSection.tsx",
];
for (const rel of SURFACES) {
  const src = read(rel);
  for (const label of IA_FORBIDDEN_PUBLIC_LABELS) {
    assert.equal(src.includes(label), false, `${rel} بلا «${label}»`);
  }
  assert.equal(src.includes("/learning/paths"), false, `${rel} بلا /learning/paths`);
  assert.equal(src.includes("المسارات العلمية"), false);
}

const home = read("src/pages/account/ui/HomeView.tsx");
assert.match(home, /IA_HOME_PRIMARY/);
assert.equal(home.includes("/quran-knowledge"), false, "لا بوابة قرآن قديمة في الرئيسية");
assert.equal(home.includes("المسارات العلمية"), false);

const app = read("src/App.tsx");
for (const [from, to] of Object.entries(IA_REDIRECTS)) {
  if (from === "/learning/paths") {
    assert.match(app, /path="\/learning\/paths"[^>]*>\s*<Redirect\s+to="\/lessons"/);
    continue;
  }
  if (from === "/learning-paths") {
    assert.match(app, /path="\/learning-paths"[^>]*>\s*<Redirect\s+to="\/lessons"/);
    continue;
  }
  if (from === "/courses") {
    assert.match(app, /path="\/courses"[^>]*>\s*<Redirect\s+to="\/lessons/);
    assert.equal(/path="\/courses"[^>]*>\s*<Redirect\s+to=["']\/["']/.test(app), false);
    continue;
  }
  const esc = from.replace(/\//g, "\\/");
  assert.match(app, new RegExp(`path="${esc}"[^>]*>\\s*<Redirect\\s+to="${to.replace(/\//g, "\\/")}"`));
  assert.equal(new RegExp(`path="${esc}"[^>]*>\\s*<Redirect\\s+to=["']\\/["']`).test(app), false);
}

const vercel = read("vercel.json");
for (const source of Object.keys(IA_REDIRECTS)) {
  if (source === "/learning/paths") continue; // covered with /learning/paths entry
  const re = new RegExp(
    `"source"\\s*:\\s*"${source.replace(/\//g, "\\/")}"[\\s\\S]{0,200}"destination"\\s*:\\s*"\\/lessons"|"destination"\\s*:\\s*"\\/quiz"`,
  );
  assert.ok(re.test(vercel), `vercel redirect لـ ${source}`);
  assert.equal(
    new RegExp(`"source"\\s*:\\s*"${source.replace(/\//g, "\\/")}"[\\s\\S]{0,180}"destination"\\s*:\\s*"\\/"`).test(
      vercel,
    ),
    false,
    `${source} لا يحوّل للرئيسية`,
  );
}

for (const path of IA_NESTED_ONLY_PATHS) {
  assert.ok(HIDDEN_FROM_NAV_PATHS.has(path), `${path} مخفي من القوائم العامة`);
}

assert.ok(IA_BREADCRUMB_PARENTS["/hadith/daif"]?.[0]?.path === "/hadith");
assert.ok(IA_BREADCRUMB_PARENTS["/ulum-quran"]?.[0]?.path === "/quran-hub");
assert.ok(IA_BREADCRUMB_PARENTS["/fiqh-council/nawazil"]?.[0]?.path === "/fiqh");

const seo = read("src/lib/seo.ts");
assert.match(seo, /IA_BREADCRUMB_PARENTS/);

const seoRoutes = JSON.parse(read("src/lib/seo-routes.json"));
for (const path of Object.keys(IA_REDIRECTS)) {
  const entry = seoRoutes.routes.find((r: { path: string }) => r.path === path);
  if (entry) {
    assert.equal(entry.sitemap, false, `${path} خارج sitemap`);
  }
}

if (existsSync(resolve(root, "public/sitemap.xml"))) {
  const sm = read("public/sitemap.xml");
  for (const path of Object.keys(IA_REDIRECTS)) {
    assert.equal(sm.includes(`<loc>https://majlisilm.com${path}</loc>`), false, `sitemap بلا ${path}`);
  }
  assert.equal(sm.includes("/admin"), false);
}

const searchIdx = JSON.parse(read("public/data/search/index.json"));
for (const doc of searchIdx.docs) {
  const href = String(doc.href || "").split("?")[0].split("#")[0];
  assert.equal(href in IA_REDIRECTS, false, `search بلا redirect ${href}`);
  assert.equal(href === "/qa" || href.startsWith("/qa/"), false);
}
const toolTopics = searchIdx.docs.find((d: { id: string }) => d.id === "tool:topics");
assert.ok(toolTopics?.meta === "أداة بحث");

console.log("site-sections-final-structure.test.ts: ok");
