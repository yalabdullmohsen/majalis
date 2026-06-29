/** Global Quality Edition — unified question bank model */

export const QUESTION_STATUSES = ["draft", "review", "published", "archived"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const WORKFLOW_STAGES = [
  "author",
  "linguistic_review",
  "sharia_review",
  "final_approval",
  "published",
] as const;
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export const DIFFICULTIES = ["مبتدئ", "سهل", "متوسط", "متقدم", "خبير"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type QuestionBankItem = {
  id: string;
  question: string;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  explanation: string;
  evidence?: string;
  source: string;
  reference?: string;
  book_name?: string;
  chapter?: string;
  difficulty: Difficulty;
  category_slug: string;
  subcategory_slug?: string;
  keywords: string[];
  language: string;
  reviewed_at?: string;
  last_reviewer?: string;
  status: QuestionStatus;
  workflow_stage: WorkflowStage;
  content_hash: string;
  question_type?: string;
  points?: number;
  linked_lesson_ids?: string[];
};

export type UserQuestionProgress = {
  questionId: string;
  categorySlug: string;
  answered: boolean;
  correct: boolean;
  attempts: number;
  wrongCount: number;
  mastery: number;
  lastAttemptAt: string;
};

export type PurgeReport = {
  generatedAt: string;
  before: { total: number; sources: Record<string, number> };
  removed: { total: number; byReason: Record<string, number> };
  kept: { total: number; published: number; review: number };
  qualityScore: number;
  coverageByCategory: Record<string, number>;
};
