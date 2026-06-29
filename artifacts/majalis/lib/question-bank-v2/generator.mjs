/** @fileoverview بناء سؤال v2 من حقيقة موثقة */

import { randomUUID } from 'node:crypto';
import {
  BANK_VERSION,
  DEFAULT_POINTS,
  DEFAULT_TIME_LIMIT,
} from './constants.mjs';
import { questionFingerprint } from './dedup.mjs';
import { validateQuestion } from './validate.mjs';

const NOW = new Date().toISOString();

/**
 * @typedef {object} VerifiedFact
 * @property {string} title
 * @property {string} questionText
 * @property {string} correctAnswer
 * @property {string[]} distractors — 3 خيارات خاطئة
 * @property {string} explanation
 * @property {string} evidence
 * @property {string} reference
 * @property {string} source
 * @property {string} bookName
 * @property {string} [referenceNumber]
 * @property {string} categorySlug
 * @property {string} subCategory
 * @property {'مبتدئ'|'متوسط'|'متقدم'|'خبير'} difficulty
 * @property {string[]} keywords
 */

function shuffle(arr, seed = Math.random()) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {VerifiedFact} fact
 * @param {number} [index]
 * @returns {object|null}
 */
export function factToQuestion(fact, index = 0) {
  const options = shuffle([
    fact.correctAnswer,
    ...fact.distractors.slice(0, 3),
  ], index * 0.137);

  const q = {
    id: randomUUID(),
    title: fact.title,
    questionText: fact.questionText,
    options,
    correctAnswer: fact.correctAnswer,
    explanation: fact.explanation,
    evidence: fact.evidence,
    reference: fact.reference,
    source: fact.source,
    bookName: fact.bookName,
    referenceNumber: fact.referenceNumber || null,
    categorySlug: fact.categorySlug,
    subCategory: fact.subCategory,
    difficulty: fact.difficulty,
    keywords: fact.keywords || [],
    timeLimit: DEFAULT_TIME_LIMIT,
    points: DEFAULT_POINTS,
    createdAt: NOW,
    lastReviewedAt: NOW,
    version: BANK_VERSION,
    contentHash: '',
    status: 'approved',
    reviewStages: {},
  };

  q.contentHash = questionFingerprint(q);
  const validation = validateQuestion(q);
  q.reviewStages = validation.stages;

  if (!validation.passed) return null;
  return q;
}

/**
 * @param {VerifiedFact[]} facts
 * @returns {{ questions: object[], rejected: object[] }}
 */
export function generateFromFacts(facts) {
  const questions = [];
  const rejected = [];

  facts.forEach((fact, i) => {
    const q = factToQuestion(fact, i);
    if (q) {
      questions.push(q);
    } else {
      rejected.push({ fact, reason: 'validation-failed' });
    }
  });

  return { questions, rejected };
}
