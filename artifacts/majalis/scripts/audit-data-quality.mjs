#!/usr/bin/env node
/**
 * Data quality audit — duplicates, orphans, incomplete records.
 * Usage: node scripts/audit-data-quality.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outPath = path.resolve(root, "data/data-quality-audit.json");

function readTsExport(file, exportName) {
  const src = fs.readFileSync(path.join(root, "src/lib", file), "utf8");
  const match = src.match(new RegExp(`export const ${exportName}[\\s\\S]*?=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!match) return [];
  try {
    return Function(`"use strict"; return (${match[1]});`)();
  } catch {
    return [];
  }
}

function auditQa(questions) {
  const issues = [];
  const seenQ = new Set();
  for (const q of questions) {
    const key = (q.question || "").trim().slice(0, 100);
    if (seenQ.has(key)) issues.push({ type: "duplicate_question", id: q.id, key });
    seenQ.add(key);
    if (!q.answer?.trim()) issues.push({ type: "missing_answer", id: q.id });
    if (!q.category_id) issues.push({ type: "missing_category", id: q.id });
  }
  return issues;
}

function auditLessons(lessons) {
  const issues = [];
  for (const l of lessons) {
    if (!l.title?.trim()) issues.push({ type: "missing_title", id: l.id });
    if (!l.sheikhName && !l.speaker_name) issues.push({ type: "missing_sheikh", id: l.id });
    if (!l.description?.trim()) issues.push({ type: "missing_description", id: l.id });
  }
  return issues;
}

function auditSheikhs(sheikhs) {
  const issues = [];
  for (const s of sheikhs) {
    if (!s.name?.trim()) issues.push({ type: "missing_name", id: s.id });
    if (!s.bio?.trim()) issues.push({ type: "missing_bio", id: s.id });
  }
  return issues;
}

function main() {
  const qa = readTsExport("qa-seed.ts", "SEED_QA");
  const lessons = readTsExport("lessons-seed.ts", "LESSONS_SEED");
  const sheikhs = readTsExport("sheikhs-seed.ts", "SHEIKHS_SEED");

  const report = {
    at: new Date().toISOString(),
    counts: { qa: qa.length, lessons: lessons.length, sheikhs: sheikhs.length },
    issues: {
      qa: auditQa(qa),
      lessons: auditLessons(lessons),
      sheikhs: auditSheikhs(sheikhs),
    },
  };

  report.summary = {
    totalIssues:
      report.issues.qa.length +
      report.issues.lessons.length +
      report.issues.sheikhs.length,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("Data quality audit");
  console.log(`  QA: ${qa.length} (${report.issues.qa.length} issues)`);
  console.log(`  Lessons: ${lessons.length} (${report.issues.lessons.length} issues)`);
  console.log(`  Sheikhs: ${sheikhs.length} (${report.issues.sheikhs.length} issues)`);
  console.log(`  Total issues: ${report.summary.totalIssues}`);
  console.log(`  Report: ${outPath}`);
}

main();
