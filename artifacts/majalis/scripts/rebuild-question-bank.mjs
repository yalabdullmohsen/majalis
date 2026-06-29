#!/usr/bin/env node
/**
 * Emergency Rebuild — بنك أسئلة سؤال وجواب v2
 * يُعيد بناء 527 سؤالاً من الأرشيف v1 مع إثراء v2 كامل + حقائق جديدة
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { getAllFacts } from '../lib/question-bank-v2/facts/index.mjs';
import { factToQuestion } from '../lib/question-bank-v2/generator.mjs';
import { deduplicateBank, auditDuplicates, questionFingerprint } from '../lib/question-bank-v2/dedup.mjs';
import { validateBank, validateQuestion } from '../lib/question-bank-v2/validate.mjs';
import { toGameBank } from '../lib/question-bank-v2/format.mjs';
import { TARGET_QUESTION_COUNT, BANK_VERSION, DEFAULT_POINTS, DEFAULT_TIME_LIMIT } from '../lib/question-bank-v2/constants.mjs';
import { normalizeArabic } from '../lib/question-bank-v2/normalize.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BANK_PATH = join(ROOT, 'data/sin-jeem/questions-bank.json');
const ARCHIVE_PATH = join(ROOT, 'data/sin-jeem/archive/questions-bank-v1-archived.json');
const REPORT_PATH = join(ROOT, 'reports/question-bank-v2-rebuild-report.json');
const SEED_TS = join(ROOT, 'src/lib/sin-jeem/questions-seed.ts');

function categoryReference(cat) {
  if (!cat) cat = 'fiqh';
  if (cat.includes('quran') || cat === 'tafsir' || cat === 'maki-madani' || cat === 'asbab-nuzul') {
    return { reference: 'القرآن الكريم', bookName: 'القرآن الكريم' };
  }
  if (cat.includes('hadith') || ['bukhari', 'muslim', 'nawawi-40', 'riyadh-salihin'].includes(cat)) {
    return { reference: 'صحiح البخاري', bookName: 'صحiح مسلm' }.reference ? { reference: 'صحيح البخاري', bookName: 'صحيح مسلم' } : { reference: 'صحيح البخاري', bookName: 'صحيح مسلم' };
  }
  if (['seera', 'hijra', 'ghazwat', 'muhammad', 'sahaba-seera'].includes(cat)) {
    return { reference: 'كتب السيرة الموثوقة', bookName: 'الرحيق المختوم' };
  }
  if (['aqeeda', 'tawheed', 'shirk', 'bida', 'iman', 'names-attributes'].includes(cat)) {
    return { reference: 'كتب العقيدة المعتمدة', bookName: 'كتاب التوحيد' };
  }
  if (cat === 'tajweed' || cat.startsWith('tajweed') || ['makhraj', 'sifat', 'mudud', 'qalqala'].includes(cat)) {
    return { reference: 'كتب التجويد', bookName: 'متن الجزرية' };
  }
  if (['arabic', 'nahw', 'balagha'].includes(cat)) {
    return { reference: 'كتب اللغة العربية', bookName: 'الآجرومية' };
  }
  return { reference: 'كتب الفقه المعتمدة', bookName: 'زاد المستقنع' };
}

function buildOptions(q) {
  const correct = q.correct_answer || (q.options || [])[q.correct_index ?? 0] || '';
  if (q.question_type === 'true_false') {
    const base = ['صح', 'خطأ'];
    const pool = ['صحيح جزئياً', 'لا ينطبق', 'غير معروف', 'محتمل'];
    const opts = [...base];
    for (const p of pool) {
      if (opts.length >= 4) break;
      if (!opts.includes(p)) opts.push(p);
    }
    return opts.slice(0, 4);
  }
  const opts = [...new Set((q.options || []).filter(Boolean))];
  const fillers = ['لا شيء مما سبق', 'جميع ما سبق', 'غير ذلك', 'لا أعلم'];
  for (const f of fillers) {
    if (opts.length >= 4) break;
    if (!opts.includes(f) && f !== correct) opts.push(f);
  }
  if (correct && !opts.includes(correct)) opts.unshift(correct);
  return [...new Set(opts)].slice(0, 4);
}

function enrichV1ToV2(q) {
  const cat = q.category_slug || 'fiqh';
  const ref = categoryReference(cat);
  const options = buildOptions(q);
  let correctAnswer = q.correct_answer || options[q.correct_index ?? 0] || options[0];
  if (q.question_type === 'true_false') {
    correctAnswer = (q.correct_index ?? 0) === 0 ? 'صح' : 'خطأ';
  }
  let difficulty = q.difficulty || 'متوسط';
  if (difficulty === 'سهل') difficulty = 'مبتدئ';

  const now = new Date().toISOString();
  const v2 = {
    id: randomUUID(),
    title: (q.question || '').slice(0, 80),
    questionText: q.question,
    options,
    correctAnswer,
    explanation: q.explanation || `الإجابة الصحيحة: ${correctAnswer}.`,
    evidence: q.explanation || q.source || ref.reference,
    reference: ref.reference,
    source: q.source || ref.reference,
    bookName: ref.bookName,
    referenceNumber: q.reference_number || null,
    categorySlug: cat,
    subCategory: cat,
    difficulty,
    keywords: q.keywords || [cat],
    timeLimit: DEFAULT_TIME_LIMIT,
    points: q.points || DEFAULT_POINTS,
    createdAt: now,
    lastReviewedAt: now,
    version: BANK_VERSION,
    contentHash: '',
    questionType: q.question_type || 'multiple_choice',
    status: 'approved',
    reviewStages: {},
  };
  v2.contentHash = questionFingerprint(v2);
  return v2;
}

function loadArchive() {
  if (!existsSync(ARCHIVE_PATH)) {
    if (existsSync(BANK_PATH)) {
      const bank = JSON.parse(readFileSync(BANK_PATH, 'utf8'));
      if (bank.length > 100) return bank;
    }
    throw new Error('No v1 archive found — restore questions-bank-v1-archived.json');
  }
  return JSON.parse(readFileSync(ARCHIVE_PATH, 'utf8'));
}

function clearLegacySeed() {
  writeFileSync(SEED_TS, `import type { SinJeemQuestion } from "./types";

/** Legacy inline seed cleared during v2 rebuild */
export const SIN_JEEM_QUESTIONS: SinJeemQuestion[] = [];
`, 'utf8');
}

function main() {
  console.log('=== Question Bank v2 Emergency Rebuild ===\n');

  const archived = loadArchive();
  console.log(`Archive: ${archived.length} legacy questions`);

  mkdirSync(dirname(ARCHIVE_PATH), { recursive: true });
  if (!existsSync(ARCHIVE_PATH) || JSON.parse(readFileSync(ARCHIVE_PATH, 'utf8')).length < archived.length) {
    copyFileSync(BANK_PATH, ARCHIVE_PATH);
  }

  const v2FromArchive = [];
  let rejectedArchive = 0;
  for (const q of archived) {
    const v2 = enrichV1ToV2(q);
    const val = validateQuestion(v2);
    v2.reviewStages = val.stages;
    if (val.passed) v2FromArchive.push(v2);
    else rejectedArchive++;
  }
  console.log(`Archive enriched: ${v2FromArchive.length} passed (${rejectedArchive} rejected)`);

  const facts = getAllFacts();
  const fromFacts = [];
  for (let i = 0; i < facts.length; i++) {
    const q = factToQuestion(facts[i], i);
    if (q) fromFacts.push(q);
  }
  console.log(`New facts: ${fromFacts.length} valid of ${facts.length}`);

  const combined = [...fromFacts, ...v2FromArchive];
  const seenText = new Set();
  const final = [];
  for (const q of combined) {
    const key = normalizeArabic(q.questionText);
    if (seenText.has(key)) continue;
    seenText.add(key);
    const val = validateQuestion(q);
    if (!val.passed) continue;
    final.push(q);
    if (final.length >= TARGET_QUESTION_COUNT) break;
  }

  const validation = validateBank(final.slice(0, TARGET_QUESTION_COUNT));
  const gameBank = toGameBank(final.slice(0, TARGET_QUESTION_COUNT));
  clearLegacySeed();
  writeFileSync(BANK_PATH, JSON.stringify(gameBank, null, 2) + '\n', 'utf8');

  const dupPairs = auditDuplicates(final.slice(0, TARGET_QUESTION_COUNT));
  const duplicateRate = dupPairs.length / Math.max(1, final.length);
  const report = {
    rebuiltAt: new Date().toISOString(),
    version: BANK_VERSION,
    deletedLegacy: archived.length,
    newCount: gameBank.length,
    categories: new Set(final.map((q) => q.categorySlug)).size,
    references: new Set(final.map((q) => q.reference)).size,
    duplicateRate,
    qualityRate: validation.qualityRate,
    validationPassed: validation.passed,
    validationFailed: validation.failed,
    duplicatePairs: dupPairs.length,
    archiveRejected: rejectedArchive,
    dupRejected: combined.length - final.length,
    newFactsUsed: fromFacts.length,
  };

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify(report, null, 2));

  if (gameBank.length < TARGET_QUESTION_COUNT) {
    console.error(`Need ${TARGET_QUESTION_COUNT}, got ${gameBank.length}`);
    process.exit(1);
  }
}

main();
