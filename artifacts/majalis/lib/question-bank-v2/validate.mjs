/** @fileoverview التحقق من جودة السؤال — 10 مراحل مراجعة */

import {
  APPROVED_REFERENCE_PREFIXES,
  CATEGORY_SLUGS,
  DIFFICULTY_LEVELS,
  REVIEW_STAGES,
} from './constants.mjs';
import { normalizeArabic } from './normalize.mjs';

const ARABIC_RE = /[\u0600-\u06FF]/;
const MISLEADING = ['ربما', 'قد يكون', 'يُحتمل', 'غالباً', 'أحياناً'];
const WEAK_PHRASES = ['ما هو', 'ما هي', 'اذكر', 'عدّ'];

function hasArabic(text) {
  const s = String(text ?? '').trim();
  if (!s) return false;
  if (/^[\d\s.,+%\-]+$/.test(s)) return true;
  if (/^[A-Za-z0-9\s.,+%\-]+$/.test(s)) return true;
  return ARABIC_RE.test(s);
}

function wordCount(text) {
  return normalizeArabic(text).split(/\s+/).filter(Boolean).length;
}

function checkLinguistic(q) {
  const issues = [];
  if (!hasArabic(q.questionText)) issues.push('نص السؤال ليس عربياً');
  if (wordCount(q.questionText) > 35) issues.push('السؤال طويل جداً');
  if (wordCount(q.questionText) < 3) issues.push('السؤال قصير جداً');
  for (const opt of q.options || []) {
    if (!hasArabic(opt)) issues.push('خيار غير عربي');
  }
  return issues;
}

function checkSharia(q) {
  const issues = [];
  if (!q.evidence?.trim()) issues.push('الدليل مفقود');
  if (!q.reference?.trim()) issues.push('المرجع مفقود');
  if (!q.source?.trim()) issues.push('المصدر مفقود');
  return issues;
}

function checkLogic(q) {
  const issues = [];
  for (const p of MISLEADING) {
    if (normalizeArabic(q.questionText).includes(normalizeArabic(p))) {
      issues.push('صياغة محتملة');
    }
  }
  if (WEAK_PHRASES.some((p) => q.questionText.startsWith(p)) && wordCount(q.questionText) < 6) {
    issues.push('صياغة ركيكة');
  }
  return issues;
}

function checkOptions(q) {
  const issues = [];
  const opts = q.options || [];
  if (opts.length !== 4) issues.push('يجب 4 خيارات');
  const normalized = opts.map(normalizeArabic);
  const unique = new Set(normalized);
  if (unique.size !== 4) issues.push('خيارات مكررة');
  const correct = normalizeArabic(q.correctAnswer);
  if (!normalized.includes(correct)) issues.push('الإجابة الصحيحة ليست ضمن الخيارات');
  const lengths = opts.map((o) => o.length);
  const avg = lengths.reduce((a, b) => a + b, 0) / 4;
  const maxDev = Math.max(...lengths.map((l) => Math.abs(l - avg)));
  if (maxDev > avg * 1.2 && avg > 15) issues.push('الخيارات غير متقاربة في الطول');
  for (const opt of opts) {
    if (opt.includes('؟') || opt.includes('!')) issues.push('خيار يحتوي تلميحاً');
  }
  return issues;
}

function checkReference(q) {
  const ref = q.reference || q.source || '';
  const approved = APPROVED_REFERENCE_PREFIXES.some((p) => ref.includes(p));
  if (!approved && !ref.includes('القرآن') && !ref.includes('حديث') && !ref.includes('كتb') && !ref.includes('كتب')) {
    return ['مرجع غير معتمد'];
  }
  return [];
}

function checkEvidence(q) {
  if (!q.evidence || q.evidence.length < 4) return ['الدليل قصير أو مفقود'];
  return [];
}

function checkNoDispute(q) {
  const t = normalizeArabic(q.questionText + q.explanation);
  if (t.includes('خلاف') && !t.includes('ذكر الخلاف')) return ['خلاف فقهي دون توضيح'];
  return [];
}

function checkNoAmbiguity(q) {
  if (q.questionText.includes(' أو ') && !q.questionText.includes('أي')) {
    return ['غموض في الصياغة'];
  }
  return [];
}

function checkSingleAnswer(q) {
  const correct = normalizeArabic(q.correctAnswer);
  const others = (q.options || [])
    .map(normalizeArabic)
    .filter((o) => o !== correct);
  for (const o of others) {
    if (o === correct) return ['أكثر من إجابة صحيحة'];
  }
  return [];
}

function checkCategoryFit(q) {
  if (!CATEGORY_SLUGS.includes(q.categorySlug)) return ['تصنيف غير معتمد'];
  if (!DIFFICULTY_LEVELS.includes(q.difficulty)) return ['مستوى صعوبة غير معتمد'];
  return [];
}

const STAGE_FNS = {
  linguistic: checkLinguistic,
  sharia: checkSharia,
  logic: checkLogic,
  options: checkOptions,
  reference: checkReference,
  evidence: checkEvidence,
  'no-dispute': checkNoDispute,
  'no-ambiguity': checkNoAmbiguity,
  'single-answer': checkSingleAnswer,
  'category-fit': checkCategoryFit,
};

/**
 * @param {object} q
 * @returns {{ passed: boolean, stages: Record<string, { ok: boolean, issues: string[] }>, issues: string[] }}
 */
export function validateQuestion(q) {
  const stages = {};
  const allIssues = [];

  for (const stage of REVIEW_STAGES) {
    const fn = STAGE_FNS[stage];
    const issues = fn ? fn(q) : [];
    stages[stage] = { ok: issues.length === 0, issues };
    allIssues.push(...issues);
  }

  return {
    passed: allIssues.length === 0,
    stages,
    issues: allIssues,
  };
}

export function validateBank(questions) {
  const results = questions.map((q) => ({ id: q.id, ...validateQuestion(q) }));
  const passed = results.filter((r) => r.passed).length;
  return {
    total: questions.length,
    passed,
    failed: questions.length - passed,
    qualityRate: questions.length ? passed / questions.length : 0,
    results,
  };
}
