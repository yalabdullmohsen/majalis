#!/usr/bin/env node
/**
 * استخراج النصوص المنسوبة للنبي ﷺ من الملفات المملوكة — المرحلة 3.
 * يستبعد مفاتيح JSON اللاتينية وأسئال السيرة التي تذكر النبي دون نقل متن.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "src/lib/qa-seed.ts",
  "src/lib/quiz-seed.ts",
  "src/lib/fiqh-issues-seed.ts",
  "src/lib/fawaid-seed.ts",
  "src/lib/fawaid-curated-seed.ts",
  "src/lib/asma-husna-data.ts",
  "src/lib/islamic-stories-seed.ts",
  "src/lib/miracles-seed.ts",
  "src/lib/rulings-encyclopedia-seed.generated.ts",
  "src/lib/adhkar-seed.ts",
  "src/lib/arbaeen-nawawi-seed.ts",
  "src/lib/prophetic-medicine-seed.ts",
  "data/rulings-encyclopedia/curriculum-topics.json",
];

/** متن منقول أو نسبة صريحة لقول */
const SAYING =
  /(?:قال\s*(?:رسول\s*الله|النبي)|لقوله\s*ﷺ|قوله\s*ﷺ|ﷺ\s*[:：]\s*[«"(]|[«"][^»"]{6,}[»"]\s*—\s*(?:رواه|متفق)|«[^»]{8,}»)/;

const rows = [];

for (const rel of FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const src = fs.readFileSync(abs, "utf8");
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!SAYING.test(line) && !(line.includes("ﷺ") && /[«(]/.test(line))) {
      continue;
    }
    // استبعاد الأسئلة التاريخية عن النبي بلا متن
    if (
      /"(?:question|title)"\s*:/.test(line) &&
      !/[«"][^»"]{8,}[»"]/.test(line.replace(/"(?:question|title|id|category)":\s*"[^"]*"/, ""))
    ) {
      // keep if has quote marks for matn after removing key
      const vals = [...line.matchAll(/:\s*"((?:\\.|[^"\\])*)"/g)].map((m) => m[1]);
      const hasMatn = vals.some(
        (v) =>
          (v.includes("ﷺ") || /قال\s*(?:رسول|النبي)/.test(v)) &&
          (/[«(]/.test(v) || /لقوله/.test(v)),
      );
      if (!hasMatn) continue;
    }

    const snippet = line.trim().slice(0, 240);

    // كشف لاتيني داخل متن عربي بين «» أو () بعد ﷺ — لا تُحتسب مفاتيح JSON
    const arabicQuotes = [
      ...line.matchAll(/«([^»]{5,})»/g),
      ...line.matchAll(/\(\s*([^)]{5,})\s*\)/g),
    ].map((m) => m[1]);
    const flags = [];
    for (const q of arabicQuotes) {
      if (/[A-Za-z]{3,}/.test(q) && /[\u0600-\u06FF]/.test(q)) {
        flags.push("SUSPECT_TEXT");
        break;
      }
    }

    const hasWork =
      /(?:البخاري|مسلم|الترمذي|النسائي|أبو داود|ابن ماجه|موطأ|مسند أحمد|صحيح|سنن)/.test(
        line,
      );
    const hasNumber = /(?:رقم\s*)?(?:\d{2,5}|[٠-٩]{2,5})/.test(line);
    const hasGradeWord =
      /(?:صححه|حسّنه|ضعّفه|صحيح(?:ه)?|حسن|ضعيف|موضوع)/.test(line);
    const hasGrader =
      /(?:الألباني|الذهبي|ابن حجر|النووي|الحاكم)/.test(line) ||
      (hasGradeWord && /(?:الترمذي|البخاري|مسلم)/.test(line));

    let classification;
    let missing = [];
    let trust;

    if (flags.includes("SUSPECT_TEXT")) {
      classification = "SUSPECT_TEXT";
      trust = "unsourced";
      missing = ["human_matn_review"];
    } else if (hasWork && hasNumber && hasGradeWord && hasGrader) {
      classification = "complete_in_repo";
      trust = "primary_text";
    } else if (hasWork && hasNumber) {
      classification = "incomplete";
      if (!hasGradeWord) missing.push("grade");
      if (!hasGrader) missing.push("grader");
      trust = "scholarly_source";
    } else if (hasWork) {
      classification = "incomplete";
      missing = ["number"];
      if (!hasGradeWord) missing.push("grade");
      if (!hasGrader) missing.push("grader");
      trust = "general_reasoning";
    } else {
      classification = "NEEDS_HUMAN";
      missing = ["work", "number", "grade", "grader"];
      trust = "unsourced";
    }

    // ضعف/وضع معروض استدلالاً → بوابة blocked (لا تصحيح متن)
    const weakAsProof =
      /(?:ضعيف|موضوع)/.test(line) &&
      /(?:لقوله|دليله|استدلال|لحديث|لِقوله)/.test(line);

    rows.push({
      file: rel,
      line: i + 1,
      snippet,
      classification,
      missing,
      trust_level_suggested: trust,
      text_flags: flags,
      verified_from:
        classification === "complete_in_repo"
          ? `repo:${rel}:${i + 1}`
          : "NEEDS_HUMAN",
      publication_gate:
        flags.includes("SUSPECT_TEXT") || weakAsProof ? "blocked" : "open",
    });
  }
}

fs.writeFileSync("/tmp/hadith-audit.json", JSON.stringify(rows, null, 2));
const by = rows.reduce((a, r) => {
  a[r.classification] = (a[r.classification] || 0) + 1;
  return a;
}, {});
console.log(
  JSON.stringify(
    {
      total: rows.length,
      by,
      suspect: rows.filter((r) => r.classification === "SUSPECT_TEXT").length,
      blocked: rows.filter((r) => r.publication_gate === "blocked").length,
    },
    null,
    2,
  ),
);
