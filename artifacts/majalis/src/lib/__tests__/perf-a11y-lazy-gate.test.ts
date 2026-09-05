/**
 * بوابة أداء/إتاحة: lazy للمصحف الثقيل، preconnect ≤٢، معالم دلالية، CSP صوت.
 * تشغيل: node --import tsx src/lib/__tests__/perf-a11y-lazy-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("\n=== Lazy: تفسير / صوت / بحث المصحف ===");
{
  const reader = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
  assert.match(reader, /lazy\(\(\)\s*=>\s*import\("\.\/MushafTafsirSheet"\)/, "Tafsir lazy");
  assert.match(reader, /lazy\(\(\)\s*=>\s*import\("\.\/MushafAudioDock"\)/, "AudioDock lazy");
  assert.match(reader, /lazy\(\(\)\s*=>\s*import\("\.\/MushafSearchSheet"\)/, "SearchSheet lazy");
  assert.match(reader, /<Suspense/, "Suspense حول الشيتات");
  assert.equal(
    /import\s*\{\s*MushafTafsirSheet\s*\}\s*from/.test(reader),
    false,
    "لا استيراد ثابت لـ TafsirSheet",
  );

  const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
  assert.match(app, /lazyWithRetry\([\s\S]*GlobalSearchModal/, "GlobalSearchModal lazy");
  assert.match(app, /lazyWithRetry\([\s\S]*QuranMiniPlayerBar/, "QuranMiniPlayerBar lazy");
  assert.match(app, /lazyWithRetry\([\s\S]*UpdateAvailableBanner/, "UpdateAvailableBanner lazy");
  assert.doesNotMatch(app, /FirstVisitIntro/, "لا FirstVisitIntro في مسار الإقلاع");
  assert.match(app, /lazyWithRetry\([\s\S]*EdgeSwipeBack/, "EdgeSwipeBack lazy");
  assert.match(app, /lazyWithRetry\([\s\S]*RouteEnterMotion/, "RouteEnterMotion lazy");
  assert.match(app, /lazyWithRetry\([\s\S]*DeferredAchievementBoot/, "DeferredAchievementBoot lazy");
  assert.doesNotMatch(
    app,
    /from\s+["']@\/lib\/local-notifications["']/,
    "local-notifications ديناميكي خارج الإقلاع",
  );
  assert.doesNotMatch(
    app,
    /from\s+["']@\/components\/motion["']/,
    "لا barrel motion في الإقلاع",
  );
}

console.log("\n=== index.html: preconnect ≤٢ + خطوط محلية ===");
{
  const html = read("index.html");
  const vite = read("vite.config.ts");
  assert.match(vite, /htmlCharsetPlugin/, "middleware charset في vite preview/dev");
  const count = [...html.matchAll(/rel="preconnect"/g)].length;
  assert.ok(count <= 2, `preconnect ≤ ٢ (الفعلي ${count})`);
  const afterHead = html.split(/<head[^>]*>/i)[1] ?? "";
  assert.match(afterHead.trimStart(), /^<meta charset="UTF-8"\s*\/?>/i, "charset أول عنصر في head");
  assert.ok([...html.matchAll(/rel="preload"/g)].length >= 1 && [...html.matchAll(/rel="preload"/g)].length <= 4, "preload خطوط أساسية محلية (١–٤)");
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/, "لا Google Fonts في الإقلاع");
  assert.match(html, /rel="preload"[^>]+\/fonts\/ui\/amiri-400-ar\.woff2/, "preload خط الواجهة Amiri");
  assert.doesNotMatch(html, /rel="preload"[^>]+noto-naskh-400/, "لا preload Noto عند الإقلاع");
  assert.match(html, /id="mj-launch-splash"/, "دخولية MajlisSplash في HTML الحرج");
  assert.doesNotMatch(html, /id="mj-boot-skeleton"/, "بلا هيكل تحميل كامل");
  assert.match(html, /mj-launch-splash__title/, "عنوان الهوية في الدخولية");
  assert.doesNotMatch(html, /mj-launch-splash__tagline/, "بلا عبارة تسويقية");
  assert.match(
    html,
    /v6-direct-boot-2026-08|v7-boot-fouc-2026-08|v9-theme-light-default-2026-08|v10-pwa-single-paint-2026-08|v11-startup-stable-2026-08|v12-startup-gate-2026-08|v13-startup-shell-stable-2026-09/,
    "ترحيل ثيم يمنع وميض التصميم القديم",
  );
}

console.log("\n=== LCP أصول WebP موجودة ===");
{
  assert.ok(existsSync(resolve(root, "public/icon-192.webp")), "icon-192.webp");
  assert.ok(existsSync(resolve(root, "public/brand/splash-logo.webp")), "splash-logo.webp");
  assert.ok(existsSync(resolve(root, "public/brand/official.webp")), "official.webp");
  assert.ok(!existsSync(resolve(root, "src/components/MajlisLaunchScreen.tsx")), "لا مكوّن React للدخولية");
}

console.log("\n=== معالم دلالية ===");
{
  const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
  assert.match(app, /<main id="main-content"/, "main");
  assert.match(app, /aria-label="المحتوى الرئيسي"/, "main بعنوان واضح");
  assert.match(app, /skip-link|#main-content/, "رابط تخطّي");
  const hus = read("src/components/home/HomeUniversalSearch.tsx");
  assert.match(hus, /role="search"/, "منطقة بحث");
  assert.match(hus, /aria-label="بحث موحّد/, "حقل بحث بأريّة");
  const nav = read("src/components/NavBar.tsx");
  assert.match(nav, /<header/, "header");
  assert.match(nav, /aria-label="فتح البحث"/, "زر بحث بأريّة");
  const bottom = read("src/components/BottomNavBar.tsx");
  assert.match(bottom, /<nav[\s\S]*aria-label="التنقل السفلي"/, "nav سفلي");
  const footer = read("src/components/SiteFooter.tsx");
  assert.match(footer, /<footer/, "footer");
}

console.log("\n=== CSP: صوت mp3quran متعدد الخوادم ===");
{
  const vercel = read("vercel.json");
  assert.match(vercel, /Content-Security-Policy/);
  assert.match(vercel, /https:\/\/\*\.mp3quran\.net/, "wildcard mp3quran في CSP");
  assert.match(vercel, /https:\/\/everyayah\.com/, "everyayah مسموح");
  assert.match(vercel, /https:\/\/cdn\.islamic\.network/, "islamic.network مسموح للتلاوة الاحتياطية");
  assert.match(vercel, /https:\/\/\*\.supabase\.co/, "supabase مسموح");
  assert.equal(
    /media-src[^;]*server8\.mp3quran\.net/.test(vercel) &&
      !/media-src[^;]*\*\.mp3quran\.net/.test(vercel),
    false,
    "media-src لا يقتصر على server8 دون wildcard",
  );
}

console.log("\n=== SW: أصوات الأذان بلا precache في الغلاف ===");
{
  const sw = read("public/sw.js");
  assert.match(sw, /pathname\.startsWith\("\/audio\/"\)/, "network-first لمسارات الصوت");
  const shell = sw.match(/const STATIC_SHELL_ASSETS = \[([\s\S]*?)\];/);
  assert.ok(shell, "STATIC_SHELL_ASSETS موجود");
  assert.doesNotMatch(
    shell[1]!,
    /\/audio\/|\/sounds\//,
    "لا precache لملفات الأذان عند تثبيت SW",
  );
  assert.doesNotMatch(
    shell[1]!,
    /AmiriQuran-Regular\.woff2|amiri-quran/,
    "لا precache لخط المصحف عند تثبيت SW",
  );
}

console.log("\nperf-a11y-lazy-gate.test.ts: ok");
