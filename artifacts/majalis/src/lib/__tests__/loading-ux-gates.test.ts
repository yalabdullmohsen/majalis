/**
 * بوابات قبول: بلا نص «جارٍ التحميل»، بلا BrandReveal، شريط واحد لكل موضع.
 * تشغيل: node --import tsx src/lib/__tests__/loading-ux-gates.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const srcRoot = resolve(root, "src");

function walkTs(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === "__tests__") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkTs(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

const files = walkTs(srcRoot);
const hits: string[] = [];
for (const f of files) {
  const text = readFileSync(f, "utf8");
  if (/جارٍ التحميل|جاري التحميل/.test(text)) hits.push(f.replace(srcRoot + "/", ""));
}
assert.equal(hits.length, 0, `صفر ظهور لسلسلة التحميل. بقي: ${hits.join(", ")}`);

assert.ok(!existsSync(resolve(srcRoot, "components/BrandReveal.tsx")), "BrandReveal محذوف");

const app = readFileSync(resolve(srcRoot, "App.tsx"), "utf8");
assert.match(app, /<NavBar\s*\/>/);
assert.match(app, /<TopSectionBar\s*\/>/);
assert.match(app, /<BottomNavBar\b/);
const topCount = (app.match(/<TopSectionBar\b/g) || []).length;
const bottomCount = (app.match(/<BottomNavBar\b/g) || []).length;
assert.equal(topCount, 1, "شريط أقسام علوي واحد");
assert.equal(bottomCount, 1, "شريط سفلي واحد");

const navCss = readFileSync(resolve(srcRoot, "styles/m2030/navigation.css"), "utf8");
assert.match(navCss, /max-width:\s*767\.98px/, "إخفاء الشريط العلوي على الجوال");
assert.match(navCss, /min-width:\s*768px/, "إخفاء الشريط السفلي على سطح المكتب");

const guard = readFileSync(resolve(srcRoot, "components/PageLoadingGuard.tsx"), "utf8");
assert.match(guard, /useDeferredLoading/);
assert.match(guard, /SkeletonCardGrid|skeleton/);
assert.match(guard, /keepPrevious/);
assert.doesNotMatch(guard, /جارٍ التحميل/);

const loading = readFileSync(resolve(srcRoot, "components/ui-common.tsx"), "utf8");
assert.match(loading, /export function Loading/);
assert.match(loading, /SkeletonPage/);
assert.doesNotMatch(loading, /جارٍ التحميل/);

const lessons = readFileSync(resolve(srcRoot, "lib/lessons-service.ts"), "utf8");
assert.match(lessons, /majalis-lessons-unified-v1/, "كاش دروس للزيارة الثانية");
assert.match(lessons, /readPersistedLessons|PERSIST_KEY/);

console.log("loading-ux-gates.test.ts: ok");
