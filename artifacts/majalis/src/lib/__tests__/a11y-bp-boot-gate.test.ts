/**
 * بوابة: إصلاحات a11y/BP + فصل seo-routes عن الإقلاع.
 * node --import tsx src/lib/__tests__/a11y-bp-boot-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const hus = readFileSync(resolve(root, "src/components/home/HomeUniversalSearch.tsx"), "utf8");
const homeCss = readFileSync(resolve(root, "src/styles/m2030/home.css"), "utf8");
const supabase = readFileSync(resolve(root, "src/lib/supabase.ts"), "utf8");
const seo = readFileSync(resolve(root, "src/lib/seo.ts"), "utf8");
const seoStruct = readFileSync(resolve(root, "src/lib/seo-structured-data.ts"), "utf8");
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const homeView = readFileSync(resolve(root, "src/pages/account/ui/HomeView.tsx"), "utf8")
  + readFileSync(resolve(root, "src/pages/account/ui/HomeBelowFold.tsx"), "utf8");
const pkg = readFileSync(resolve(root, "package.json"), "utf8");

assert.match(hus, /aria-controls=\{showIdle \|\| showResults \? listId : undefined\}/, "aria-controls فقط عند وجود اللوحة");
assert.match(homeCss, /color:\s*var\(--brand-on-white\)/, "رابط الشريط بتباين ≥4.5");
assert.doesNotMatch(supabase, /"poster_url"/, "لا عمود poster_url في LESSON_LIST_COLUMNS");
assert.match(seo, /import\("\.\/seo-routes\.json"\)/, "seo-routes ديناميكي");
assert.doesNotMatch(seo, /import seoData from/, "لا استيراد ثابت لـ seo-routes في seo.ts");
assert.doesNotMatch(seoStruct, /seo-routes\.json/, "structured-data بلا seo-routes");
assert.ok(existsSync(resolve(root, "src/lib/seo-nav-labels.json")), "ملف تسميات نحيف موجود");
const slim = readFileSync(resolve(root, "src/lib/seo-nav-labels.json"));
assert.ok(slim.byteLength < 20_000, `seo-nav-labels.json كبير أكثر من اللازم (${slim.byteLength})`);
assert.match(app, /HomeLazyRoute|SafeLazyRoute component=\{HomePage\}/, "مسار الرئيسية موجود");
assert.match(app, /const HomePage = lazy/, "الرئيسية كسولة لميزانية الحزمة");
assert.match(app, /fallback=\{<HomeInitialShell \/>}/, "الرئيسية بهيكل LCP فوري");
assert.match(homeView, /HomeUpcomingLessons/, "دروس الرئيسية موجودة");
assert.match(homeView, /import\("@\/components\/home\/HomeUpcomingLessons"\)/, "دروس الرئيسية كسولة");
assert.match(pkg, /strip:sourcemaps/, "حذف خرائط المصدر بعد البناء");

console.log("a11y-bp-boot-gate.test.ts: ok");
