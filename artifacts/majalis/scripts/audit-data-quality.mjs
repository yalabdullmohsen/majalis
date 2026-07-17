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

/**
 * فحص تكرار عام: يُطابق حقل نصي واحد (question/text) حرفياً بعد قص المسافات.
 * أُضيف بعد اكتشاف حقيقي (2026-07-18): quiz-seed.ts وfawaid-seed.ts كانا
 * يحويان عشرات الأسئلة/الفوائد المكررة حرفياً بلا أي فحص دائم يكتشفها —
 * أُصلحا يدوياً حينها، وهذا الفحص يمنع تكرار المشكلة صامتاً مستقبلاً.
 *
 * groupKey اختياري: إن مُرِّر (مثل categoryId)، يُقيَّد التكرار بأن يكون
 * ضمن نفس المجموعة فقط. ضروري لـadhkar-seed.ts تحديداً: نفس الذكر يتكرر
 * شرعاً وعمداً عبر تصنيفات مختلفة (مثل "بسم الله" عند الوضوء وعند الطعام
 * كلاهما مسنون فعلاً) — هذا تكرار صحيح لا خطأ، فلا يُحسب إلا لو تكرر نفس
 * النص داخل نفس التصنيف بعينه (تكرار حقيقي زائد).
 */
function auditDuplicates(items, field, typeLabel, groupField) {
  const issues = [];
  const seen = new Map();
  for (const item of items) {
    const key = (item[field] || "").trim();
    if (!key) continue;
    const scopedKey = groupField ? `${item[groupField] ?? ""}::${key}` : key;
    if (seen.has(scopedKey)) {
      issues.push({ type: typeLabel, id: item.id, otherId: seen.get(scopedKey), key: key.slice(0, 80) });
    } else {
      seen.set(scopedKey, item.id);
    }
  }
  return issues;
}

function main() {
  const qa = readTsExport("qa-seed.ts", "SEED_QA");
  const lessons = readTsExport("lessons-seed.ts", "LESSONS_SEED");
  const sheikhs = readTsExport("sheikhs-seed.ts", "SHEIKHS_SEED");
  const quiz = readTsExport("quiz-seed.ts", "DEMO_QUIZ_QUESTIONS");
  const fawaid = readTsExport("fawaid-seed.ts", "SEED_FAWAID");
  const adhkar = readTsExport("adhkar-seed.ts", "ADHKAR_ITEMS");

  const report = {
    at: new Date().toISOString(),
    counts: { qa: qa.length, lessons: lessons.length, sheikhs: sheikhs.length, quiz: quiz.length, fawaid: fawaid.length, adhkar: adhkar.length },
    issues: {
      qa: auditQa(qa),
      lessons: auditLessons(lessons),
      sheikhs: auditSheikhs(sheikhs),
      quiz: auditDuplicates(quiz, "question", "duplicate_quiz_question"),
      fawaid: auditDuplicates(fawaid, "text", "duplicate_fawaid_text"),
      // مُقيَّد بـcategoryId: التكرار عبر تصنيفات مختلفة مقصود شرعاً (راجع تعليق auditDuplicates)
      adhkar: auditDuplicates(adhkar, "text", "duplicate_adhkar_text_same_category", "categoryId"),
    },
  };

  report.summary = {
    totalIssues: Object.values(report.issues).reduce((sum, arr) => sum + arr.length, 0),
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("Data quality audit");
  console.log(`  QA: ${qa.length} (${report.issues.qa.length} issues)`);
  console.log(`  Lessons: ${lessons.length} (${report.issues.lessons.length} issues)`);
  console.log(`  Sheikhs: ${sheikhs.length} (${report.issues.sheikhs.length} issues)`);
  console.log(`  Quiz: ${quiz.length} (${report.issues.quiz.length} duplicates)`);
  console.log(`  Fawaid: ${fawaid.length} (${report.issues.fawaid.length} duplicates)`);
  console.log(`  Adhkar: ${adhkar.length} (${report.issues.adhkar.length} duplicates)`);
  console.log(`  Total issues: ${report.summary.totalIssues}`);
  console.log(`  Report: ${outPath}`);
  process.exitCode = report.summary.totalIssues > 0 ? 1 : 0;
}

main();
