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

  const app = read("src/App.tsx");
  assert.match(app, /lazyWithRetry\([\s\S]*GlobalSearchModal/, "GlobalSearchModal lazy");
  assert.match(app, /lazyWithRetry\([\s\S]*QuranMiniPlayerBar/, "QuranMiniPlayerBar lazy");
}

console.log("\n=== index.html: preconnect ≤٢ + خطوط محلية ===");
{
  const html = read("index.html");
  const count = [...html.matchAll(/rel="preconnect"/g)].length;
  assert.ok(count <= 2, `preconnect ≤ ٢ (الفعلي ${count})`);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/, "لا Google Fonts في الإقلاع");
  assert.match(html, /rel="preload"[^>]+\/fonts\/ui\/amiri-400-ar\.woff2/, "preload خط الشاشة الأولى فقط");
  assert.match(html, /id="mj-silent-splash"/, "دخولية HTML صامتة");
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
  const app = read("src/App.tsx");
  assert.match(app, /<main id="main-content"/, "main");
  assert.match(app, /skip-link|#main-content/, "رابط تخطّي");
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
  assert.match(vercel, /https:\/\/\*\.supabase\.co/, "supabase مسموح");
  assert.equal(
    /media-src[^;]*server8\.mp3quran\.net/.test(vercel) &&
      !/media-src[^;]*\*\.mp3quran\.net/.test(vercel),
    false,
    "media-src لا يقتصر على server8 دون wildcard",
  );
}

console.log("\nperf-a11y-lazy-gate.test.ts: ok");
