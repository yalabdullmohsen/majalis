/**
 * بوابة PageSpeed للرئيسية: دخولية سريعة، main landmark، تأجيل supabase، CSS تحت الطية.
 * تشغيل: node --import tsx src/lib/__tests__/pagespeed-home-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const html = read("index.html");
const splash = read("src/lib/majlis-splash.ts");
const auth = read("src/components/AuthProvider.tsx");
const app = read("src/App.tsx");
const home = read("src/pages/account/ui/HomeView.tsx");
const below = read("src/pages/account/ui/HomeBelowFold.tsx");
const ar = read("src/locales/ar.ts");
const main = read("src/main.tsx");
const intro = read("src/components/onboarding/FirstVisitIntro.tsx");
const navBack = read("src/lib/navigation-back.ts");

assert.match(html, /MIN_MS\s*=\s*120/, "دخولية قصيرة — LCP");
assert.match(html, /SOFT_MAX_MS\s*=\s*420/, "هدف LCP ليّن ≤420ms عند جاهزية الخطوط");
assert.match(html, /MAX_MS\s*=\s*1400/, "سقف صلب لانتظار الخطوط — منع FOUT");
assert.match(splash, /SPLASH_MIN_VISIBLE_MS\s*=\s*120/);
assert.match(splash, /SPLASH_LCP_SOFT_MS\s*=\s*420/);
assert.match(splash, /SPLASH_MAX_VISIBLE_MS\s*=\s*1_?400|SPLASH_MAX_VISIBLE_MS\s*=\s*1400/);
assert.match(html, /sessionStorage\.getItem\(KEY\)/, "تخطّي الدخولية في نفس الجلسة");
assert.match(html, /<meta charset="UTF-8"\s*\/>/, "charset موجود");
{
  const head = html.split(/<head[^>]*>/i)[1] ?? "";
  assert.match(head.trimStart(), /^\s*<meta charset=/i, "charset أول عنصر في head");
}

assert.match(app, /<main[^>]*id="main-content"/, "main landmark");
assert.match(app, /skip-link|mj-skip-link/, "رابط تجاوز");
assert.match(ar, /skip_to_content:\s*"تجاوز إلى المحتوى"/, "نص تجاوز عربي");

assert.match(auth, /setTimeout\(startBootstrap,\s*20000\)/, "تأجيل auth للزائر 20s (لا rIC)");
assert.doesNotMatch(auth, /requestIdleCallback\(startBootstrap/, "لا rIC يطلق فور الخمول");
assert.match(auth, /shouldBootstrapSoon/, "bootstrap فوري عند جلسة/مسار حساس");
assert.match(auth, /bootstrapStarted/, "منع bootstrap مزدوج");
assert.match(main, /setTimeout\(startAfterPaint,\s*20000\)/, "تأجيل supabase-bootstrap 20s (لا rIC)");
assert.match(main, /afterPaintStarted/, "منع تشغيل afterPaint مزدوج");
assert.doesNotMatch(main, /scheduleOnIdle\(afterPaint/, "لا scheduleOnIdle لـ supabase بعد الرسم");

assert.doesNotMatch(home, /home-legacy\.css/, "لا CSS قديم فوق الطية");
assert.match(below, /home-legacy\.css/, "CSS قديم تحت الطية فقط");
assert.doesNotMatch(home, /mushaf-madinah|VerifiedMushaf|tafsir-data|fiqh-issues-seed/, "لا حزم مصحف/تفسير/فقه في الرئيسية");

assert.doesNotMatch(intro, /from ["']lucide-react["']/, "مقدمة بلا lucide — LCP");
assert.match(app, /import\("@\/components\/NavBar"\)/, "NavBar كسول");
assert.match(app, /import\("@\/components\/BottomNavBar"\)/, "BottomNavBar كسول");
assert.match(app, /import\("@\/components\/TopSectionBar"\)/, "TopSectionBar كسول");
assert.doesNotMatch(navBack, /from ["']@\/config\/sections\.registry["']/, "navigation-back بلا سجل أقسام في الإقلاع");

const lazyFallback = read("src/components/LazyRouteFallback.tsx");
assert.doesNotMatch(lazyFallback, /from ["']@\/components\/ui-common["']|from ["']lucide-react["']/, "LazyRouteFallback بلا ui-common/lucide");
const spatial = read("src/lib/spatial-nav.ts");
assert.doesNotMatch(spatial, /from ["']@\/lib\/nav-map["']|from ["']lucide-react["']/, "spatial-nav بلا nav-map/lucide");
assert.match(html, /font-weight:\s*400/, "وزن 400 في الدخولية/الحرج — يقلّل amiri-700");
assert.match(main, /fonts-ui-bold\.css/, "أوزان 700 مؤجّلة بعد الرسم");
assert.match(main, /setTimeout\(\(\)\s*=>\s*\{\s*void import\("\.\/styles\/fonts-ui-bold\.css"\)/, "fonts-ui-bold عبر setTimeout لا rIC");

console.log("pagespeed-home-gate.test.ts: ok");
