#!/usr/bin/env node
/**
 * ترحيل SectionQuiz: categoryId → sectionId.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "../src");

const FILE_SECTION_ID = {
  "views/TarikhIslamiPage.tsx": "islamic-history",
  "views/UniversitiesPage.tsx": "islamic-history",
  "views/UniversityDetailPage.tsx": "universities",
  "views/UniversitiesComparePage.tsx": "universities",
  "views/CalendarPage.tsx": "islamic-history",
  "views/OccasionsPage.tsx": "islamic-history",
  "views/SeerahPage.tsx": "seerah",
  "views/TawhidPage.tsx": "aqidah",
  "views/MalaikaPage.tsx": "aqidah",
  "views/JannaNaarPage.tsx": "aqidah",
  "views/AlamatSaahPage.tsx": "aqidah",
  "views/MethodologyPage.tsx": "aqidah",
  "views/MiraclesPage.tsx": "aqidah",
  "views/IslamicSectsPage.tsx": "aqidah",
  "views/IslamStatsPage.tsx": "islamic-history",
  "views/ArkanImanPage.tsx": "aqidah",
  "views/ArkanIslamPage.tsx": "fiqh",
  "views/ProphetStoriesPage.tsx": "prophets",
  "views/IslamicStoriesPage.tsx": "prophets",
  "views/PropheticMedicinePage.tsx": "hadith",
  "views/FiqhCouncilPage.tsx": "fiqh-council",
  "views/FiqhCouncilFatwasPage.tsx": "fiqh-council",
  "views/FiqhCouncilIssuesPage.tsx": "fiqh-council",
  "views/FiqhCouncilRecommendationsPage.tsx": "fiqh-council",
  "views/FiqhCouncilResolutionsPage.tsx": "fiqh-council",
  "views/MadhahibPage.tsx": "fiqh",
  "views/TaharaPage.tsx": "fiqh",
  "views/SunanYawmiyyaPage.tsx": "fiqh",
  "views/QaPage.tsx": "fiqh",
  "views/CardsPage.tsx": "adhkar",
  "views/AmrBilMarufPage.tsx": "adhkar",
  "views/MindMapPage.tsx": "topics",
  "views/KnowledgeGraphPage.tsx": "topics",
  "views/TopicsIndexPage.tsx": "topics",
  "views/TopicPage.tsx": "topics",
  "views/UpdatesPage.tsx": "islamic-history",
  "views/CitationPublicPage.tsx": "hadith",
  "views/VaultPage.tsx": "vault",
  "views/AsmaaHusnaPage.tsx": "asma-husna",
  "pages/fiqh/ui/FiqhView.tsx": "fiqh",
  "pages/fiqh/ui/RulingsView.tsx": "fiqh",
  "pages/fiqh/ui/SalahGuideView.tsx": "fiqh",
  "pages/fiqh/ui/MawarithView.tsx": "fiqh",
  "pages/fiqh/ui/ZakatView.tsx": "fiqh",
  "pages/fiqh/ui/JanazaView.tsx": "fiqh",
  "pages/lessons/ui/LessonsView.tsx": "lessons",
  "pages/lessons/ui/LessonDetailView.tsx": "lessons",
  "pages/lessons/ui/KuwaitLessonsView.tsx": "lessons",
  "pages/hadith/ui/HadithView.tsx": "hadith",
  "pages/hadith/ui/HadithScienceView.tsx": "hadith",
  "pages/hadith/ui/HadithBooksView.tsx": "hadith",
  "pages/hadith/ui/ArbaeenNawawiView.tsx": "hadith",
  "pages/hadith/HadithSahihPage.tsx": "hadith",
  "pages/hadith/HadithMawduPage.tsx": "hadith",
  "pages/hadith/HadithDaifPage.tsx": "hadith",
  "pages/quran/ui/SurahStoriesView.tsx": "quran-asbab",
  "pages/worship/ui/DailyWirdView.tsx": "daily-wird",
  "pages/worship/ui/AdhkarView.tsx": "adhkar",
  "pages/worship/ui/TasbihView.tsx": "adhkar",
  "pages/worship/ui/DuasView.tsx": "duas",
  "pages/worship/ui/QiblaView.tsx": "prayer",
  "pages/account/ui/IslamicGlossaryView.tsx": "glossary",
  "pages/account/ui/SiteMapView.tsx": "sitemap",
  "pages/account/ui/FawaidView.tsx": "fawaid",
  "pages/account/ui/FlashCardsView.tsx": "flashcards",
  "pages/library/ui/IslamicScholarsView.tsx": "scholars",
  "pages/library/ui/ScholarProfileView.tsx": "scholars",
  "pages/library/ui/ScholarlyResearchView.tsx": "research",
};

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(p, acc);
    } else if (/\.tsx$/.test(name)) {
      acc.push(p);
    }
  }
  return acc;
}

let changed = 0;
for (const file of walk(SRC)) {
  const rel = relative(join(SRC), file).replace(/\\/g, "/");
  let src = readFileSync(file, "utf8");
  if (!src.includes("SectionQuiz") || !src.includes("categoryId")) continue;

  const sectionId = FILE_SECTION_ID[rel];
  if (!sectionId) {
    console.warn("⚠ no map:", rel);
    continue;
  }

  const before = src;
  src = src.replace(/categoryId=\{(\[[^\]]+\]|"[^"]+")\}/g, `sectionId="${sectionId}"`);
  if (src !== before) {
    writeFileSync(file, src);
    changed += 1;
    console.log("✓", rel, "→", sectionId);
  }
}
console.log(`Migrated ${changed} files`);
