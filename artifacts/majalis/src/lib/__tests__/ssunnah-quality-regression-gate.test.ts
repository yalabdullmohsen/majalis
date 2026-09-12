/**
 * بوابة منع رجوع أخطاء الجودة (جوال / مصحف / أقسام / أداء).
 * رسائل الفشل إنجليزية واضحة للـCI.
 * Run: node --import tsx src/lib/__tests__/ssunnah-quality-regression-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const finalCss = read("src/styles/final-release.css");
const polish = read("src/styles/ssunnah-ux-polish.css");
const native = read("src/styles/components/native-feel.css");
const instant = read("src/styles/components/instant-interaction.css");
const filters = read("src/styles/components/filters.css");
const searchCss = read("src/styles/pages/search.css");
const sectsCss = read("src/styles/pages/islamic-sects.css");
const akhlaqCss = read("src/styles/pages/akhlaq.css");
const storiesCss = read("src/styles/pages/islamic-stories.css");
const sectsPage = read("src/views/IslamicSectsPage.tsx");
const akhlaqPage = read("src/views/AkhlaqPage.tsx");
const storiesPage = read("src/views/IslamicStoriesPage.tsx");
const lobby = read("src/components/lobby/SectionLobby.tsx");
const sectionHero = read("src/components/topic/SectionHero.tsx");
const pageHero = read("src/components/ui/PageHero.tsx");
const appBack = read("src/components/common/AppBackButton.tsx");
const floating = read("src/components/FloatingBackButton.tsx");
const mushafCss = read("src/features/mushaf-reader/mushaf-reader.css");
const mushafReader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const mushafPage = read("src/features/mushaf-reader/MushafPage.tsx");
const mushafPager = read("src/features/mushaf-reader/useMushafPager.ts");
const homeBelow = read("src/pages/account/ui/HomeBelowFold.tsx");
const sheetCss = read("src/features/mushaf-madinah/quran-sheet/quran-sheet.css");
const tafsir = read("src/features/mushaf-madinah/MushafTafsirSheet.tsx");

function maxRouteAnimMs(css: string): number {
  const matches = [...css.matchAll(/#main-content\.mj-route-\w+[^{]*\{[^}]*animation:[^;]*?(\d+)ms/g)];
  return matches.reduce((max, m) => Math.max(max, Number(m[1])), 0);
}

/* ── 1) Mobile layout: overflow / bottom nav / FAB ── */
assert.match(
  polish,
  /\.app-main[\s\S]{0,80}?overflow-x:\s*clip/,
  "Horizontal overflow: .app-main must use overflow-x: clip",
);
assert.match(
  finalCss,
  /#main-content\.app-main[\s\S]*?padding-block-end:\s*calc\(\s*var\(--bottom-nav-height/,
  "Bottom nav covers content: #main-content needs padding-block-end with --bottom-nav-height",
);
assert.match(
  finalCss,
  /\.bottom-nav(?:--v2)?[\s\S]{0,400}?opacity:\s*1\s*!important/,
  "Bottom nav must stay opaque (opacity: 1 !important)",
);
assert.match(floating, /FLOATING_BACK_DISABLED/, "FAB الدائري ملغى");
assert.match(floating, /FIXED_BACK_BAR_ENABLED|variant="bar"/, "شريط الرجوع الثابت بديلًا");
const hideFab = polish + read("src/styles/knowledge-experience.css");
assert.match(
  hideFab,
  /\.floating-back-btn[\s\S]{0,200}?display:\s*none/,
  "Floating back CSS remains hidden as safety net",
);

/* ── 2) Duplicate back buttons ── */
assert.match(floating, /FLOATING_BACK_DISABLED/, "FloatingBackButton: FAB disabled");
assert.match(floating, /FIXED_BACK_BAR_ENABLED/, "Fixed back bar enabled");
assert.match(floating, /AppBackButton/, "FloatingBackButton still exports AppBackButton");
assert.match(appBack, /onPointerDown/, "Back must fire on pointer down (instant)");
assert.match(lobby, /AppBackButton|data-section-back/, "اللوبي يعرض رجوعًا هيدريًا");
assert.match(
  sectionHero,
  /AppBackButton|section-hero__back|goBackOrFallback/,
  "SectionHero renders header back (FAB disabled)",
);
assert.doesNotMatch(sectionHero, /variant=["']floating["']/, "SectionHero must not use floating variant");
assert.doesNotMatch(
  pageHero,
  /AppBackButton|showBack|page-hero-mj__back/,
  "Duplicate back buttons visible: PageHero must not render inline back",
);

/* ── 3) Filters / chips / centered last card ── */
assert.match(
  filters,
  /\.mj-segmented-filter--scroll[\s\S]{0,200}?padding-inline/,
  "Filter chips clipped at edge: scroll row needs padding-inline",
);
assert.match(
  filters,
  /\.mj-filter-chip[\s\S]{0,120}?min-height:\s*44px/,
  "Filter chips must be ≥44px tall",
);
assert.match(
  sectsCss,
  /\.sect-hub__chip[\s\S]{0,80}?min-height:\s*44px/,
  "Section chips must be ≥44px tall",
);
assert.match(
  akhlaqCss,
  /\.akl-cat[\s\S]{0,80}?min-height:\s*44px/,
  "Akhlaq chips must be ≥44px tall",
);
assert.match(
  storiesCss,
  /\.isp-chip[\s\S]{0,80}?min-height:\s*44px/,
  "Stories chips must be ≥44px tall",
);
assert.match(
  sectsCss,
  /\.sect-hub__grid\s*>\s*:last-child:nth-child\(odd\)[\s\S]{0,80}?justify-self:\s*center/,
  "Section card is not centered: odd last grid child must justify-self:center",
);
assert.match(
  storiesCss,
  /\.isp-grid\s*>\s*:last-child:nth-child\(odd\)/,
  "Section card is not centered: stories grid needs odd-last centering",
);
assert.match(
  searchCss,
  /\.srch-home-field[\s\S]{0,120}?min-height:\s*44px/,
  "Search input must be ≥44px tall",
);

/* ── 4) Legacy section anti-patterns ── */
for (const [name, src] of [
  ["islamic-sects", sectsPage],
  ["akhlaq", akhlaqPage],
  ["stories", storiesPage],
] as const) {
  assert.match(src, /SectionTemplatePage/, `${name}: must use SectionTemplatePage (not legacy shell)`);
  assert.doesNotMatch(
    src,
    /background:\s*["']linear-gradient\(135deg,\s*var\(--mj-brand-deep\)/,
    `Low contrast text found inside dark hero: ${name} must not embed hard dark-green hero gradient`,
  );
  assert.doesNotMatch(
    src,
    /FloatingBackButton/,
    `Pages must not mount FloatingBackButton locally: ${name}`,
  );
}

const tarikhPage = read("src/views/TarikhIslamiPage.tsx");
const tarikhDetail = read("src/views/TarikhIslamiDetailPage.tsx");
const tawhidPage = read("src/views/TawhidPage.tsx");
const readingCard = read("src/components/content/ReadingSectionCard.tsx");
const relatedCard = read("src/components/content/RelatedContentCard.tsx");
const readingCss = read("src/styles/components/reading-section-card.css");
assert.match(tarikhPage, /SectionTemplatePage/, "tarikh-islami must use SectionTemplatePage");
assert.doesNotMatch(tarikhPage, /SectionHero/, "Duplicate section hero on tarikh-islami");
assert.match(tarikhDetail, /TopicPage/, "tarikh detail must use TopicPage shell");
assert.match(tarikhDetail, /ReadingSectionCard/, "tarikh detail explanation must be inside ReadingSectionCard");
assert.match(tarikhDetail, /title="الشرح"/, "tarikh detail must expose شرح section card");
assert.match(tarikhDetail, /title="المصادر"/, "tarikh detail sources must be inside a clear card");
assert.match(tarikhDetail, /RelatedContentStack|RelatedContentCard/, "tarikh related/read-also must use related cards");
assert.doesNotMatch(
  tarikhDetail,
  /<p className="tarikh-detail__body">/,
  "Bare tarikh explanation paragraphs outside reading cards are not allowed",
);
assert.doesNotMatch(
  tarikhDetail,
  /FloatingBackButton/,
  "Duplicate back buttons visible: tarikh detail must rely on global FAB only",
);
assert.match(readingCard, /rsc__title/, "ReadingSectionCard must render titled section cards");
assert.match(relatedCard, /rcc__arrow/, "RelatedContentCard must show a clear enter arrow");
assert.match(readingCss, /\.rsc\s*\{/, "reading-section-card.css must define .rsc");
assert.doesNotMatch(
  readingCss,
  /\.rsc__body[^{]*\{[^}]*opacity:\s*0\.[0-4]\b/s,
  "Low contrast text: reading body must not use heavy opacity fade",
);
assert.match(storiesPage, /ReadingSectionCard/, "islamic stories detail must use ReadingSectionCard");
assert.doesNotMatch(
  storiesPage,
  /isp-detail__back/,
  "Duplicate back buttons visible: stories detail must not render local back",
);
assert.match(tawhidPage, /SectionTemplatePage/, "tawhid must use SectionTemplatePage");
assert.doesNotMatch(
  tawhidPage,
  /twh-hub-hero|misc-page-legacy/,
  "Low contrast text found inside dark hero: tawhid must not use local dark hub hero",
);
assert.match(read("src/config/section-template.ts"), /"\/tawhid":\s*"aqeedah"/);
assert.doesNotMatch(
  sectsCss + akhlaqCss + storiesCss,
  /#(?:1d4ed8|2563eb|3b82f6|6D28D9|7c3aed)\b/i,
  "Off-brand blue/purple icon/colors found in legacy section CSS",
);
assert.doesNotMatch(
  sectsCss,
  /\.sect-hub__card[^{]*\{[^}]*background:\s*var\(--elite-forest/s,
  "Heavy dark-green section cards found in islamic-sects.css",
);
assert.doesNotMatch(
  storiesCss,
  /\.isp-card\s*\{[^}]*background:\s*var\(--elite-forest/s,
  "Heavy dark-green section cards found in islamic-stories.css",
);
assert.doesNotMatch(
  polish,
  /\.topic-page__lede[\s\S]{0,80}?opacity:\s*0\.[0-4]\b/,
  "Low contrast text: topic lede must not use opacity < 0.5",
);

/* ── 5) Mushaf flip stability ── */
assert.doesNotMatch(
  mushafCss,
  /transform:\s*scale\(/,
  "Mushaf font-size changed after page flip: transform:scale forbidden on mushaf CSS",
);
assert.doesNotMatch(
  mushafPager,
  /scale\(/,
  "Mushaf transform:scale found in pager",
);
assert.match(
  mushafCss,
  /transition:\s*none/,
  "Mushaf layout must disable transitions that cause flip jump",
);
assert.match(
  mushafPage,
  /منع layout shift عند قلب الصفحة/,
  "MushafPage must document/guard layout shift on flip",
);
assert.match(
  mushafReader,
  /ارتفاع الحاوية ثابت/,
  "Mushaf container height must stay fixed across flips",
);
assert.doesNotMatch(
  mushafReader,
  /setTimeout\(\s*\(\)\s*=>\s*\{\s*finishPageTurn/,
  "No setTimeout used to patch mushaf layout after flip",
);
assert.doesNotMatch(
  mushafReader,
  /<MushafPage[\s\S]{0,200}?key=\{page/,
  "Mushaf remounts on every flip: MushafPage must not key={page}",
);
assert.match(
  mushafReader,
  /stableView/,
  "Mushaf must keep stableView across page flips (no full remount flash)",
);
assert.match(
  sheetCss,
  /mushaf-bottom-safe-space/,
  "Audio/tafsir dock must reserve mushaf-bottom-safe-space so lines stay visible",
);
assert.match(
  tafsir,
  /setSnap/,
  "Tafsir sheet must use snap heights (controlled overlay, not covering ayahs blindly)",
);

/* ── 6) Performance basics ── */
assert.match(
  homeBelow,
  /lazyWithRetry/,
  "Home loads heavy sections eagerly: HomeBelowFold must lazy-load below-fold blocks",
);
assert.ok(
  (homeBelow.match(/lazyWithRetry\(/g) || []).length >= 8,
  "Home must lazy-load multiple heavy sections (expected ≥8 lazyWithRetry)",
);
const routeMs = maxRouteAnimMs(native);
assert.ok(
  routeMs > 0 && routeMs <= 180,
  `Basic navigation animation longer than 180ms (found ${routeMs}ms on mj-route-*)`,
);
assert.doesNotMatch(
  instant,
  /scale\(0\.9/,
  "Global active scale causes text grow/shrink flash on touch",
);

console.log("ssunnah-quality-regression-gate.test.ts: ok");
