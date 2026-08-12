import { requestFetch } from "@/lib/request-manager";
/**
 * Digital Learning Platform — client service
 */

export type LearningPath = {
  slug: string;
  title: string;
  title_en?: string;
  description?: string;
  level: string;
  category?: string;
  estimated_hours?: number;
  progress_pct?: number;
};

export type LearningModule = {
  id: string;
  title: string;
  description?: string;
  module_type: string;
  sort_order: number;
  status?: string;
};

export type UserStats = {
  completed_lessons: number;
  completed_paths: number;
  books_read: number;
  hadith_saved: number;
  quiz_attempts: number;
  achievements_count: number;
  completion_pct: number;
  top_fields: Array<{ slug: string; count: number }>;
  achievements: Array<{ key: string; title: string; earned_at: string }>;
};

export type QuizQuestion = {
  id: string;
  question_type: string;
  question: string;
  options?: string[];
  explanation?: string;
  reference_source?: string;
};

export type Certificate = {
  certificate_code: string;
  title: string;
  path_slug?: string;
  score_pct?: number;
  issued_at: string;
  qr_data?: string;
};

const LEVEL_LABELS: Record<string, string> = {
  foundation:   "تأسيسي",
  beginner:     "مبتدئ",
  intermediate: "متوسط",
  advanced:     "متقدم",
};

export function levelLabel(level: string) {
  return LEVEL_LABELS[level] || level;
}

const MODULE_LABELS: Record<string, string> = {
  lesson: "درس",
  book: "كتاب",
  lecture: "درس",
  quiz: "اختبار",
  task: "مهمة",
  video: "فيديو",
};

export function moduleLabel(type: string) {
  return MODULE_LABELS[type] || type;
}

async function dlFetch(action: string, opts?: { method?: string; body?: Record<string, unknown>; params?: Record<string, string> }) {
  const params = new URLSearchParams({ action, ...(opts?.params || {}) });
  const res = await requestFetch(`/api/digital-learning?${params}`, {
    method: opts?.method || "GET",
    headers: opts?.body ? { "Content-Type": "application/json" } : undefined,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(`DL API ${action} failed`);
  return res.json();
}

export async function fetchLearningPaths(): Promise<LearningPath[]> {
  const json = await dlFetch("paths");
  return json.paths || [];
}

export async function fetchLearningPath(slug: string) {
  return dlFetch("path", { params: { slug } });
}

export async function enrollInLearningPath(slug: string, pathId?: string) {
  return dlFetch("enroll", { method: "POST", body: { slug, pathId } });
}

export async function updateLearningProgress(body: { pathSlug: string; moduleId: string; status: string; notes?: string }) {
  return dlFetch("progress", { method: "POST", body });
}

export async function fetchUserProgress() {
  return dlFetch("progress");
}

export async function fetchUserLearningStats(): Promise<UserStats> {
  const json = await dlFetch("stats");
  return json.stats;
}

export async function fetchLearningQuiz(slug: string) {
  const json = await dlFetch("quiz", { params: { slug } });
  return json.quiz;
}

export async function submitLearningQuiz(quizId: string, answers: Record<string, unknown>) {
  return dlFetch("quiz", { method: "POST", body: { quizId, answers } });
}

export async function issueLearningCertificate(pathSlug: string, scorePct: number) {
  return dlFetch("certificate", { method: "POST", body: { pathSlug, scorePct } });
}

export async function verifyLearningCertificate(code: string) {
  return dlFetch("certificate", { params: { verify: "1", code } });
}

export async function fetchUserCertificates(): Promise<Certificate[]> {
  const json = await dlFetch("certificate");
  return json.certificates || [];
}

export async function fetchLearningCalendar() {
  const json = await dlFetch("calendar");
  return json.events || [];
}

export async function subscribeLearningEvent(eventId: string) {
  return dlFetch("calendar", { method: "POST", body: { eventId } });
}

export async function fetchPersonalLibrary(type?: string) {
  const json = await dlFetch("library", { params: type ? { type } : {} });
  return json.items || [];
}

export async function saveToPersonalLibrary(item: { item_type: string; content_id?: string; title: string; content_url?: string }) {
  return dlFetch("library", { method: "POST", body: item });
}

export async function saveLearningNote(note: { pathSlug?: string; moduleId?: string; title?: string; body: string }) {
  return dlFetch("notes", { method: "POST", body: note });
}

export async function fetchLearningNotes() {
  const json = await dlFetch("notes");
  return json.notes || [];
}

export async function fetchLessonInsights(body: { pathSlug: string; moduleId: string; moduleTitle: string }) {
  return dlFetch("ai-insights", { method: "POST", body });
}
