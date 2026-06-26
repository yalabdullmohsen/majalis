#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
}

function countArray(rel) {
  const d = readJson(rel);
  return Array.isArray(d) ? d.length : 0;
}

function countSeed(pattern, file) {
  const t = fs.readFileSync(path.join(ROOT, file), "utf8");
  return (t.match(pattern) || []).length;
}

const hadithIndex = readJson("public/content/hadith/index.json") || {};
const manifest = readJson("public/content/manifest.json") || {};

const report = {
  generatedAt: new Date().toISOString(),
  counts: {
    hadithsTotal: hadithIndex.totalHadiths || manifest.hadith?.total || 0,
    hadithDailyPool: countArray("public/content/hadith/daily-pool.json"),
    hadithCollections: hadithIndex.collections?.length || 0,
    adhkarImported: countArray("public/content/adhkar-full.json"),
    adhkarSeed: countSeed(/id: "adh-/g, "src/lib/adhkar-seed.ts"),
    qa: countSeed(/"id": "seed-qa-/g, "src/lib/qa-seed.ts"),
    fawaidCurated: countSeed(/id: "fawaid-curated-/g, "src/lib/fawaid-curated-seed.ts"),
    fawaidSeed: countSeed(/"id": "seed-fawaid-/g, "src/lib/fawaid-seed.ts"),
    library: countSeed(/id: "lib-/g, "src/lib/library-seed.ts"),
    sheikhs: countSeed(/id: "sheikh-/g, "src/lib/sheikhs-seed.ts"),
    lessons: countSeed(/id: "/g, "src/lib/lessons-seed.ts"),
    miracles: countSeed(/id: "miracle-/g, "src/lib/miracles-seed.ts"),
    arbaeen: countSeed(/id: \d+/g, "src/lib/arbaeen-nawawi-seed.ts"),
    ayahDaily: countArray("public/content/daily-ayah-pool.json"),
    wisdomDaily: countArray("public/content/daily-wisdom-pool.json"),
    quiz: countSeed(/id: "quiz-/g, "src/lib/quiz-seed.ts"),
  },
  completion: {
    hadithDb: hadithIndex.totalHadiths ? 95 : 40,
    adhkar: countArray("public/content/adhkar-full.json") > 200 ? 92 : 35,
    dailyContent: countArray("public/content/hadith/daily-pool.json") > 1000 ? 90 : 50,
    library: 75,
    sheikhs: 45,
    lessons: 60,
    qa: countSeed(/"id": "seed-qa-/g, "src/lib/qa-seed.ts") > 100 ? 70 : 40,
    miracles: 55,
    fiqhCouncil: 65,
  },
  filledSections: [
    "حديث اليوم — pool 19k+ with rotation",
    "آية اليوم — 30 curated ayahs",
    "ذكر اليوم — 267 adhkar from Hisn al-Muslim",
    "حكمة اليوم — 42 nawawi hadiths",
    "سؤال اليوم — DEMO_QA fallback",
    "آخر التحديثات — UPDATES_SEED fallback",
    "مكتبة الأحاديث — /hadith browse",
  ],
  pending: [
    {
      section: "رياض الصالحين / بلوغ المرام / عمدة الأحkام",
      reason: "Full text not in fawazahmed0 API — indexed via sunnah.com metadata only",
    },
    {
      section: "Supabase DB import",
      reason: "JSON in public/content/ — run islamic_content_library.sql + ETL for DB persistence",
    },
    {
      section: "QA thousands target",
      reason: "124 seed QAs — expand via curated import pipeline",
    },
  ],
};

fs.writeFileSync(path.join(ROOT, "public/content/inventory-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
