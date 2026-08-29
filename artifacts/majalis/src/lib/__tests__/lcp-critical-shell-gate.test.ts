/**
 * بوابة: لا صدفة LCP خارج #root — كانت تزيح التصميم (CLS 0.16).
 * صدفة HTML v2 أُسقطت (A-4 2026-08-20): CLS 0.05+ بلا تحسين LCP.
 * تشغيل: node --import tsx src/lib/__tests__/lcp-critical-shell-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const { getPreviewThresholds } = require(resolve(root, "scripts/lhci-thresholds.cjs"));
const preview = getPreviewThresholds();
const lhciRc = require(resolve(root, "lighthouserc.cjs"));
const html = readFileSync(resolve(root, "index.html"), "utf8");
const home = readFileSync(resolve(root, "src/pages/account/ui/HomeView.tsx"), "utf8");
const prewarm = readFileSync(resolve(root, "src/lib/resource-prewarm.ts"), "utf8");
const mainSrc = readFileSync(resolve(root, "src/main.tsx"), "utf8");
const postBuild = readFileSync(resolve(root, "scripts/post-build-seo.mjs"), "utf8");
const hero = readFileSync(resolve(root, "src/components/ui/PageHero.tsx"), "utf8");
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const homeCss = readFileSync(resolve(root, "src/styles/m2030/home.css"), "utf8");
const finalCss = readFileSync(resolve(root, "src/styles/final-release.css"), "utf8");
const critical = readFileSync(resolve(root, "src/styles/critical-first-paint.css"), "utf8");

assert.doesNotMatch(html, /id="mj-lcp-chrome"/, "لا صدفة عنوان خارج #root");
assert.doesNotMatch(html, /id="mj-lcp-title"/, "لا نقل عقدة h1");
assert.match(html, /id="mj-lcp-critical"/, "خلفية html/body/#root فقط");
assert.doesNotMatch(html, /id="mj-home-lcp-static"/, "لا صدفة HTML نصّية (A-4)");
assert.doesNotMatch(html, /id="mj-boot-skeleton"/, "بلا هيكل تحميل كامل — دخول مباشر");
assert.match(html, /<div id="root"><\/div>/, "React يركّب في #root فارغ");
assert.doesNotMatch(html, /id="mj-app-mount"/, "React يركّب في #root مباشرة");
assert.doesNotMatch(html, /id="mj-fcp-seed"/, "لا بذرة FCP — CLS 0.358 عند mount");
assert.doesNotMatch(html, /dns-prefetch/, "لا dns-prefetch في الإقلاع");
{
  const n = [...html.matchAll(/rel="preconnect"/g)].length;
  assert.ok(n <= 2, `preconnect ≤2 (الفعلي ${n})`);
}
assert.match(html, /MIN_MS\s*=\s*120/, "حد أدنى للدخولية");
assert.match(html, /splash-logo\.webp/, "شعار Startup Gate");
assert.doesNotMatch(html, /mj-launch-splash__tagline/, "بلا عبارة تسويقية");
assert.match(html, /id="mj-theme-boot"|v6-direct-boot-2026-08/, "ثيم مبكر قبل الرسم");
{
  const crit = html.match(/<style id="mj-lcp-critical">([\s\S]*?)<\/style>/)?.[1] ?? "";
  assert.doesNotMatch(crit, /Aref\s+Ruqaa/, "بلا رقعة في CSS الحرج");
}

assert.match(home, /title="سُنّة"/, "عنوان الرئيسية في React");
assert.doesNotMatch(home, /titleDomId/, "لا تبنّي عقدة HTML");
assert.doesNotMatch(hero, /titleDomId/, "PageHero بلا نقل عقدة");
assert.doesNotMatch(prewarm, /link\.rel = "preconnect"/, "prewarm لا يضيف preconnect");
assert.doesNotMatch(mainSrc, /styles\/pages\/calendar\.css/, "تقويم خارج حزمة الإقلاع");
assert.doesNotMatch(mainSrc, /homePageBoot|await homePageBoot/, "لا انتظار Home قبل createRoot");
assert.doesNotMatch(mainSrc, /mj-app-mount/, "createRoot على #root");
assert.match(home, /mj-home-lcp-ph/, "حجز ارتفاع في الرئيسية");
assert.match(app, /function HomeInitialShell/, "fallback LCP فوري بلا aria-hidden");
assert.doesNotMatch(app, /HomeInitialShell[\s\S]{0,120}aria-hidden/, "shell الرئيسية ليس مخفياً عن قارئ الشاشة");
assert.doesNotMatch(app, /scheduleRemoveHomeLcpStaticShell/, "لا إزالة صدفة HTML");
assert.match(critical, /\.hsh-steps\s*\{[\s\S]*min-height:\s*22rem/, "حجز CLS لشبكة hsh-steps");
assert.match(critical, /ascent-override/, "size-adjust/override للخط الاحتياطي");
assert.match(homeCss, /contain:\s*layout style/, "حاوية placeholder بلا min-height مبالغ");
assert.match(homeCss, /\.mj-home-lcp-ph__start-here\s*\{[\s\S]*min-height:\s*28rem/, "ارتفاع ابدأ من هنا يطابق المحتوى");
assert.match(critical, /\.mj-home-lcp-ph__start-here\s*\{[\s\S]*min-height:\s*28rem/, "حجز ابدأ من هنا في CSS الحرج");
assert.match(homeCss, /\.mj-home-lcp-ph__daily-band\s*\{[\s\S]*min-height:\s*28rem/, "ارتفاع الورد اليومي يطابق الحجز الحرج");
assert.doesNotMatch(homeCss, /\.mj-home-lcp-ph\s*\{[\s\S]*min-height:\s*88rem/, "لا min-height مبالغ فيه على الحاوية");
assert.doesNotMatch(finalCss, /\.hsh-steps[^}]*content-visibility/, "ابدأ من هنا فوق الطية بلا content-visibility");
assert.doesNotMatch(html, /fonts\.googleapis\.com/, "لا Google Fonts في إقلاع /");
assert.equal(
  lhciRc.ci.assert.assertions["cumulative-layout-shift"][1].maxNumericValue,
  preview.cls,
  `عتبة CLS ≤${preview.cls} (main+10%)`,
);
assert.match(
  postBuild,
  /rel="canonical"\|rel="alternate"\|hreflang/,
  "دمج SEO لا ينسخ preconnect من prerender",
);
assert.doesNotMatch(
  postBuild,
  /v4-light-2026|majalis-theme-preference/,
  "دمج SEO لا يعيد كتابة design-v بسكربت body قديم (يكسر mj-theme-boot)",
);
assert.match(
  postBuild,
  /mj-theme-boot|spaAssets/,
  "دمج SEO يعتمد ثيم الإقلاع من أصول SPA",
);

console.log("lcp-critical-shell-gate.test.ts: ok");
