/**
 * بوابة صدفة LCP: عنوان ثابت في HTML بلا انتظار JS.
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

assert.match(html, /id="mj-lcp-chrome"/, "صدفة LCP خارج #root");
assert.match(html, /id="mj-lcp-title"/, "عنوان LCP بمعرّف ثابت");
assert.match(html, />المجلس العلمي</, "نص العنوان ثابت في HTML");
assert.match(html, /id="mj-lcp-critical"/, "CSS حرجة مضمّنة للصدفة");
assert.doesNotMatch(html, /mj-lcp-title page-hero-mj__title/, "صنف الهيرو يُضاف بعد النقل فقط");
assert.match(html, /chrome\.remove\(\)/, "صدفة LCP تُحذف خارج الرئيسية");
assert.doesNotMatch(html, /dns-prefetch/, "لا dns-prefetch في الإقلاع");
{
  const n = [...html.matchAll(/rel="preconnect"/g)].length;
  assert.ok(n <= 2, `preconnect ≤2 (الفعلي ${n})`);
}
assert.match(html, /isNativePlatform/, "الدخولية على الأصل فقط");
assert.match(html, /if \(!native\) \{\s*dismiss\(true\);/, "الويب بلا دخولية حاجبة");

assert.match(home, /title="المجلس العلمي"/, "React يطابق نص LCP");
assert.match(home, /titleDomId="mj-lcp-title"/, "نفس عقدة العنوان تُنقَل للهيرو");
assert.match(readFileSync(resolve(root, "src/components/ui/PageHero.tsx"), "utf8"), /classList\.add\("page-hero-mj__title"\)/, "صنف الهيرو عند التبنّي");
assert.doesNotMatch(prewarm, /link\.rel = "preconnect"/, "prewarm لا يضيف preconnect");
assert.doesNotMatch(mainSrc, /styles\/pages\/calendar\.css/, "تقويم خارج حزمة الإقلاع");
assert.match(mainSrc, /await homePageBoot/, "التركيب ينتظر chunk الرئيسية");
assert.doesNotMatch(html, /fonts\.googleapis\.com/, "لا Google Fonts في إقلاع /");
assert.match(
  postBuild,
  /rel="canonical"\|rel="alternate"\|hreflang/,
  "دمج SEO لا ينسخ preconnect من prerender",
);

console.log("lcp-critical-shell-gate.test.ts: ok");
