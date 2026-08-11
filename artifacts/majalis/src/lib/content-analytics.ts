import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { allowsAnalytics } from "@/lib/cookie-consent";
import {
  trackAnonymousContentView,
  trackAnonymousSearch,
} from "@/lib/privacy-telemetry";

const SESSION_PREFIX = "majalis-view:";

function sessionKey(contentType: string, contentId: string) {
  return `${SESSION_PREFIX}${contentType}:${contentId}`;
}

/** تسجيل مشاهدة محتوى — مرة واحدة لكل جلسة */
export async function trackContentView(contentType: string, contentId: string) {
  if (!contentId?.trim()) return;
  const key = sessionKey(contentType, contentId);
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* private mode */
  }

  trackAnonymousContentView(contentType, contentId);

  if (!allowsAnalytics() || !isSupabaseConfigured()) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("content_views").insert({
      content_type: contentType,
      content_id: contentId,
      user_id: user?.id ?? null,
    });
  } catch {
    /* non-blocking */
  }
}

/** تسجيل استعلام بحث — طابور مجهول + Supabase عند الموافقة */
export async function trackSearchQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return;

  trackAnonymousSearch(trimmed);

  if (!allowsAnalytics() || !isSupabaseConfigured()) return;

  try {
    await supabase.from("search_queries").insert({ query: trimmed.slice(0, 200) });
  } catch {
    /* table may not exist yet */
  }
}
