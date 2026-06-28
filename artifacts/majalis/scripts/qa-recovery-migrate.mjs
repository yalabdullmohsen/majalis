#!/usr/bin/env node
/**
 * Recover quiz questions into qa_questions from CSV import sources.
 * The 503 deleted fawaid rows cannot be restored from DB — this script uses
 * repo CSV/seed sources and reports honestly what is recoverable.
 *
 * Usage:
 *   node scripts/qa-recovery-migrate.mjs              # dry-run
 *   node scripts/qa-recovery-migrate.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";
import { migrateQuizRowToQa, emptyQaMigrationReport } from "../lib/production/qa-migration.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apply = process.argv.includes("--apply");

const CSV_SOURCES = [
  { path: path.join(root, "data/quiz_questions.csv"), source_type: "quiz_csv" },
  { path: path.resolve(root, "../../quiz_questions.csv"), source_type: "quiz_csv_root" },
];

function parseCsv(text, sourcePath) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = [];
    let cur = "";
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { parts.push(cur); cur = ""; continue; }
      cur += ch;
    }
    parts.push(cur);
    if (parts.length < 5) continue;
    const [section, category, level, question, answer] = parts.map((p) => p.trim());
    rows.push({
      section, category, level, question, answer,
      _source: sourcePath,
      _line: i + 1,
      source_type: "quiz_csv",
      source_ref: `${path.basename(sourcePath)}:${i + 1}`,
    });
  }
  return rows;
}

function loadQuizFromGenerator() {
  const genPath = path.join(root, "scripts/generate-quiz-questions.mjs");
  if (!fs.existsSync(genPath)) return [];
  const src = fs.readFileSync(genPath, "utf8");
  const re = /\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g;
  const rows = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    rows.push({
      section: m[1], category: m[2], level: m[3], question: m[4], answer: m[5],
      _source: genPath,
      source_type: "quiz_generator",
      source_ref: `generate-quiz-questions.mjs:${rows.length + 1}`,
    });
  }
  return rows;
}

async function main() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("✗ Supabase admin required");
    process.exit(1);
  }

  const report = {
    dryRun: !apply,
    importBatchId: `qa-recovery-${new Date().toISOString().slice(0, 10)}`,
    sources: [],
    qaMigration: emptyQaMigrationReport(),
    deletedFawaidRecovery: {
      note: "503 fawaid rows were already deleted from production DB and cannot be restored from DB alone.",
      recoverableFromRepo: 0,
      unrecoverableEstimate: 503,
    },
  };

  const allRows = [];
  const seenQuestions = new Set();

  for (const { path: csvPath, source_type } of CSV_SOURCES) {
    if (!fs.existsSync(csvPath)) {
      report.sources.push({ path: csvPath, status: "missing" });
      continue;
    }
    const parsed = parseCsv(fs.readFileSync(csvPath, "utf8"), csvPath);
    report.sources.push({ path: csvPath, status: "loaded", rows: parsed.length });
    for (const row of parsed) {
      row.source_type = source_type;
      const key = row.question;
      if (!seenQuestions.has(key)) {
        seenQuestions.add(key);
        allRows.push(row);
      }
    }
  }

  const generated = loadQuizFromGenerator();
  report.sources.push({ path: "generate-quiz-questions.mjs", status: "loaded", rows: generated.length });
  for (const row of generated) {
    if (!seenQuestions.has(row.question)) {
      seenQuestions.add(row.question);
      allRows.push(row);
    }
  }

  report.deletedFawaidRecovery.recoverableFromRepo = allRows.length;
  report.deletedFawaidRecovery.unrecoverableEstimate = Math.max(0, 503 - allRows.length);

  if (!apply) {
    console.log("=== QA Recovery (DRY RUN) ===");
    console.log(JSON.stringify({ ...report, candidateRows: allRows.length }, null, 2));
    console.log("\nRe-run with --apply to insert into qa_questions.");
    return;
  }

  for (const row of allRows) {
    await migrateQuizRowToQa(admin, row, {
      report: report.qaMigration,
      importBatchId: report.importBatchId,
    });
  }

  report.ok = (report.qaMigration.errors?.length || 0) === 0;
  console.log("=== QA Recovery (APPLY) ===");
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
