/**
 * خدمة خارطة طالب العلم — واجهة API للواجهة الأمامية
 */

const BASE = "/api/learning-path";

async function get<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const q = new URLSearchParams({ action, ...params });
  const r = await fetch(`${BASE}?${q}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function post<T>(action: string, body: Record<string, unknown> = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(`${BASE}?action=${action}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LPScience {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  why_study: string | null;
  icon: string;
  color: string;
  sort_order: number;
}

export interface LPLevel {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  color: string;
  books: LPBook[];
}

export interface LPBook {
  id: string;
  title: string;
  author: string | null;
  cover_image_url: string | null;
  summary: string | null;
  difficulty: "easy" | "medium" | "hard";
  estimated_hours: number;
  pages_count: number;
  order_in_level: number;
  pdf_url?: string | null;
  audio_url?: string | null;
}

export interface LPBookDetail extends LPBook {
  science: { id: string; name: string; slug: string; icon: string; color: string };
  level:   { id: string; name: string; slug: string; sort_order: number; color: string };
}

export interface LPExplanation {
  id: string;
  sheikh_name: string;
  type: "audio" | "video" | "text";
  url: string | null;
  notes: string | null;
  sort_order: number;
}

export interface LPBenefit {
  id: string;
  content: string;
  sort_order: number;
}

export interface LPQuiz {
  id: string;
  question: string;
  options: string[];
  sort_order: number;
}

export interface LPProgress {
  book_id: string;
  status: "not_started" | "in_progress" | "completed";
  progress_percent: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface LPAchievement {
  id: string;
  badge_name: string;
  badge_icon: string;
  badge_color: string;
  earned_at: string;
}

export interface LPStreak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function fetchSciences(): Promise<LPScience[]> {
  const r = await get<{ sciences: LPScience[] }>("sciences");
  return r.sciences;
}

export async function fetchScienceDetail(slug: string): Promise<{ science: LPScience; levels: LPLevel[] }> {
  return get("science", { slug });
}

export async function fetchBook(id: string): Promise<{
  book: LPBookDetail;
  explanations: LPExplanation[];
  benefits: LPBenefit[];
  quizzes: LPQuiz[];
}> {
  return get("book", { id });
}

export async function fetchProgress(token: string): Promise<LPProgress[]> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const r = await fetch(`${BASE}?action=progress`, { headers });
  const j = await r.json();
  return j.progress ?? [];
}

export async function updateProgress(
  token: string,
  book_id: string,
  status: LPProgress["status"],
  progress_percent?: number,
): Promise<void> {
  await post("progress", { book_id, status, progress_percent }, token);
}

export async function fetchAchievements(token: string): Promise<LPAchievement[]> {
  const r = await fetch(`${BASE}?action=achievements`, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json();
  return j.achievements ?? [];
}

export async function fetchStreak(token: string): Promise<LPStreak> {
  const r = await fetch(`${BASE}?action=streak`, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json();
  return j.streak ?? { current_streak: 0, longest_streak: 0, last_activity_date: null };
}

export async function submitQuizAnswer(
  token: string,
  quiz_id: string,
  answer: string,
): Promise<{ correct: boolean; explanation: string | null }> {
  return post("quiz-answer", { quiz_id, answer }, token);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const DIFFICULTY_LABELS: Record<LPBook["difficulty"], string> = {
  easy:   "سهل",
  medium: "متوسط",
  hard:   "متقدم",
};

export const STATUS_LABELS: Record<LPProgress["status"], string> = {
  not_started: "لم يبدأ",
  in_progress: "جاري",
  completed:   "مكتمل",
};
