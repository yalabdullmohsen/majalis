#!/usr/bin/env node
/**
 * يصحّح props بطاقة TopicQuiz/SectionQuiz — sectionId واحد أو route (بلا categoryId).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "../src");

/** مسار نسبي → props صحيحة (sectionId واحد أو route) */
const FILE_PROPS = {
  "views/TarikhIslamiPage.tsx": 'sectionId="islamic-history"',
  "views/TawhidPage.tsx": 'sectionId="aqidah"',
  "views/SeerahPage.tsx": 'sectionId="seerah"',
  "views/AsmaaHusnaPage.tsx": 'sectionId="aqidah"',
  "views/ArkanImanPage.tsx": 'sectionId="aqidah"',
  "views/ArkanIslamPage.tsx": 'sectionId="fiqh"',
  "views/JannaNaarPage.tsx": 'sectionId="aqidah"',
  "views/MalaikaPage.tsx": 'sectionId="aqidah"',
  "views/MethodologyPage.tsx": 'sectionId="aqidah"',
  "views/MiraclesPage.tsx": 'sectionId="aqidah"',
  "views/IslamicSectsPage.tsx": 'sectionId="aqidah"',
  "views/AlamatSaahPage.tsx": 'sectionId="aqidah"',
  "views/CalendarPage.tsx": 'sectionId="islamic-history"',
  "views/OccasionsPage.tsx": 'sectionId="islamic-history"',
  "views/IslamStatsPage.tsx": 'sectionId="islamic-history"',
  "views/InstitutionsPage.tsx": 'sectionId="islamic-history"',
  "views/UpdatesPage.tsx": 'sectionId="islamic-history"',
  "views/UniversitiesPage.tsx": 'sectionId="islamic-history"',
  "views/UniversityDetailPage.tsx": 'route="/universities"',
  "views/UniversitiesComparePage.tsx": 'route="/universities"',
  "views/ProphetStoriesPage.tsx": 'sectionId="prophets"',
  "views/IslamicStoriesPage.tsx": 'sectionId="prophets"',
  "views/ShimaelPage.tsx": 'sectionId="seerah"',
  "views/SahabahPage.tsx": 'route="/sahabah"',
  "views/PropheticMedicinePage.tsx": 'sectionId="hadith"',
  "views/WasayaNabawiyyaPage.tsx": 'sectionId="hadith"',
  "views/CitationPublicPage.tsx": 'sectionId="hadith"',
  "views/FadailAamalPage.tsx": 'sectionId="hadith"',
  "views/RaqaiqPage.tsx": 'sectionId="adhkar"',
  "views/TawbaPage.tsx": 'sectionId="adhkar"',
  "views/AdabTalabIlmPage.tsx": 'route="/adab-talab-ilm"',
  "views/AkhlaqPage.tsx": 'sectionId="adhkar"',
  "views/AmrBilMarufPage.tsx": 'sectionId="adhkar"',
  "views/CardsPage.tsx": 'sectionId="adhkar"',
  "views/HikamSalafPage.tsx": 'route="/hikam-salaf"',
  "views/StudyRoomPage.tsx": 'route="/study-room"',
  "views/SunanYawmiyyaPage.tsx": 'sectionId="fiqh"',
  "views/ResearcherProfilePage.tsx": 'route="/research"',
  "views/TopicsIndexPage.tsx": 'route="/topics"',
  "views/TopicPage.tsx": 'route="/topics"',
  "views/MindMapPage.tsx": 'route="/mind-map"',
  "views/KnowledgeGraphPage.tsx": 'route="/knowledge-graph"',
  "views/VaultPage.tsx": 'route="/vault"',
  "views/learning/LearningPathsPage.tsx": 'route="/learning-paths"',
  "views/learning/LearningPathDetailPage.tsx": 'route="/learning-paths"',
  "views/learning/CertificateVerifyPage.tsx": 'route="/learning-paths"',
  "pages/hadith/ui/HadithView.tsx": 'sectionId="hadith"',
  "pages/hadith/ui/HadithBooksView.tsx": 'sectionId="hadith"',
  "pages/hadith/ui/HadithScienceView.tsx": 'sectionId="hadith"',
  "pages/hadith/ui/ArbaeenNawawiView.tsx": 'sectionId="hadith"',
  "pages/hadith/HadithSahihPage.tsx": 'sectionId="hadith"',
  "pages/hadith/HadithMawduPage.tsx": 'sectionId="hadith"',
  "pages/hadith/HadithDaifPage.tsx": 'sectionId="hadith"',
  "pages/worship/ui/AdhkarView.tsx": 'sectionId="adhkar"',
  "pages/worship/ui/DuasView.tsx": 'route="/duas"',
  "pages/worship/ui/DailyWirdView.tsx": 'route="/daily-wird"',
  "pages/worship/ui/TasbihView.tsx": 'sectionId="adhkar"',
  "pages/worship/ui/QiblaView.tsx": 'sectionId="fiqh"',
  "pages/account/ui/FawaidView.tsx": 'sectionId="hadith"',
  "pages/account/ui/FlashCardsView.tsx": 'route="/flashcards"',
  "pages/account/ui/SiteMapView.tsx": 'route="/site-map"',
  "pages/account/ui/IslamicGlossaryView.tsx": 'route="/islamic-glossary"',
  "pages/lessons/ui/LessonsView.tsx": 'route="/lessons"',
  "pages/lessons/ui/LessonDetailView.tsx": 'route="/lessons"',
  "pages/lessons/ui/KuwaitLessonsView.tsx": 'route="/lessons"',
  "pages/library/ui/IslamicScholarsView.tsx": 'route="/scholars"',
  "pages/library/ui/ScholarProfileView.tsx": 'route="/scholars"',
  "pages/library/ui/ScholarlyResearchView.tsx": 'route="/research"',
  "pages/quran/ui/SurahStoriesView.tsx": 'sectionId="quran"',
  "pages/fiqh/ui/FiqhView.tsx": 'sectionId="fiqh"',
  "pages/fiqh/ui/FiqhQawaidView.tsx": 'sectionId="fiqh"',
  "pages/fiqh/ui/RulingsView.tsx": 'sectionId="fiqh"',
  "pages/fiqh/ui/SalahGuideView.tsx": 'sectionId="fiqh"',
  "pages/fiqh/ui/MawarithView.tsx": 'sectionId="fiqh"',
  "pages/fiqh/ui/ZakatView.tsx": 'sectionId="fiqh"',
  "pages/fiqh/ui/JanazaView.tsx": 'sectionId="fiqh"',
  "pages/fiqh/ui/HajjView.tsx": 'sectionId="fiqh"',
  "views/QaPage.tsx": 'sectionId="fiqh"',
  "views/FiqhCouncilPage.tsx": 'route="/fiqh-council"',
  "views/FiqhCouncilFatwasPage.tsx": 'route="/fiqh-council/fatwas"',
  "views/FiqhCouncilIssuesPage.tsx": 'route="/fiqh-council/issues"',
  "views/FiqhCouncilResolutionsPage.tsx": 'route="/fiqh-council/resolutions"',
  "views/FiqhCouncilRecommendationsPage.tsx": 'route="/fiqh-council/recommendations"',
  "views/FiqhCouncilStatsPage.tsx": 'route="/fiqh-council/stats"',
  "views/FiqhCouncilTopicIndexPage.tsx": 'route="/fiqh-council"',
  "views/FiqhCouncilCategoriesPage.tsx": 'route="/fiqh-council"',
  "views/FiqhCouncilComparePage.tsx": 'route="/fiqh-council"',
  "views/FiqhCouncilLivePage.tsx": 'route="/fiqh-council"',
  "views/FiqhCouncilNawazilPage.tsx": 'route="/fiqh-council"',
  "views/FiqhCouncilAdvancedSearchPage.tsx": 'route="/fiqh-council"',
  "views/FiqhCouncilArchivePage.tsx": 'route="/fiqh-council"',
  "views/MadhahibPage.tsx": 'sectionId="fiqh"',
  "views/TaharaPage.tsx": 'sectionId="fiqh"',
  "views/SawmPage.tsx": 'sectionId="fiqh"',
};

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(p, acc);
    } else if (/\.tsx$/.test(name)) acc.push(p);
  }
  return acc;
}

function patchSectionQuiz(src, props) {
  return src.replace(
    /<SectionQuiz\s+[^>]*?(?:sectionId=\{[^}]+\}|sectionId="[^"]*"|route="[^"]*")[^/]*?\/>|<SectionQuiz\s+[\s\S]*?\/>/g,
    (block) => {
      const title = block.match(/title="([^"]*)"/)?.[1];
      const aria = block.match(/aria-label="([^"]*)"/)?.[1];
      const count = block.match(/count=\{(\d+)\}/)?.[1] ?? "4";
      const parts = [`<SectionQuiz ${props}`];
      if (title) parts.push(`title="${title}"`);
      if (aria) parts.push(`aria-label="${aria}"`);
      parts.push(`count={${count}} />`);
      return parts.join(" ");
    },
  );
}

let changed = 0;
for (const file of walk(SRC)) {
  const rel = relative(SRC, file).replace(/\\/g, "/");
  const props = FILE_PROPS[rel];
  if (!props) continue;
  const before = readFileSync(file, "utf8");
  if (!before.includes("SectionQuiz")) continue;
  const after = patchSectionQuiz(before, props);
  if (after !== before) {
    writeFileSync(file, after);
    changed += 1;
    console.log("✓", rel);
  }
}
console.log(`Patched ${changed} files`);
