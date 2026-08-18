/**
 * بوابة TBT: تأخير التسخين، بحث كسول، Worker للفهرس، شرائط الصلاة خارج الإقلاع.
 * تشغيل: node --import tsx src/lib/__tests__/tbt-split-worker-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const prefetch = read("src/lib/prefetch-top-routes.ts");
assert.match(prefetch, /10_000/, "تسخين المسارات بعد load + 10ث");

const homeSearch = read("src/components/home/HomeUniversalSearch.tsx");
assert.doesNotMatch(
  homeSearch,
  /import \{[^}]*runUniversalSearch[^}]*\} from ["']@\/features\/search\/universal-home-search["']/,
  "محرك البحث ليس استيراداً ساكناً في الرئيسية",
);
assert.match(homeSearch, /import\(\s*["']@\/features\/search\/universal-home-search["']\s*\)/, "المحرك عند الاستعلام فقط");

const unified = read("src/features/search/unified-local.ts");
assert.match(unified, /search-index\.worker/, "فهرس البحث عبر Worker");

const app = read("src/App.tsx");
assert.match(app, /IdleRuntimeBoot/, "منطق المنصة بعد الخمول");
assert.match(app, /lazyWithRetry\([\s\S]*PrayerCountdownBanner/, "شريط الصلاة خارج حزمة الإقلاع");

const tickerCss = read("src/styles/final-release.css");
assert.match(tickerCss, /translate3d\(0, 0, 0\)/, "الماركي مركّب");

console.log("tbt-split-worker-gate.test.ts: ok");
