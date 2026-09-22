/**
 * Visual Redesign V2 — tokens + SunnahCard V2 gate (PR-1).
 * Run: node --import tsx src/lib/__tests__/visual-redesign-v2-tokens-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { V2_COLOR, V2_RADIUS, SS_COLOR } from "../ssunnah-theme.ts";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== theme SoT ivory + emerald + gold ===");
{
  const theme = read("src/app/styles/theme.css");
  assert.match(theme, /--surface-app:\s*#F7F3EB/i);
  assert.match(theme, /--sunnah-quran-gold:\s*#C9A82E/i);
  assert.match(theme, /--sunnah-emerald:/);
  assert.match(theme, /--sunnah-v2-radius-card:/);
  assert.match(theme, /--surface-app:\s*#0F1613/i);
}

console.log("=== V2 tokens file ===");
{
  const v2 = read("src/styles/visual-redesign-v2-tokens.css");
  assert.match(v2, /--v2-color-ivory:\s*#f9f8f4/i);
  assert.match(v2, /--v2-color-emerald/);
  assert.match(v2, /--v2-color-gold/);
  assert.match(v2, /--v2-color-night-bg/);
  assert.match(v2, /--v2-radius-card/);
  assert.match(v2, /--v2-duration-fast/);
  assert.match(v2, /data-v2-dashboard/);
  assert.match(v2, /prefers-reduced-motion/);
}

console.log("=== wired in main ===");
{
  const main = read("src/main.tsx");
  assert.match(main, /visual-redesign-v2-tokens\.css/);
}

console.log("=== SunnahCard V2 ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/components/design-system/SunnahCardV2.tsx")));
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/components/sunnah-card-v2.css")));
  const card = read("src/components/design-system/SunnahCardV2.tsx");
  const css = read("src/styles/components/sunnah-card-v2.css");
  assert.match(card, /variant\?:/);
  assert.match(card, /welcome/);
  assert.doesNotMatch(card, /#[0-9A-Fa-f]{3,8}/);
  assert.match(css, /\.sc2--welcome/);
  assert.doesNotMatch(css, /border-inline-start:\s*[34]px/);
  const idx = read("src/components/design-system/index.ts");
  assert.match(idx, /SunnahCardV2/);
}

console.log("=== TS aliases ===");
assert.equal(V2_COLOR.emerald, "var(--v2-color-emerald)");
assert.equal(V2_COLOR.gold, "var(--v2-color-gold)");
assert.equal(V2_RADIUS.card, "var(--v2-radius-card)");
assert.equal(SS_COLOR.quranGold, "var(--ss-color-quran-gold)");

console.log("=== docs ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /Premium Islamic Dashboard/);
  assert.match(doc, /Deep Emerald/);
  assert.match(doc, /SunnahCardV2/);
  assert.match(doc, /HomeQuickAccessV2/);
  assert.match(doc, /home-dashboard-v2\.css/);
}

console.log("=== PR-2 Dashboard Homepage ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-dashboard/);
  assert.match(app, /m2030-home--v2/);
  assert.ok(existsSync(resolve(majalisRoot, "src/components/home/HomeQuickAccessV2.tsx")));
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/home-dashboard-v2.css")));
  const below = read("src/pages/account/ui/HomeBelowFold.tsx");
  assert.match(below, /SunnahCardV2/);
  assert.match(below, /HomeQuickAccessV2/);
  assert.match(below, /استكمال الرحلة/);
  assert.doesNotMatch(below, /FeatureCard/);
  const brand = read("src/styles/components/home-brand-title.css");
  assert.match(brand, /data-v2-dashboard/);
  assert.match(brand, /--v2-color-emerald/);
  assert.match(
    brand,
    /data-v2-dashboard="1"[\s\S]*home-page-hero\.page-hero-mj[\s\S]*background-color:\s*var\(--v2-color-emerald/,
    "هيرو V2 له خلفية زمردية صلبة للتباين",
  );
  const homeView = read("src/pages/account/ui/HomeView.tsx");
  assert.match(homeView, /home-dashboard-v2\.css/);
}

console.log("=== PR-3 Quran Hub ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-quran-hub/);
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/quran-hub-v2.css")));
  const hub = read("src/pages/quran/ui/QuranHubView.tsx");
  assert.match(hub, /quran-hub-v2\.css/);
  assert.match(hub, /quran-hub-v2/);
  const hubCss = read("src/styles/pages/quran-hub-v2.css");
  assert.match(hubCss, /data-v2-quran-hub/);
  assert.match(hubCss, /quran-open-mushaf/);
  assert.match(hubCss, /--v2-radius-card/);
  assert.doesNotMatch(hubCss, /border-inline-start:\s*[34]px/);
  const mushafCss = read("src/features/mushaf-reader/mushaf-reader.css");
  assert.match(mushafCss, /--v2-color-gold/);
  assert.match(mushafCss, /nm-controls__btn:focus-visible/);
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /PR-3 Quran Hub/);
  assert.match(doc, /quran-hub-v2\.css/);
}

console.log("=== PR-4 Stories & Seerah ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-stories/);
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/stories-seerah-v2.css")));
  const prophets = read("src/views/ProphetStoriesPage.tsx");
  const seerah = read("src/views/SeerahPage.tsx");
  assert.match(prophets, /stories-seerah-v2\.css/);
  assert.match(seerah, /stories-seerah-v2\.css/);
  const css = read("src/styles/pages/stories-seerah-v2.css");
  assert.match(css, /data-v2-stories/);
  assert.match(css, /prophet-lux-card/);
  assert.match(css, /seerah-timeline/);
  assert.match(css, /Historical Timeline|Timeline/);
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /PR-4 Stories/);
  assert.match(doc, /stories-seerah-v2\.css/);
}

console.log("=== PR-5 Library & Search ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-search/);
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/library-search-v2.css")));
  const search = read("src/pages/account/ui/SearchView.tsx");
  assert.match(search, /library-search-v2\.css/);
  const css = read("src/styles/pages/library-search-v2.css");
  assert.match(css, /data-v2-search/);
  assert.match(css, /srch-home-form|Search First/);
  assert.match(css, /srch-result-card/);
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /PR-5 Library/);
  assert.match(doc, /library-search-v2\.css/);
}

console.log("=== PR-6 Profile Hub + Bottom Nav ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-profile/);
  assert.match(app, /data-v2-nav/);
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/profile-hub-v2.css")));
  const settings = read("src/pages/account/ui/SettingsView.tsx");
  const progress = read("src/pages/account/ui/ProgressCenterView.tsx");
  const nav = read("src/components/BottomNavBar.tsx");
  assert.match(settings, /profile-hub-v2\.css/);
  assert.match(progress, /profile-hub-v2\.css/);
  assert.match(nav, /profile-hub-v2\.css/);
  const css = read("src/styles/pages/profile-hub-v2.css");
  assert.match(css, /data-v2-profile/);
  assert.match(css, /data-v2-nav/);
  assert.match(css, /settings-account-card/);
  assert.match(css, /bottom-nav--v2/);
  assert.match(css, /kp-continue/);
  assert.doesNotMatch(css, /border-inline-start:\s*[34]px/);
  const tabs = read("src/lib/nav-map.ts");
  assert.match(tabs, /BOTTOM_NAV_TABS/);
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /PR-6 Profile Hub/);
  assert.match(doc, /profile-hub-v2\.css/);
}

console.log("=== PR-7 Dark Mode Luxury Night ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-night/);
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/luxury-night-v2.css")));
  assert.match(app, /luxury-night-v2\.css/);
  assert.match(app, /void import\(/);
  const main = read("src/main.tsx");
  assert.match(main, /luxury-night-v2\.css/);
  const tokens = read("src/styles/visual-redesign-v2-tokens.css");
  assert.match(tokens, /--v2-color-night-muted:\s*#b3c9bd/i);
  assert.match(tokens, /--v2-color-night-emerald-text/);
  assert.match(tokens, /emerald-soft:[\s\S]*night-surface/);
  const night = read("src/styles/pages/luxury-night-v2.css");
  assert.match(night, /data-v2-night/);
  assert.match(night, /quran-open-mushaf/);
  assert.match(night, /Deep Emerald Night|Luxury Night/);
  assert.match(night, /night-emerald-text/);
  assert.doesNotMatch(night, /border-inline-start:\s*[34]px/);
  const card = read("src/styles/components/sunnah-card-v2.css");
  assert.match(card, /\.sc2--welcome \.sc2-cta[\s\S]*color:\s*var\(--v2-color-emerald\)/);
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /PR-7 Dark Mode/);
  assert.match(doc, /luxury-night-v2\.css/);
}

console.log("=== PR-8 Visual QA ===");
{
  const qa = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2_QA.md"), "utf8");
  assert.match(qa, /Visual QA/);
  assert.match(qa, /data-v2-dashboard/);
  assert.match(qa, /data-v2-quran-hub/);
  assert.match(qa, /data-v2-stories/);
  assert.match(qa, /data-v2-search/);
  assert.match(qa, /data-v2-profile/);
  assert.match(qa, /data-v2-nav/);
  assert.match(qa, /data-v2-night/);
  assert.match(qa, /Acceptance/);
  assert.match(qa, /Color contrast/);
  const surfaces = [
    "home-dashboard-v2.css",
    "quran-hub-v2.css",
    "stories-seerah-v2.css",
    "library-search-v2.css",
    "profile-hub-v2.css",
    "luxury-night-v2.css",
    "sunnah-card-v2.css",
  ];
  for (const f of surfaces) {
    const rel = f.startsWith("sunnah")
      ? `src/styles/components/${f}`
      : `src/styles/pages/${f}`;
    assert.ok(existsSync(resolve(majalisRoot, rel)), `missing ${rel}`);
  }
  const app = read("src/App.tsx");
  for (const attr of [
    "data-v2-dashboard",
    "data-v2-quran-hub",
    "data-v2-stories",
    "data-v2-search",
    "data-v2-profile",
    "data-v2-nav",
    "data-v2-night",
    "data-v2-app",
  ]) {
    assert.match(app, new RegExp(attr));
  }
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /PR-8 Visual QA/);
  assert.match(doc, /VISUAL_REDESIGN_V2_QA\.md/);
}

console.log("=== Expansion PR-A App Shell default ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-app/);
  assert.match(app, /app-shell-v2\.css/);
  assert.match(app, /enableV2App/);
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/app-shell-v2.css")));
  assert.ok(existsSync(resolve(majalisRoot, "src/components/design-system/PageHeaderV2.tsx")));
  assert.ok(existsSync(resolve(majalisRoot, "src/components/design-system/EmptyStateV2.tsx")));
  const shell = read("src/styles/pages/app-shell-v2.css");
  assert.match(shell, /data-v2-app/);
  assert.match(shell, /soft-card/);
  assert.match(shell, /page-header-v2|\.ph2/);
  assert.match(shell, /empty-state-v2|\.es2/);
  assert.match(shell, /topic-page__hero/);
  assert.match(shell, /legal-page-hero/);
  assert.match(shell, /kx-library-card|topic-card/);
  assert.doesNotMatch(shell, /border-inline-start:\s*[34]px/);
  const idx = read("src/components/design-system/index.ts");
  assert.match(idx, /PageHeaderV2/);
  assert.match(idx, /EmptyStateV2/);
  const tokens = read("src/styles/visual-redesign-v2-tokens.css");
  assert.match(tokens, /data-v2-app/);
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /Expansion PR-A|App Shell V2 default/);
  assert.match(doc, /app-shell-v2\.css/);
  assert.match(app, /\/tafsir|\/ulum-quran/);
  assert.match(app, /\/duas|\/zakat/);
  assert.match(app, /\/vault|\/flashcards|\/competitions/);
}

console.log("=== Full-app V2 coverage (SectionHero global) ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /\/tafsir/);
  assert.match(app, /\/ulum-quran/);
  assert.match(app, /\/quran-knowledge/);
  assert.match(app, /\/duas/);
  assert.match(app, /\/vault/);
  assert.match(app, /\/flashcards/);
  assert.match(app, /\/competitions/);
  assert.match(app, /\/stories/);
  const shell = read("src/styles/pages/app-shell-v2.css");
  assert.match(shell, /Full-app coverage|topic-page__hero/);
  assert.match(shell, /fqh-hub-hero|legal-page-hero/);
  const qa = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2_QA.md"), "utf8");
  assert.match(qa, /Full-app|topic-page__hero|جميع الشاشات|global SectionHero/i);
}

console.log("=== Expansion PR-B Lessons + Sections ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-lessons/);
  assert.match(app, /data-v2-sections/);
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/lessons-sections-v2.css")));
  const lessons = read("src/pages/lessons/ui/LessonsView.tsx");
  const sections = read("src/pages/account/SectionsPage.tsx");
  assert.match(lessons, /lessons-sections-v2\.css/);
  assert.match(lessons, /EmptyStateV2/);
  assert.match(sections, /lessons-sections-v2\.css/);
  assert.match(sections, /PageHeaderV2/);
  const css = read("src/styles/pages/lessons-sections-v2.css");
  assert.match(css, /data-v2-lessons/);
  assert.match(css, /data-v2-sections/);
  assert.match(css, /lesson-unified-card/);
  assert.match(css, /hub-card|section-entry-card/);
  assert.doesNotMatch(css, /border-inline-start:\s*[34]px/);
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /Expansion PR-B|Lessons \+ Sections/);
  assert.match(doc, /lessons-sections-v2\.css/);
}

console.log("=== Expansion PR-C Knowledge Dashboards ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-knowledge/);
  assert.match(app, /isKnowledgeHubPath/);
  assert.match(app, /knowledge-dashboards-v2\.css/);
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/knowledge-dashboards-v2.css")));
  const fiqh = read("src/pages/fiqh/ui/FiqhView.tsx");
  const hadith = read("src/pages/hadith/ui/HadithView.tsx");
  const tawhid = read("src/views/TawhidPage.tsx");
  assert.match(fiqh, /knowledge-dashboards-v2\.css/);
  assert.match(fiqh, /EmptyStateV2/);
  assert.match(hadith, /knowledge-dashboards-v2\.css/);
  assert.match(hadith, /EmptyStateV2/);
  assert.match(tawhid, /knowledge-dashboards-v2\.css/);
  const css = read("src/styles/pages/knowledge-dashboards-v2.css");
  assert.match(css, /data-v2-knowledge/);
  assert.match(css, /topic-page__hero/);
  assert.match(css, /hadith-card/);
  assert.match(css, /kx-library-card|hub-card/);
  assert.doesNotMatch(css, /border-inline-start:\s*[34]px/);
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /Expansion PR-C|Knowledge Dashboard/);
  assert.match(doc, /knowledge-dashboards-v2\.css/);
}

console.log("=== Expansion PR-D Worship + Glossary + History ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-worship/);
  assert.match(app, /data-v2-glossary/);
  assert.match(app, /data-v2-history/);
  assert.match(app, /worship-history-v2\.css/);
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/worship-history-v2.css")));
  const adhkar = read("src/pages/worship/ui/AdhkarView.tsx");
  const prayer = read("src/pages/worship/ui/PrayerTimesView.tsx");
  const glossary = read("src/pages/account/ui/IslamicGlossaryView.tsx");
  const tarikh = read("src/views/TarikhIslamiPage.tsx");
  const salah = read("src/pages/fiqh/ui/SalahGuideView.tsx");
  assert.match(adhkar, /worship-history-v2\.css/);
  assert.match(adhkar, /EmptyStateV2/);
  assert.match(prayer, /worship-history-v2\.css/);
  assert.match(glossary, /worship-history-v2\.css/);
  assert.match(glossary, /EmptyStateV2/);
  assert.match(tarikh, /worship-history-v2\.css/);
  assert.match(tarikh, /EmptyStateV2/);
  assert.match(salah, /worship-history-v2\.css/);
  const css = read("src/styles/pages/worship-history-v2.css");
  assert.match(css, /data-v2-worship/);
  assert.match(css, /data-v2-glossary/);
  assert.match(css, /data-v2-history/);
  assert.match(css, /adhkar-focus-card|tarikh-card|gl-term/);
  assert.doesNotMatch(css, /border-inline-start:\s*[34]px/);
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /Expansion PR-D|Worship/);
  assert.match(doc, /worship-history-v2\.css/);
}

console.log("=== Expansion PR-E Learn + Legal + Offline + Error ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data-v2-learn/);
  assert.match(app, /data-v2-legal/);
  assert.match(app, /data-v2-offline/);
  assert.match(app, /learn-legal-v2\.css/);
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/pages/learn-legal-v2.css")));
  const quiz = read("src/pages/account/QuizPage.tsx");
  const about = read("src/views/AboutPage.tsx");
  const privacy = read("src/views/PrivacyPage.tsx");
  const support = read("src/views/SupportPage.tsx");
  const offline = read("src/pages/account/ui/OfflineCenterView.tsx");
  const err = read("src/components/ErrorBoundary.tsx");
  assert.match(quiz, /learn-legal-v2\.css/);
  assert.match(about, /learn-legal-v2\.css/);
  assert.match(privacy, /learn-legal-v2\.css/);
  assert.match(support, /learn-legal-v2\.css/);
  assert.match(offline, /learn-legal-v2\.css/);
  assert.match(offline, /PageHeaderV2/);
  assert.match(offline, /EmptyStateV2/);
  assert.match(err, /learn-legal-v2\.css/);
  const css = read("src/styles/pages/learn-legal-v2.css");
  assert.match(css, /data-v2-learn/);
  assert.match(css, /data-v2-legal/);
  assert.match(css, /data-v2-offline/);
  assert.match(css, /error-boundary|qzg-section-card|legal-page-hero/);
  assert.doesNotMatch(css, /border-inline-start:\s*[34]px/);
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /Expansion PR-E|Learn/);
  assert.match(doc, /learn-legal-v2\.css/);
}

console.log("=== Expansion PR-F Final QA ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2.md"), "utf8");
  assert.match(doc, /Expansion PR-F|Final QA/);
  assert.match(doc, /#2213/);
  const qa = readFileSync(resolve(repoRoot, "docs/design/VISUAL_REDESIGN_V2_QA.md"), "utf8");
  assert.match(qa, /data-v2-app/);
  assert.match(qa, /data-v2-knowledge/);
  assert.match(qa, /data-v2-worship/);
  assert.match(qa, /data-v2-learn/);
  assert.match(qa, /data-v2-legal/);
  assert.match(qa, /data-v2-offline/);
  assert.match(qa, /Expansion/);
  assert.match(qa, /learn-legal-v2\.css/);
  assert.match(qa, /knowledge-dashboards-v2\.css/);
  assert.match(qa, /worship-history-v2\.css/);
  for (const f of [
    "app-shell-v2.css",
    "lessons-sections-v2.css",
    "knowledge-dashboards-v2.css",
    "worship-history-v2.css",
    "learn-legal-v2.css",
  ]) {
    assert.ok(existsSync(resolve(majalisRoot, `src/styles/pages/${f}`)), f);
  }
}

console.log("=== package script ===");
{
  const pkg = read("package.json");
  assert.match(pkg, /test:visual-redesign-v2-tokens/);
}

console.log("visual-redesign-v2-tokens-gate.test.ts: ok");
