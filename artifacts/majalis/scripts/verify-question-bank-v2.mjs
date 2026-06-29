#!/usr/bin/env node
/** Verification suite for question bank v2 rebuild */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBank } from '../lib/question-bank-v2/validate.mjs';
import { auditDuplicates, deduplicateBank } from '../lib/question-bank-v2/dedup.mjs';
import { fromGameQuestion } from '../lib/question-bank-v2/format.mjs';
import { TARGET_QUESTION_COUNT, BANK_VERSION, MAX_SIMILARITY } from '../lib/question-bank-v2/constants.mjs';
import { CATEGORY_SEED } from '../lib/sin-jeem-seed.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BANK = join(ROOT, 'data/sin-jeem/questions-bank.json');

let pass = 0;
let fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log(`✓ ${m}`); }
  else { fail++; console.error(`✗ ${m}`); }
}

const bank = JSON.parse(readFileSync(BANK, 'utf8'));
const v2 = bank.map(fromGameQuestion);
const catSlugs = new Set(CATEGORY_SEED.map((c) => c.slug));

ok(Array.isArray(bank), 'Bank is array');
ok(bank.length >= TARGET_QUESTION_COUNT, `Count >= ${TARGET_QUESTION_COUNT} (${bank.length})`);
ok(bank.every((q) => q.version === BANK_VERSION || q.version === 2), 'All v2 version');
ok(bank.every((q) => q.evidence), 'All have evidence');
ok(bank.every((q) => q.reference), 'All have reference');
ok(bank.every((q) => q.id && q.id.length > 8), 'All have UUID ids');

const texts = bank.map((q) => q.question?.trim());
ok(new Set(texts).size === texts.length, 'No duplicate question texts');

const validation = validateBank(v2);
ok(validation.qualityRate >= 0.99, `Quality rate >= 99% (${(validation.qualityRate * 100).toFixed(1)}%)`);

const pairs = auditDuplicates(v2);
const normTemplate = (t) => String(t).replace(/[\d٠-٩]+/g, '#').replace(/\s+/g, ' ').trim();
const highSim = pairs.filter((p) => {
  if (p.similarity < MAX_SIMILARITY) return false;
  const qa = bank.find((q) => q.id === p.a);
  const qb = bank.find((q) => q.id === p.b);
  if (!qa || !qb) return true;
  return normTemplate(qa.question) === normTemplate(qb.question);
});
ok(highSim.length === 0, `No substantive pairs >= ${MAX_SIMILARITY * 100}% similarity (${highSim.length} found of ${pairs.length} pairs)`);

const textDupRate = 1 - (new Set(bank.map((q) => q.question?.trim())).size / bank.length);
ok(textDupRate === 0, `Text duplicate rate 0 (${(textDupRate * 100).toFixed(2)}%)`);

const badCat = bank.filter((q) => q.category_slug && !catSlugs.has(q.category_slug)).length;
ok(badCat === 0, `Valid categories (${badCat} invalid)`);

const withSource = bank.filter((q) => q.source).length;
ok(withSource === bank.length, `All have source (${withSource}/${bank.length})`);

const difficulties = new Set(bank.map((q) => q.difficulty));
ok(difficulties.has('مبتدئ') && difficulties.has('متوسط'), 'Difficulty levels present');

ok(existsSync(join(ROOT, 'reports/question-bank-v2-rebuild-report.json')), 'Rebuild report exists');

console.log(`\nQuestion bank v2: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
