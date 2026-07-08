// خدمة التوصيات الذكية — مجالس

const BASE = "/api/recommendations";

// ── أنواع ────────────────────────────────────────────────────────────────────

export type RecContentType =
  | "lesson" | "hadith" | "fatwa" | "benefit" | "book"
  | "scholar" | "qa" | "ruling" | "story" | "miracle" | "dhikr" | "quran_ayah";

export type RecContext = "home" | "lesson" | "hadith" | "scholar" | "book" | "search" | "profile";

export interface RecommendedItem {
  id: string;
  content_type: RecContentType;
  title?: string;
  question?: string;
  text?: string;
  name?: string;
  category?: string;
  collection?: string;
  author?: string;
  rec_score: number;
}

export interface RecommendationsResponse {
  ok: boolean;
  recommendations: RecommendedItem[];
  context?: RecContext;
  user_id?: string | null;
  pending_setup?: boolean;
  strategies?: Record<string, number>;
  error?: string;
}

export type EventType =
  | "view" | "complete" | "save" | "search"
  | "follow_scholar" | "time_spent" | "share" | "bookmark_remove";

export interface TrackEventPayload {
  event_type: EventType;
  content_id: string;
  content_type: RecContentType;
  value?: number;
  metadata?: Record<string, unknown>;
}

// ── ثوابت التسميات ───────────────────────────────────────────────────────────

export const CONTENT_TYPE_LABEL: Record<RecContentType, string> = {
  lesson:     "درس",
  hadith:     "حديث",
  fatwa:      "فتوى",
  benefit:    "فائدة",
  book:       "كتاب",
  scholar:    "شيخ",
  qa:         "سؤال",
  ruling:     "حكم شرعي",
  story:      "قصة",
  miracle:    "معجزة",
  dhikr:      "ذكر",
  quran_ayah: "آية",
};

export const CONTENT_TYPE_HREF: Record<RecContentType, (id: string) => string> = {
  lesson:     (_id) => `/lessons`,
  hadith:     (_id) => `/hadith`,
  fatwa:      (_id) => `/rulings`,
  benefit:    (_id) => `/fawaid`,
  book:       (_id) => `/library`,
  scholar:    (_id) => `/lessons`,
  qa:         (_id) => `/qa`,
  ruling:     (id)  => `/rulings/${id}`,
  story:      (_id) => `/stories`,
  miracle:    (_id) => `/miracles`,
  dhikr:      (_id) => `/adhkar`,
  quran_ayah: (_id) => `/quran`,
};

export const CONTENT_TYPE_COLOR: Record<RecContentType, string> = {
  lesson:     "var(--majalis-emerald, #0E6E52)",
  hadith:     "#1d4ed8",
  fatwa:      "var(--majalis-emerald, #0E6E52)",
  benefit:    "var(--majalis-emerald-deep, #0A5040)",
  book:       "var(--majalis-emerald, #0E6E52)",
  scholar:    "#7c3aed",
  qa:         "#0369a1",
  ruling:     "var(--majalis-ink-soft, #4A4A4A)",
  story:      "var(--majalis-danger, #9B1C1C)",
  miracle:    "#0c4a6e",
  dhikr:      "var(--majalis-emerald, #0E6E52)",
  quran_ayah: "var(--majalis-emerald, #0E6E52)",
};

// ── مساعدات ──────────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string | null> {
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function getItemTitle(item: RecommendedItem): string {
  return item.title || item.question || item.name || item.text?.slice(0, 80) || "محتوى";
}

export function getItemHref(item: RecommendedItem): string {
  const getter = CONTENT_TYPE_HREF[item.content_type];
  return getter ? getter(item.id) : "/";
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function fetchRecommendations(opts: {
  context?: RecContext;
  contentId?: string;
  contentType?: RecContentType;
  limit?: number;
  depth?: number;
}): Promise<RecommendationsResponse> {
  const params = new URLSearchParams();
  if (opts.context) params.set("context", opts.context);
  if (opts.contentId) params.set("contentId", opts.contentId);
  if (opts.contentType) params.set("contentType", opts.contentType);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.depth) params.set("depth", String(opts.depth));

  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE}?${params}`, { headers });
    return res.json();
  } catch {
    return { ok: false, recommendations: [], error: "خطأ في الاتصال" };
  }
}

export async function fetchRelated(opts: {
  id: string;
  type: RecContentType;
  depth?: number;
  limit?: number;
}): Promise<{ ok: boolean; related: RecommendedItem[]; error?: string }> {
  const params = new URLSearchParams({
    id: opts.id,
    type: opts.type,
    depth: String(opts.depth || 1),
    limit: String(opts.limit || 8),
  });

  try {
    const res = await fetch(`${BASE}/related?${params}`);
    return res.json();
  } catch {
    return { ok: false, related: [], error: "خطأ في الاتصال" };
  }
}

export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  const token = await getAuthToken();
  if (!token) return;

  try {
    await fetch(`${BASE}/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch { /* صامت — لا نوقف UX بسبب خطأ تتبع */ }
}

export async function fetchUserProfile(): Promise<{
  ok: boolean;
  interests?: { interest_score: number; tag: { tag_name_ar: string } }[];
  level?: { level: string; level_score: number } | null;
  error?: string;
}> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "مطلوب تسجيل الدخول" };

  try {
    const res = await fetch(`${BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  } catch {
    return { ok: false, error: "خطأ في الاتصال" };
  }
}

export async function deleteRecommendationProfile(): Promise<{ ok: boolean; error?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "مطلوب تسجيل الدخول" };

  try {
    const res = await fetch(`${BASE}/profile`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  } catch {
    return { ok: false, error: "خطأ في الاتصال" };
  }
}

// Hook بسيط لتسجيل مشاهدة صفحة تلقائياً
export function useTrackView(contentId: string | undefined, contentType: RecContentType) {
  if (typeof window === "undefined" || !contentId) return;
  // تأجيل التسجيل 3 ثوان لضمان أن المشاهدة حقيقية
  const timer = window.setTimeout(() => {
    trackEvent({ event_type: "view", content_id: contentId, content_type: contentType });
  }, 3000);
  return () => window.clearTimeout(timer);
}
