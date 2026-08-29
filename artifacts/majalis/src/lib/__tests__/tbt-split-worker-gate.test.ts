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

const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
assert.match(app, /IdleRuntimeBoot/, "منطق المنصة بعد الخمول");
assert.match(app, /PrayerCountdownScope/, "جدولة الصلاة مؤجلة على الرئيسية");
assert.match(app, /PrayerRuntimeBoot/, "منطق الأذان داخل مزوّد الصلاة");
assert.match(app, /lazyWithRetry\([\s\S]*PrayerCountdownBanner/, "شريط الصلاة خارج حزمة الإقلاع");

const homeView = read("src/pages/account/ui/HomeView.tsx");
assert.match(homeView, /HomeBelowFold/, "جزيرة تحت الطية كسولة");
assert.match(homeView, /IntersectionObserver/, "ترطيب تحت الطية عند الظهور");
assert.match(homeView, /HomeDailyWirdGate/, "ورد اليوم مؤجّل عن أول شاشة");
assert.match(homeView, /lazyWithRetry[\s\S]*DailyWirdCard/, "بيانات الورد كسولة");

const mainSrc = read("src/main.tsx");
assert.doesNotMatch(mainSrc, /import\("@\/pages\/account\/HomePage"\)/, "لا تسخين مزدوج لـ HomePage قبل الرسم");
assert.doesNotMatch(
  mainSrc.slice(0, mainSrc.indexOf("createRoot(")),
  /supabase-bootstrap/,
  "لا bootstrap Supabase قبل createRoot",
);

const supabaseConfig = read("src/lib/supabase-config.ts");
assert.doesNotMatch(
  supabaseConfig,
  /supabase-bootstrap/,
  "supabase-config لا يستورد bootstrap حتى لا يدخل createClient حزمة الإقلاع",
);
assert.match(supabaseConfig, /from ["']\.\/supabase-env["']/, "فحص الإعداد عبر supabase-env بلا عميل JS");

const vite = read("vite.config.ts");
assert.match(vite, /return "react-dom"/, "react-dom حزمة مستقلة");
assert.match(vite, /return "react"/, "react حزمة مستقلة");
assert.doesNotMatch(vite, /if \(isReactCoreModule\(id\)\) return "vendor"/, "لا حزمة vendor موحّدة");

const tickerCss = read("src/styles/final-release.css");
assert.match(tickerCss, /translate3d\(0, 0, 0\)/, "الماركي مركّب");
const pulseCss = read("src/styles/components/prayer-countdown-chip.css");
assert.doesNotMatch(pulseCss, /@keyframes prayer-chip-pulse[\s\S]*box-shadow/, "نبض الشريحة بلا box-shadow");

const dsCss = read("src/styles/design-system.css");
assert.doesNotMatch(dsCss, /@keyframes ds-shimmer[\s\S]*background-position/, "هيكل ds بلا background-position");
assert.match(dsCss, /@keyframes ds-shimmer[\s\S]*translate3d/, "هيكل ds مركّب");

console.log("tbt-split-worker-gate.test.ts: ok");
