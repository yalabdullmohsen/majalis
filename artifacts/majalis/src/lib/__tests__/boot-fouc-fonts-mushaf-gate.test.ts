/**
 * بوابة: لا وميض خطوط/ثيم عند الإقلاع، ولا رسم مصحف قبل جاهزية QPC.
 * تشغيل: node --import tsx src/lib/__tests__/boot-fouc-fonts-mushaf-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const html = read("index.html");
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
const reader = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
const fit = read("src/features/mushaf-madinah/useMushafPageFontFit.ts");
const mushafCss = read("src/features/mushaf-madinah/mushaf-madinah.css");
const fontsQuran = read("src/styles/fonts-quran.css");
const boot = read("src/lib/boot-readiness.ts");
const splash = read("src/lib/splash-screen.ts");
const main = read("src/main.tsx");
const sw = read("public/sw.js");
const theme = read("src/lib/theme-preference.ts");

// 1) ثيم قبل أول paint
{
  const themeIdx = head.indexOf('id="mj-theme-boot"');
  const critIdx = head.indexOf('id="mj-lcp-critical"');
  assert.ok(themeIdx >= 0, "سكربت ثيم في head");
  assert.ok(critIdx > themeIdx, "الثيم قبل CSS الحرج");
  assert.match(head, /setAttribute\("dir",\s*"rtl"\)/);
  assert.match(head, /theme-dark/);
  assert.match(head, /theme-light/);
  assert.match(head, /dataset\.theme/);
  assert.match(head, /classList\.add\("light"/);
  assert.match(head, /majalis-theme/);
  assert.match(head, /storedTheme === "auto"/);
}

// 2) خطوط محلية + preload
{
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(html, /rel="preload"[^>]+\/fonts\/ui\/amiri-400-ar\.woff2/);
  assert.doesNotMatch(
    html,
    /rel="preload"[^>]+noto-naskh-400/,
    "لا preload لـ Noto عند الإقلاع — Amiri فقط",
  );
  assert.match(html, /rel="preload"[^>]+as="font"/);
  assert.match(html, /app-booting/);
  assert.match(html, /majalis-user-settings-v1/);
  assert.match(html, /--ui-font-scale/);
  assert.match(fontsQuran, /font-display:\s*block/);
  assert.doesNotMatch(fontsQuran, /font-display:\s*swap/);
  const fontsUi = read("src/styles/fonts-ui.css");
  assert.match(fontsUi, /amiri-400-ar[\s\S]*font-display:\s*block/);
  assert.match(fontsUi, /noto-naskh-400-ar[\s\S]*font-display:\s*block/);
  assert.match(boot, /BOOT_FONT_TIMEOUT_MS\s*=\s*1_?200|BOOT_FONT_TIMEOUT_MS\s*=\s*1200/);
  assert.match(boot, /document\.fonts\.load\(primary\)/);
  assert.match(boot, /fonts\.check\(primary\)/);
  assert.match(boot, /"Amiri"/);
  assert.match(boot, /registerBootStorageGate|storageReady/);
  assert.match(main, /registerBootStorageGate/);
}

// 3) المصحف: لا Amiri بديل قبل QPC
{
  assert.doesNotMatch(reader, /Amiri/, "لا رسم المصحف بخط Amiri بديل");
  assert.match(reader, /canMountPage/);
  assert.match(reader, /allowOffscreenPrefetch/);
  assert.match(reader, /useMushafResourceGate/);
  assert.match(reader, /layout && ready/);
  assert.match(fit, /dataset\.mmFit|data-mm-fit|resolveUniformMushafFontSize/);
  assert.match(fit, /isMushafPageFontReady|document\.fonts/);
  assert.doesNotMatch(
    fit,
    /markFit\(el,\s*false\)/,
    "لا إخفاء نص عند بدء قياس الخط — يمنع قفزة التقليب",
  );
  assert.match(
    mushafCss,
    /\.mm-page\[data-mm-fit="0"\]\s+\.mm-page__body/,
    "الإخفاء فقط عند mm-fit=0 الصريح",
  );
  assert.doesNotMatch(
    mushafCss,
    /\.mm-page:not\(\[data-mm-fit="1"\]\)/,
    "لا إخفاء عند غياب سمة mm-fit",
  );
  const madinahPage = read("src/features/mushaf-madinah/MushafPage.tsx");
  assert.doesNotMatch(
    madinahPage,
    /data-mm-fit="0"/,
    "لا فرض mm-fit=0 من JSX (يعيد الإخفاء عند كل رسم)",
  );
  const liveReader = read("src/features/mushaf-reader/NewMushafReader.tsx");
  assert.match(liveReader, /useMushafFixedMetrics|canMountPage/);
  assert.match(read("src/features/mushaf-reader/MushafPage.tsx"), /data-mm-fit="1"/);
  assert.match(mushafCss, /data-mm-fit="1"|mm-pager-track|data-mm-fit="0"/);
  const qpc = read("src/features/mushaf-madinah/useQpcPageFont.ts");
  assert.match(qpc, /display:\s*"block"/);
  assert.match(qpc, /if \(!cancelled && ok\) setReady\(true\)/);
  const gate = read("src/features/mushaf-madinah/useMushafResourceGate.ts");
  assert.match(gate, /isFontLoaded/);
  assert.match(gate, /isPageDataReady/);
  assert.match(gate, /allowOffscreenPrefetch/);
}

// 4) لا تبديل ثيم بعد أول إطار بطريقة تسبب وميض
{
  assert.match(theme, /dataset\.theme !== resolved/);
  assert.match(theme, /classList\.add\("light"/);
  assert.match(theme, /theme-dark/);
  assert.match(theme, /theme-light/);
}

// 5) جاهزية إقلاع + Splash لا يُخفى قبل الخطوط
{
  assert.match(boot, /awaitBootReadiness/);
  assert.match(boot, /fontsReady/);
  assert.match(main, /awaitBootReadiness/);
  assert.match(splash, /mj:boot-ready/);
  assert.doesNotMatch(
    splash,
    /requestAnimationFrame\(\(\)\s*=>\s*\{\s*requestAnimationFrame\(hide\)/,
    "Splash لا يُخفى بـ double-rAF فوري",
  );
}

// 6) SW: skipWaiting + clients.claim + تدوير كاش
{
  assert.match(sw, /SKIP_WAITING/);
  assert.match(sw, /skipWaiting/);
  assert.match(sw, /clients\.claim/);
  assert.match(sw, /SW_BUILD_ID|CACHE_PREFIX/);
  assert.match(sw, /caches\.delete/);
  assert.match(
    sw,
    /pathname\.startsWith\("\/fonts\/"\)[\s\S]{0,120}staleWhileRevalidate/,
    "خطوط SWR لا CSS/خط قديم عالق",
  );
}

console.log("boot-fouc-fonts-mushaf-gate.test.ts: ok");
