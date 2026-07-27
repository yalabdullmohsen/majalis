#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");
const VIEWS = path.join(ROOT, "src/views");
const NATIONS = path.join(LIB, "nations/data");

const PAGE_MIN = 250;
const NATIONS_MIN = 250;
const UPDATE_MIN = 170;
const CIRCLE_MIN = 200;
const MUTA_MIN = 200;
const MIND_MIN = 210;
const AMR_MIN = 210;

const PAGE_SKIP =
  /SiteMapPage|Admin|Login|Register|Settings|Dashboard|NotFound|AuthCallback|Upload|Vault|SearchPage|TopicPage|MyCitations|AccountDeletion|NotificationSettings|CarMode|MosqueMode|FamilyMode|Transcribe|AssistantPage|ContactPage|PrivacyPage|TermsPage|AboutPage|UpdatesPage|FlashCards|QuizPage|StudyRoom|CitationPublic|SubmitContent|MySubmissions|UserStats|ReadingPlans|CalendarPage|PrayerTimes|Qibla|Tasbih|AdhanSettings|DiscoverIslamContact|AutoContent|FiqhCouncil|RulingDetail|LessonDetail|ScientificAnnouncement|UniversityDetail|ScholarProfile|ResearcherProfile|NewMuslimDay|NationDetail|HadithMawdu|HadithDaif|LibraryDetail|AnnualCourseDetail|ArbaeenHadith|DiscoverIslam.*Detail|FiqhCouncilItem|FiqhCouncilSession|FiqhCouncilIssue|SinsAndRightsDetail/i;

function countShortPages() {
  let n = 0;
  for (const f of fs.readdirSync(VIEWS).filter((x) => x.endsWith("Page.tsx") && !PAGE_SKIP.test(x))) {
    const t = fs.readFileSync(path.join(VIEWS, f), "utf8");
    for (const field of ["desc", "description", "summary", "explanation", "meaning", "benefit"]) {
      const re = new RegExp(`${field}\\s*:\\s*(["\`])(.*?)\\1`, "gs");
      let m;
      while ((m = re.exec(t))) {
        if (m[2].length < PAGE_MIN && !/﴿|﴾|«|»|\$\{/.test(m[2])) n++;
      }
    }
  }
  return n;
}

function countShortNations() {
  let n = 0;
  for (const f of fs.readdirSync(NATIONS).filter((x) => x.endsWith(".ts"))) {
    const t = fs.readFileSync(path.join(NATIONS, f), "utf8");
    for (const m of t.matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)) {
      if (m[1].length < NATIONS_MIN) n++;
    }
    for (const arr of ["lessons", "todayLesson"]) {
      const re = new RegExp(`${arr}:\\s*\\[([\\s\\S]*?)\\]\\s*,`, "g");
      let m;
      while ((m = re.exec(t))) {
        for (const s of m[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
          if (s[1].length < NATIONS_MIN) n++;
        }
      }
    }
  }
  return n;
}

async function main() {
  const u = await import(`${path.join(LIB, "updates-seed.ts")}?v=${Date.now()}`);
  const c = await import(`${path.join(LIB, "quran-circles-seed.ts")}?v=${Date.now()}`);
  const m = await import(`${path.join(LIB, "mutashabihat-data.ts")}?v=${Date.now()}`);
  const mm = await import(`${path.join(LIB, "mind-maps-data.ts")}?v=${Date.now()}`);
  const a = await import(`${path.join(LIB, "amr-bil-maruf-seed.ts")}?v=${Date.now()}`);

  const lessons = JSON.parse(
    execSync("node scripts/enrich-r57-lesson-bodies.mjs", { cwd: ROOT, encoding: "utf8" }),
  );

  console.log(
    JSON.stringify(
      {
        lessonSciUnder: lessons.before.scientific.under,
        lessonLiveUnder: lessons.before.live.under,
        pagesShort: countShortPages(),
        nationsShort: countShortNations(),
        updatesShort: u.UPDATES_SEED.filter((x) => (x.summary || "").length < UPDATE_MIN).length,
        circlesShort: c.QURAN_CIRCLES_SEED.filter((x) => !x.description || x.description.length < CIRCLE_MIN).length,
        mutaShort: m.MUTASHABIHAT.filter((x) => (x.description || "").length < MUTA_MIN).length,
        mindShort: mm.MIND_MAPS.filter((x) => !x.description || x.description.length < MIND_MIN).length,
        amrShort: [...a.MAJOR_MUNKARAAT, ...a.MAJOR_MAARUF].filter((x) => x.explanation.length < AMR_MIN).length,
      },
      null,
      2,
    ),
  );
}

main();
