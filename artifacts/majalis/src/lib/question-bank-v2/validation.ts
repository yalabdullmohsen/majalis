import type { QuestionBankItem } from "./types";

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

const ARABIC_RE = /[\u0600-\u06FF]/;
const PLACEHOLDER_RE = /^(test|e2e|mock|placeholder|xxx|lorem|تجرب|تجريب)/i;
const AMBIGUOUS_RE = /(\?\?|؟؟|\.\.\.|ربما|قد ي|maybe|perhaps)/i;

export function validateQuestionStructure(q: Partial<QuestionBankItem>): ValidationResult {
  const errors: string[] = [];

  if (!q.question?.trim()) errors.push("missing_question");
  else {
    if (!ARABIC_RE.test(q.question)) errors.push("not_arabic");
    if (q.question.length < 12) errors.push("too_short");
    if (q.question.length > 400) errors.push("too_long");
    if (PLACEHOLDER_RE.test(q.question)) errors.push("test_demo");
    if (AMBIGUOUS_RE.test(q.question)) errors.push("ambiguous");
  }

  const opts = q.options;
  if (!Array.isArray(opts) || opts.length !== 4) {
    errors.push("requires_four_options");
  } else {
    const trimmed = opts.map((o) => String(o).trim());
    if (trimmed.some((o) => !o || o.length < 1)) errors.push("empty_option");
    if (new Set(trimmed).size < 4) errors.push("duplicate_options");
    if (trimmed.some((o) => o.length > 120)) errors.push("option_too_long");
  }

  const ci = q.correct_index;
  if (ci == null || ci < 0 || ci > 3) errors.push("invalid_correct_index");

  if (!q.explanation?.trim()) errors.push("missing_explanation");
  if (!q.source?.trim()) errors.push("missing_source");
  if (!q.category_slug?.trim()) errors.push("missing_category");
  if (!q.difficulty) errors.push("missing_difficulty");

  return errors.length ? { ok: false, errors } : { ok: true };
}

export function validateForPublish(q: QuestionBankItem): ValidationResult {
  const base = validateQuestionStructure(q);
  if (!base.ok) return base;

  const errors: string[] = [];
  if (q.workflow_stage !== "published" && q.status !== "published") {
    errors.push("workflow_not_complete");
  }
  if (!q.content_hash) errors.push("missing_content_hash");

  return errors.length ? { ok: false, errors } : { ok: true };
}

export function canAdvanceWorkflow(from: QuestionBankItem["workflow_stage"], to: QuestionBankItem["workflow_stage"]): boolean {
  const order = ["author", "linguistic_review", "sharia_review", "final_approval", "published"];
  const fi = order.indexOf(from);
  const ti = order.indexOf(to);
  return ti === fi + 1;
}
