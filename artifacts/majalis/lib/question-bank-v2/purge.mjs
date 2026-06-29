/** @fileoverview حذف بنك الأسئلة القديم من جميع المصادر */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const DATA = join(ROOT, 'data/sin-jeem');
const ARCHIVE = join(DATA, 'archive');

export function purgeLegacyBank({ dryRun = false } = {}) {
  const bankPath = join(DATA, 'questions-bank.json');
  const archivePath = join(ARCHIVE, 'questions-bank-v1-archived.json');
  const seedTsPath = join(ROOT, 'src/lib/sin-jeem/questions-seed.ts');
  const genCachePaths = [
    join(ROOT, 'data/sin-jeem/.generation-cache.json'),
    join(ROOT, 'data/sin-jeem/drafts.json'),
    join(ROOT, 'data/sin-jeem/generated-questions.json'),
  ];

  let deletedCount = 0;
  const actions = [];

  if (existsSync(bankPath)) {
    const bank = JSON.parse(readFileSync(bankPath, 'utf8'));
    deletedCount = Array.isArray(bank) ? bank.length : 0;
    actions.push({ type: 'archive', from: bankPath, to: archivePath, count: deletedCount });
    if (!dryRun) {
      mkdirSync(ARCHIVE, { recursive: true });
      copyFileSync(bankPath, archivePath);
      writeFileSync(bankPath, '[]\n', 'utf8');
    }
  }

  for (const p of genCachePaths) {
    if (existsSync(p)) {
      actions.push({ type: 'delete', path: p });
      if (!dryRun) writeFileSync(p, '[]\n', 'utf8');
    }
  }

  if (existsSync(seedTsPath)) {
    actions.push({ type: 'clear-seed', path: seedTsPath });
    if (!dryRun) {
      writeFileSync(
        seedTsPath,
        `import type { SinJeemQuestion } from "./types";

/** Legacy inline seed — cleared during v2 rebuild. Bank: data/sin-jeem/questions-bank.json */
export const SIN_JEEM_QUESTIONS: SinJeemQuestion[] = [];
`,
        'utf8',
      );
    }
  }

  return { deletedCount, actions, dryRun };
}

/** SQL snippet for Supabase purge (run via migration endpoint) */
export const SUPABASE_PURGE_SQL = `
DELETE FROM sin_jeem_question_audit WHERE question_id IN (SELECT id FROM sin_jeem_questions);
DELETE FROM sin_jeem_ai_generations;
DELETE FROM question_generation_queue;
DELETE FROM sin_jeem_questions;
`;
