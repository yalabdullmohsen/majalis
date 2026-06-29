/**
 * Contact chat — types, constants, context helpers
 */

export const MESSAGE_TYPES = [
  { value: "اقتراح", label: "اقتراح" },
  { value: "شكوى", label: "شكوى" },
  { value: "بلاغ خطأ", label: "بلاغ خطأ" },
  { value: "تصحيح معلومة", label: "تصحيح معلومة" },
  { value: "طلب إضافة محتوى", label: "طلب إضافة محتوى" },
  { value: "مشكلة تقنية", label: "مشكلة تقنية" },
  { value: "أخرى", label: "أخرى" },
] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number]["value"];

export const THREAD_STATUSES = [
  "جديدة",
  "مفتوحة",
  "بانتظار رد المستخدم",
  "بانتظار رد الإدارة",
  "مغلقة",
  "مؤرشفة",
] as const;

export type ThreadStatus = (typeof THREAD_STATUSES)[number];

export const PRIORITIES = ["منخفضة", "عادية", "عالية", "حرجة"] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface PageContext {
  pageUrl?: string;
  pageType?: string;
  contentId?: string;
  contentTitle?: string;
  errorId?: string;
  userAgent?: string;
  device?: string;
}

export interface ContactThread {
  id: string;
  access_token: string;
  user_id?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  subject: string;
  message_type: MessageType;
  status: ThreadStatus;
  priority: Priority;
  assigned_to?: string | null;
  context_page_url?: string | null;
  context_page_type?: string | null;
  context_content_id?: string | null;
  context_content_title?: string | null;
  unread_user: number;
  unread_admin: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  thread_id: string;
  sender_role: "user" | "admin" | "system";
  sender_user_id?: string | null;
  body: string;
  status: string;
  is_internal: boolean;
  page_url?: string | null;
  created_at: string;
  attachments?: ContactAttachment[];
}

export interface ContactAttachment {
  id: string;
  message_id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  data_url?: string | null;
}

export interface InternalNote {
  id: string;
  thread_id: string;
  body: string;
  created_at: string;
}

const CONTEXT_KEY = "contact-chat-context";
const GUEST_THREADS_KEY = "contact-chat-guest-threads";

export function savePageContext(ctx: PageContext): void {
  try {
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
  } catch {
    /* ignore */
  }
}

export function loadPageContext(): PageContext | null {
  try {
    const raw = sessionStorage.getItem(CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as PageContext) : null;
  } catch {
    return null;
  }
}

export function clearPageContext(): void {
  sessionStorage.removeItem(CONTEXT_KEY);
}

export function saveGuestThread(id: string, token: string): void {
  try {
    const list = loadGuestThreads();
    if (!list.some((x) => x.id === id)) {
      list.unshift({ id, token });
      localStorage.setItem(GUEST_THREADS_KEY, JSON.stringify(list.slice(0, 20)));
    }
  } catch {
    /* ignore */
  }
}

export function loadGuestThreads(): { id: string; token: string }[] {
  try {
    const raw = localStorage.getItem(GUEST_THREADS_KEY);
    return raw ? (JSON.parse(raw) as { id: string; token: string }[]) : [];
  } catch {
    return [];
  }
}

export function buildContactChatUrl(opts?: {
  threadId?: string;
  token?: string;
  type?: MessageType;
  context?: PageContext;
}): string {
  const params = new URLSearchParams();
  if (opts?.threadId) params.set("thread", opts.threadId);
  if (opts?.token) params.set("token", opts.token);
  if (opts?.type) params.set("type", opts.type);
  if (opts?.context?.pageUrl) params.set("from", opts.context.pageUrl);
  if (opts?.context?.errorId) params.set("error", opts.context.errorId);
  const qs = params.toString();
  return `/contact-chat${qs ? `?${qs}` : ""}`;
}

export function detectPageType(path: string): string {
  if (path.startsWith("/lessons/")) return "lesson";
  if (path.startsWith("/research/")) return "research";
  if (path.startsWith("/quran-scientific-circles/")) return "circle";
  if (path.startsWith("/question-answer")) return "question-answer";
  if (path.startsWith("/admin")) return "admin";
  return "page";
}

export function autoPriority(messageType: MessageType, body: string): Priority {
  const t = `${messageType} ${body}`;
  if (
    messageType === "بلاغ خطأ" ||
    messageType === "تصحيح معلومة" ||
    /آية|حديث|قرآن|فتوى|شرع/i.test(t)
  ) {
    return "عالية";
  }
  if (messageType === "شكوى" || messageType === "مشكلة تقنية") return "عادية";
  return "منخفضة";
}

export async function contactChatApi<T>(
  action: string,
  opts?: { method?: string; body?: unknown; query?: Record<string, string> },
): Promise<T> {
  const params = new URLSearchParams({ action, ...(opts?.query || {}) });
  const res = await fetch(`/api/contact-chat?${params}`, {
    method: opts?.method || (opts?.body ? "POST" : "GET"),
    headers: opts?.body ? { "Content-Type": "application/json" } : undefined,
    credentials: "same-origin",
    body: opts?.body ? JSON.stringify({ action, ...(opts.body as object) }) : undefined,
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.error || "request_failed");
  }
  return data as T;
}
