/**
 * عميل نقطة /api/learning-assessment — أداء التقييمات بتصحيح من طرف الخادم
 * (الإجابات الصحيحة لا تصل للعميل إطلاقًا، راجع lib/api-handlers/learning-assessment.js).
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export type AssessmentQuestion = {
  id: string;
  questionType: "mcq" | "true_false" | "ordering" | "matching" | "short_answer" | "essay";
  questionText: string;
  options: unknown;
  points: number;
};

export type AssessmentPayload = {
  ok: boolean;
  error?: string;
  assessment?: { id: string; title: string; passPercentage: number; maxAttempts: number | null };
  questions?: AssessmentQuestion[];
  attemptsUsed?: number;
};

export async function fetchAssessment(assessmentId: string): Promise<AssessmentPayload> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "مطلوب تسجيل الدخول" };
  const res = await fetch(`/api/learning-assessment?assessment_id=${encodeURIComponent(assessmentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export type SubmitAssessmentResult = {
  ok: boolean;
  error?: string;
  scorePct?: number;
  passed?: boolean;
  passPercentage?: number;
  results?: Record<string, boolean>;
};

export async function submitAssessment(
  assessmentId: string,
  answers: Record<string, unknown>,
  learningItemId?: string,
): Promise<SubmitAssessmentResult> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "مطلوب تسجيل الدخول" };
  const res = await fetch("/api/learning-assessment", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ assessmentId, learningItemId, answers }),
  });
  return res.json();
}
