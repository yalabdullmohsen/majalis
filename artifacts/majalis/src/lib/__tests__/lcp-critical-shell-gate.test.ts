/**
 * بوابة: لا صدفة LCP خارج #root — كانت تزيح التصميم (CLS 0.16).
 * تشغيل: node --import tsx src/lib/__tests__/lcp-critical-shell-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const home = readFileSync(resolve(root, "src/pages/account/ui/HomeView.tsx"), "utf8");
const prewarm = readFileSync(resolve(root, "src/lib/resource-prewarm.ts"), "utf8");
const mainSrc = readFileSync(resolve(root, "src/main.tsx"), "utf8");
const postBuild = readFileSync(resolve(root, "scripts/post-build-seo.mjs"), "utf8");
const hero = readFileSync(resolve(root, "src/components/ui/PageHero.tsx"), "utf8");
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const homeCss = readFileSync(resolve(root, "src/styles/m2030/home.css"), "utf8");
const finalCss = readFileSync(resolve(root, "src/styles/final-release.css"), "utf8");

assert.doesNotMatch(html, /id="mj-lcp-chrome"/, "لا صدفة عنوان خارج #root");
assert.doesNotMatch(html, /id="mj-lcp-title"/, "لا نقل عقدة h1");
assert.match(html, /id="mj-lcp-critical"/, "خلفية html/body/#root فقط");
assert.doesNotMatch(html, /dns-prefetch/, "لا dns-prefetch في الإقلاع");
{
  const n = [...html.matchAll(/rel="preconnect"/g)].length;
  assert.ok(n <= 2, `preconnect ≤2 (الفعلي ${n})`);
}
assert.match(html, /isNativePlatform/, "الدخولية على الأصل فقط");
assert.match(html, /if \(!native\) \{\s*dismiss\(true\);/, "الويب بلا دخولية حاجبة");

assert.match(home, /title="المجلس العلمي"/, "عنوان الرئيسية في React");
assert.doesNotMatch(home, /titleDomId/, "لا تبنّي عقدة HTML");
assert.doesNotMatch(hero, /titleDomId/, "PageHero بلا نقل عقدة");
assert.doesNotMatch(prewarm, /link\.rel = "preconnect"/, "prewarm لا يضيف preconnect");
assert.doesNotMatch(mainSrc, /styles\/pages\/calendar\.css/, "تقويم خارج حزمة الإقلاع");
assert.doesNotMatch(mainSrc, /homePageBoot|await homePageBoot/, "لا انتظار Home قبل createRoot");
assert.match(app, /mj-home-lcp-ph/, "هيكل ارتفاع محجوز أثناء lazy الرئيسية");
assert.match(homeCss, /\.mj-home-lcp-ph\s*\{[\s\S]*min-height:\s*24rem/, "الهيكل 24rem");
assert.doesNotMatch(finalCss, /\.hsh-steps[^}]*content-visibility/, "ابدأ من هنا فوق الطية بلا content-visibility");
assert.doesNotMatch(html, /fonts\.googleapis\.com/, "لا Google Fonts في إقلاع /");
assert.match(
  postBuild,
  /rel="canonical"\|rel="alternate"\|hreflang/,
  "دمج SEO لا ينسخ preconnect من prerender",
);

console.log("lcp-critical-shell-gate.test.ts: ok");
