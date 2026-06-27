#!/usr/bin/env node
/**
 * Audit QA category assignments — auto-correct misclassified questions.
 * Usage: node scripts/audit-qa-categories.mjs [--fix] [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const logPath = path.resolve(root, "data/qa-category-audit.log.json");

const ANBIYA_RE =
  /(?:من (?:أول|ال)?(?:رسل|نبي|أنبياء)|النبي الذي|إلى قوم (?:عاد|ثمود|لوط)|ابتلعه الحوت|كلمه الله|نوح|إبراهيم|موسى|عيسى|يونس|هود|صالح|لوط|شعيب|ذو الكفل|قصص? (?:الأنبياء|المرسلين)|عليه(?:ه)?\s*السلام)/i;

const SAHABAH_RE =
  /(?:صحاب(?:ي|ة)|رضي الله عن(?:ه|ها|هم)?|الخلفاء الراشد|أبو بكر|عمر بن|عثمان بن|علي بن|أمهات المؤمنين|من (?:أول|ثاني|ثالث|رابع) الخلفاء)/i;

const SLUG_MAP = {
  aqeedah: "العقيدة",
  anbiya: "الأنبياء",
  sahabah: "الصحابة",
  taharah: "الطهارة",
  salah: "الصلاة",
  zakat: "الزكاة",
  sawm: "الصيام",
  hajj: "الحج",
  seerah: "السيرة",
  hadith: "الحديث",
  quran: "علوم القرآن",
  adab: "الآداب",
  adhkar: "الأذكار",
  misc: "متفرقات",
};

function classify(text, currentSlug) {
  if (ANBIYA_RE.test(text)) {
    if (currentSlug !== "anbiya") {
      return { slug: "anbiya", reason: "سؤال عن الأنبياء — لا ينتمي للعقيدة" };
    }
  }
  if (SAHABAH_RE.test(text)) {
    if (currentSlug !== "sahabah" && currentSlug !== "seerah") {
      return { slug: "sahabah", reason: "سؤال عن الصحابة" };
    }
  }
  return null;
}

function extractSeedQuestions() {
  const src = fs.readFileSync(path.join(root, "src/lib/qa-seed.ts"), "utf8");
  const cats = {};
  const catRe = /"id":\s*"(seed-cat-[^"]+)"[\s\S]*?"slug":\s*"([^"]+)"/g;
  let m;
  while ((m = catRe.exec(src))) cats[m[1]] = m[2];

  const items = [];
  const qRe =
    /"id":\s*"(seed-qa-\d+)"[\s\S]*?"question":\s*"((?:\\.|[^"\\])*)"[\s\S]*?"category_id":\s*"(seed-cat-[^"]+)"/g;
  while ((m = qRe.exec(src))) {
    items.push({
      id: m[1],
      question: m[2].replace(/\\"/g, '"'),
      category_id: m[3],
      slug: cats[m[3]] || "misc",
    });
  }
  return items;
}

function main() {
  const fix = process.argv.includes("--fix");
  const jsonOut = process.argv.includes("--json");
  const items = extractSeedQuestions();
  const corrections = [];
  const counts = {};

  for (const item of items) {
    counts[item.slug] = (counts[item.slug] || 0) + 1;
    const result = classify(item.question, item.slug);
    if (result) {
      corrections.push({
        id: item.id,
        question: item.question.slice(0, 80),
        from: item.slug,
        to: result.slug,
        reason: result.reason,
      });
    }
  }

  const report = {
    at: new Date().toISOString(),
    total: items.length,
    byCategory: counts,
    misclassified: corrections.length,
    corrections,
  };

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(report, null, 2));

  if (jsonOut) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`QA audit: ${items.length} questions, ${corrections.length} misclassified`);
  for (const [slug, n] of Object.entries(counts).sort()) {
    console.log(`  ${SLUG_MAP[slug] || slug}: ${n}`);
  }
  if (corrections.length) {
    console.log("\nMisclassified:");
    for (const c of corrections.slice(0, 20)) {
      console.log(`  [${c.from} → ${c.to}] ${c.question}`);
    }
    if (corrections.length > 20) console.log(`  ... and ${corrections.length - 20} more`);
  }
  console.log(`\nLog: ${logPath}`);
  if (fix) console.log("Note: --fix for Supabase requires service role; seed fixed via generate-content-seed.mjs");
}

main();
