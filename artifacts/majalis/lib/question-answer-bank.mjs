/**
 * Server-side question bank loader for سؤال وجواب (Sin Jeem engine).
 * Single source of truth for seed + API fallback when Supabase is empty.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORY_SEED } from "./sin-jeem-seed.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BANK_PATH = join(ROOT, "data/sin-jeem/questions-bank.json");

const PLACEHOLDER_RE = /^(test|e2e|mock|placeholder|lorem|xxx)/i;

let _cache = null;

export function loadQuestionBankFromDisk() {
  if (_cache) return _cache;
  _cache = JSON.parse(readFileSync(BANK_PATH, "utf8"));
  return _cache;
}

export function isValidProductionQuestion(q) {
  if (!q?.question?.trim()) return false;
  if (PLACEHOLDER_RE.test(q.question.trim())) return false;
  if (/^test/i.test(q.id || "")) return false;
  return true;
}

export function getProductionQuestionBank() {
  return loadQuestionBankFromDisk().filter(isValidProductionQuestion);
}

export function getCategorySeedList() {
  return CATEGORY_SEED;
}

export function getBankAudit() {
  const bank = loadQuestionBankFromDisk();
  const production = getProductionQuestionBank();
  const slugs = new Set(CATEGORY_SEED.map((c) => c.slug));
  const categoriesInBank = new Set(production.map((q) => q.category_slug).filter(Boolean));
  return {
    bankPath: BANK_PATH,
    totalInFile: bank.length,
    productionReady: production.length,
    categoriesInSeed: CATEGORY_SEED.length,
    categoriesUsedInBank: categoriesInBank.size,
    invalidCategoryRefs: production.filter((q) => q.category_slug && !slugs.has(q.category_slug)).length,
  };
}
